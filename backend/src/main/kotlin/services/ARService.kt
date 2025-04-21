package services

import java.awt.Color
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.geom.Ellipse2D
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.*
import javax.imageio.ImageIO
import repository.HearingAidRepository
import kotlinx.serialization.Serializable
import com.azure.ai.vision.imageanalysis.ImageAnalysisClient
import com.azure.ai.vision.imageanalysis.ImageAnalysisClientBuilder
import com.azure.ai.vision.imageanalysis.models.VisualFeatures
import com.azure.core.credential.AzureKeyCredential

/**
 * Data model for ear detection results
 */
data class EarDetectionResult(
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int
)

/**
 * Data model for hearing aid model data
 */
@Serializable
data class HearingAidModelData(
    val id: String,
    val modelType: String,
    val modelPath: String,
    val textureMap: Map<String, String>
)

/**
 * Service for AR functionality, including image processing
 */
class ARService(
    private val hearingAidRepository: HearingAidRepository,
    private val azureVisionKey: String?,
    private val azureVisionEndpoint: String?
) {
    // Cache hearing aid model data
    private val modelCache = mutableMapOf<String, HearingAidModelData>()
    
    // Create Azure Computer Vision client if credentials are available
    private val visionClient = if (!azureVisionKey.isNullOrBlank() && !azureVisionEndpoint.isNullOrBlank()) {
        ImageAnalysisClientBuilder()
            .endpoint(azureVisionEndpoint)
            .credential(AzureKeyCredential(azureVisionKey))
            .buildClient()
    } else {
        null
    }
    
    /**
     * Process an image to add a hearing aid AR overlay
     * 
     * @param base64Image Base64 encoded image data
     * @param productId ID of the hearing aid product
     * @return Base64 encoded processed image
     */
    fun processImage(base64Image: String, productId: String): String {
        // Decode base64 image
        val imageBytes = Base64.getDecoder().decode(base64Image)
        val inputStream = ByteArrayInputStream(imageBytes)
        val originalImage = ImageIO.read(inputStream)
        
        // Get hearing aid data
        val hearingAid = hearingAidRepository.getHearingAidById(productId)
            ?: throw IllegalArgumentException("Hearing aid with ID $productId not found")
        
        // Detect ear in the image
        val earRegion = detectEar(originalImage)
            ?: throw IllegalArgumentException("No ear detected in the image")
        
        // Create a copy of the original image for processing
        val processedImage = BufferedImage(
            originalImage.width, 
            originalImage.height, 
            BufferedImage.TYPE_INT_ARGB
        )
        
        val g2d = processedImage.createGraphics()
        g2d.setRenderingHint(
            RenderingHints.KEY_ANTIALIASING,
            RenderingHints.VALUE_ANTIALIAS_ON
        )
        
        // Draw original image
        g2d.drawImage(originalImage, 0, 0, null)
        
        // Draw hearing aid based on ear position
        drawHearingAid(g2d, earRegion, hearingAid)
        
        // Add product info overlay
        drawProductInfo(g2d, earRegion, hearingAid)
        
        g2d.dispose()
        
        // Convert processed image to base64
        val outputStream = ByteArrayOutputStream()
        ImageIO.write(processedImage, "png", outputStream)
        val processedBytes = outputStream.toByteArray()
        
        return Base64.getEncoder().encodeToString(processedBytes)
    }
    
    /**
     * Detect ear in an image using either Azure Computer Vision or fallback to color-based detection
     */
    private fun detectEar(image: BufferedImage): EarDetectionResult? {
        // Try Azure Computer Vision if available
        return if (visionClient != null) {
            detectEarWithAzure(image)
        } else {
            // Fallback to basic color-based detection
            detectEarByColor(image)
        }
    }
    
    /**
     * Detect ear using Azure Computer Vision
     */
    private fun detectEarWithAzure(image: BufferedImage): EarDetectionResult? {
        try {
            // Convert BufferedImage to byte array
            val outputStream = ByteArrayOutputStream()
            ImageIO.write(image, "jpg", outputStream)
            val imageBytes = outputStream.toByteArray()
            
            // Analyze image using Azure Computer Vision
            val analysisResult = visionClient?.analyzeFromBytes(
                imageBytes,
                listOf(VisualFeatures.OBJECTS, VisualFeatures.PEOPLE),
                null, null, null
            )
            
            // Look for detected objects that might be ears
            // Note: This is simplified and would need refinement in a production system
            val detectedObjects = analysisResult?.objects()
            
            // Try to find an ear-shaped object
            val earObject = detectedObjects?.firstOrNull { 
                it.tags().any { tag -> tag.name().contains("ear", ignoreCase = true) }
            }
            
            // Return detected ear region if found
            return earObject?.let {
                val bbox = it.boundingBox()
                EarDetectionResult(
                    x = bbox.x().toInt(),
                    y = bbox.y().toInt(),
                    width = bbox.width().toInt(),
                    height = bbox.height().toInt()
                )
            }
        } catch (e: Exception) {
            // Log error and fall back to color-based detection
            println("Azure Vision API error: ${e.message}")
            return detectEarByColor(image)
        }
    }
    
    /**
     * Basic ear detection using color heuristics
     * This is a simplified approach and would be replaced with a more robust ML-based 
     * solution in a production environment
     */
    private fun detectEarByColor(image: BufferedImage): EarDetectionResult? {
        // Define skin color range (very simplified)
        val minRed = 150
        val maxRed = 240
        val minGreen = 100
        val maxGreen = 220
        val minBlue = 80
        val maxBlue = 200
        
        val width = image.width
        val height = image.height
        
        // Track ear pixel bounds
        var minX = width
        var minY = height
        var maxX = 0
        var maxY = 0
        var earPixelCount = 0
        
        // Scan image for skin-colored pixels
        for (y in 0 until height) {
            for (x in 0 until width) {
                val rgb = image.getRGB(x, y)
                val color = Color(rgb)
                
                // Check if pixel is in skin color range
                if (color.red in minRed..maxRed && 
                    color.green in minGreen..maxGreen && 
                    color.blue in minBlue..maxBlue) {
                    
                    // Update bounds
                    minX = minOf(minX, x)
                    minY = minOf(minY, y)
                    maxX = maxOf(maxX, x)
                    maxY = maxOf(maxY, y)
                    earPixelCount++
                }
            }
        }
        
        // Return null if not enough skin pixels found
        if (earPixelCount < 100) {
            return null
        }
        
        val width = maxX - minX
        val height = maxY - minY
        
        // Rudimentary validation - ears typically have aspect ratio ~1.5-2
        val aspectRatio = height.toFloat() / width.toFloat()
        if (aspectRatio < 1.0 || aspectRatio > 3.0 || width < 50) {
            return null
        }
        
        return EarDetectionResult(minX, minY, width, height)
    }
    
    /**
     * Draw a hearing aid onto the ear region of the image
     */
    private fun drawHearingAid(g2d: Graphics2D, ear: EarDetectionResult, hearingAid: model.HearingAid) {
        // Choose color from hearing aid data
        val hearingAidColor = if (hearingAid.colors.isNotEmpty()) {
            try {
                Color.decode(hearingAid.colors[0])
            } catch (e: Exception) {
                Color.LIGHT_GRAY
            }
        } else {
            Color.LIGHT_GRAY
        }
        
        // Calculate hearing aid position based on ear region
        val hearingAidX = ear.x + (ear.width * 0.2).toInt()
        val hearingAidY = ear.y + (ear.height * 0.3).toInt()
        
        // Scale hearing aid size relative to ear
        val hearingAidScale = ear.width / 200.0
        val bodyWidth = (80 * hearingAidScale * 0.3).toInt()
        val bodyHeight = (80 * hearingAidScale * 0.3).toInt()
        
        // Draw hearing aid body (main part)
        g2d.color = hearingAidColor
        val body = Ellipse2D.Double(
            (hearingAidX - bodyWidth / 2).toDouble(),
            (hearingAidY - bodyHeight / 2).toDouble(),
            bodyWidth.toDouble(),
            bodyHeight.toDouble()
        )
        g2d.fill(body)
        
        // Draw hearing aid tube
        g2d.stroke = java.awt.BasicStroke((5 * hearingAidScale).toFloat())
        g2d.drawLine(
            hearingAidX,
            hearingAidY,
            hearingAidX + (30 * hearingAidScale).toInt(),
            hearingAidY + (40 * hearingAidScale).toInt()
        )
        
        // Add highlight to make it look more 3D
        g2d.color = Color(255, 255, 255, 100)
        val highlight = Ellipse2D.Double(
            (hearingAidX - bodyWidth / 4).toDouble(),
            (hearingAidY - bodyHeight / 4).toDouble(),
            (bodyWidth / 3).toDouble(),
            (bodyHeight / 3).toDouble()
        )
        g2d.fill(highlight)
    }
    
    /**
     * Draw product information overlay
     */
    private fun drawProductInfo(g2d: Graphics2D, ear: EarDetectionResult, hearingAid: model.HearingAid) {
        val labelWidth = ear.width
        val labelHeight = 30
        val labelX = ear.x
        val labelY = ear.y + ear.height + 10
        
        // Draw label background
        g2d.color = Color(0, 0, 0, 180)
        g2d.fillRect(labelX, labelY, labelWidth, labelHeight)
        
        // Draw product name
        g2d.color = Color.WHITE
        g2d.font = java.awt.Font("Arial", java.awt.Font.BOLD, 14)
        
        val metrics = g2d.fontMetrics
        val textWidth = metrics.stringWidth(hearingAid.name)
        val textX = labelX + (labelWidth - textWidth) / 2
        val textY = labelY + (labelHeight - metrics.height) / 2 + metrics.ascent
        
        g2d.drawString(hearingAid.name, textX, textY)
    }
    
    /**
     * Get hearing aid 3D model data for AR visualization
     */
    fun getHearingAidModelData(hearingAidId: String): HearingAidModelData {
        // Return from cache if available
        modelCache[hearingAidId]?.let { return it }
        
        // Get hearing aid data
        val hearingAid = hearingAidRepository.getHearingAidById(hearingAidId)
            ?: throw IllegalArgumentException("Hearing aid with ID $hearingAidId not found")
        
        // Get model type from hearing aid data
        val modelType = hearingAid.visualiserConfig?.modelType ?: "mric-r"
        
        // Create model texture map based on available colors
        val textureMap = hearingAid.colors.associateWith { color ->
            "/models/textures/$modelType-$color.png"
        }
        
        // Create and cache model data
        val modelData = HearingAidModelData(
            id = hearingAidId,
            modelType = modelType,
            modelPath = "/models/$modelType.glb",
            textureMap = textureMap
        )
        
        modelCache[hearingAidId] = modelData
        return modelData
    }
} 