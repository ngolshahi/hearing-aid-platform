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

/**
 * Data model for ear detection results
 */
data class EarDetectionResult(
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val confidence: Double = 1.0
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
    
    // Skin color ranges for different skin tones
    private val skinColorRanges = listOf(
        // Lighter skin tones
        SkinColorRange(180, 255, 130, 220, 100, 200),
        // Medium skin tones
        SkinColorRange(120, 220, 70, 170, 45, 150),
        // Darker skin tones
        SkinColorRange(60, 160, 40, 120, 25, 100)
    )
    
    /**
     * Data class for skin color ranges
     */
    private data class SkinColorRange(
        val rMin: Int, val rMax: Int,
        val gMin: Int, val gMax: Int,
        val bMin: Int, val bMax: Int
    )
    
    /**
     * Process an image to add a hearing aid AR overlay
     * 
     * @param base64Image Base64 encoded image data
     * @param productId ID of the hearing aid product
     * @return Base64 encoded processed image
     */
    fun processImage(base64Image: String, productId: String): String {
        try {
            // Decode base64 image
            val imageBytes = Base64.getDecoder().decode(base64Image)
            val inputStream = ByteArrayInputStream(imageBytes)
            val originalImage = ImageIO.read(inputStream)
            
            if (originalImage == null) {
                throw IllegalArgumentException("Invalid image data")
            }
            
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
        } catch (e: Exception) {
            // Log the error for debugging
            System.err.println("Error processing image: ${e.message}")
            e.printStackTrace()
            
            // Re-throw to be handled by the controller
            throw e
        }
    }
    
    /**
     * Detect ear in an image using improved color-based detection
     */
    private fun detectEar(image: BufferedImage): EarDetectionResult? {
        return detectEarWithMultipleSkinTones(image)
    }
    
    /**
     * Improved ear detection using multiple skin tone ranges and shape analysis
     */
    private fun detectEarWithMultipleSkinTones(image: BufferedImage): EarDetectionResult? {
        val imgWidth = image.width
        val imgHeight = image.height
        
        // Create a binary mask of potential ear pixels
        val earMask = Array(imgHeight) { BooleanArray(imgWidth) { false } }
        var earPixelCount = 0
        
        // Scan image and mark pixels that match any skin tone range
        for (y in 0 until imgHeight) {
            for (x in 0 until imgWidth) {
                val rgb = image.getRGB(x, y)
                val color = Color(rgb)
                
                // Check against all skin color ranges
                val isSkinPixel = skinColorRanges.any { range ->
                    color.red in range.rMin..range.rMax && 
                    color.green in range.gMin..range.gMax && 
                    color.blue in range.bMin..range.bMax
                }
                
                if (isSkinPixel) {
                    earMask[y][x] = true
                    earPixelCount++
                }
            }
        }
        
        // Return null if not enough skin pixels found
        if (earPixelCount < 200) {
            return null
        }
        
        // Find connected regions of skin pixels (simplified approach)
        val regions = findConnectedRegions(earMask, imgWidth, imgHeight)
        
        // If no regions found, return null
        if (regions.isEmpty()) {
            return null
        }
        
        // Find the most ear-like region based on size and aspect ratio
        var bestRegion: EarDetectionResult? = null
        var bestScore = 0.0
        
        for (region in regions) {
            val aspectRatio = region.height.toFloat() / region.width.toFloat()
            
            // Ears typically have aspect ratio ~1.3-2.5
            if (aspectRatio < 0.8 || aspectRatio > 3.0 || region.width < 40) {
                continue
            }
            
            // Score based on size and aspect ratio (larger is better, aspect ~1.5-2.0 is ideal)
            val sizeScore = region.width * region.height / 10000.0
            val aspectScore = if (aspectRatio in 1.3..2.5) 1.0 else 0.5
            val totalScore = sizeScore * aspectScore
            
            if (totalScore > bestScore) {
                bestScore = totalScore
                bestRegion = region
            }
        }
        
        return bestRegion
    }
    
    /**
     * Find connected regions in a binary mask
     */
    private fun findConnectedRegions(mask: Array<BooleanArray>, width: Int, height: Int): List<EarDetectionResult> {
        val visited = Array(height) { BooleanArray(width) { false } }
        val regions = mutableListOf<EarDetectionResult>()
        
        for (y in 0 until height) {
            for (x in 0 until width) {
                if (mask[y][x] && !visited[y][x]) {
                    // Start flood fill from this pixel
                    val region = floodFill(mask, visited, x, y, width, height)
                    if (region != null) {
                        regions.add(region)
                    }
                }
            }
        }
        
        return regions
    }
    
    /**
     * Flood fill algorithm to find connected regions
     */
    private fun floodFill(
        mask: Array<BooleanArray>,
        visited: Array<BooleanArray>,
        startX: Int,
        startY: Int,
        width: Int,
        height: Int
    ): EarDetectionResult? {
        // Use a queue for flood fill
        val queue = LinkedList<Pair<Int, Int>>()
        queue.add(Pair(startX, startY))
        
        var minX = width
        var minY = height
        var maxX = 0
        var maxY = 0
        var pixelCount = 0
        
        while (queue.isNotEmpty()) {
            val (x, y) = queue.poll()
            
            // Skip if outside bounds, already visited, or not an ear pixel
            if (x < 0 || y < 0 || x >= width || y >= height || visited[y][x] || !mask[y][x]) {
                continue
            }
            
            // Mark as visited
            visited[y][x] = true
            pixelCount++
            
            // Update bounds
            minX = minOf(minX, x)
            minY = minOf(minY, y)
            maxX = maxOf(maxX, x)
            maxY = maxOf(maxY, y)
            
            // Add neighbors to queue
            queue.add(Pair(x + 1, y))
            queue.add(Pair(x - 1, y))
            queue.add(Pair(x, y + 1))
            queue.add(Pair(x, y - 1))
        }
        
        // If region is too small, return null
        if (pixelCount < 200) {
            return null
        }
        
        val regionWidth = maxX - minX + 1
        val regionHeight = maxY - minY + 1
        
        return EarDetectionResult(
            x = minX,
            y = minY,
            width = regionWidth,
            height = regionHeight,
            confidence = pixelCount.toDouble() / (regionWidth * regionHeight)
        )
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
        // Position closer to the front of the ear (about 30% from the left edge)
        val hearingAidX = ear.x + (ear.width * 0.3).toInt()
        val hearingAidY = ear.y + (ear.height * 0.25).toInt() // Position at the upper part of the ear
        
        // Scale hearing aid size relative to ear
        val hearingAidScale = ear.width / 180.0
        val bodyWidth = (30 * hearingAidScale).toInt()
        val bodyHeight = (45 * hearingAidScale).toInt()
        
        // Draw hearing aid body (main part)
        g2d.color = hearingAidColor
        val body = Ellipse2D.Double(
            (hearingAidX - bodyWidth / 2).toDouble(),
            (hearingAidY - bodyHeight / 2).toDouble(),
            bodyWidth.toDouble(),
            bodyHeight.toDouble()
        )
        g2d.fill(body)
        
        // Draw hearing aid details
        g2d.color = Color(255, 255, 255, 76)  // Translucent white
        val detail = Ellipse2D.Double(
            (hearingAidX - bodyWidth * 0.4),
            (hearingAidY - bodyHeight * 0.4),
            (bodyWidth * 0.6),
            (bodyHeight * 0.5)
        )
        g2d.fill(detail)
        
        // Draw hearing aid tube
        g2d.color = hearingAidColor
        g2d.stroke = java.awt.BasicStroke((bodyWidth * 0.3).toFloat(), java.awt.BasicStroke.CAP_ROUND, java.awt.BasicStroke.JOIN_ROUND)
        
        // Draw a curved tube instead of a straight line
        val curve = java.awt.geom.QuadCurve2D.Double(
            hearingAidX.toDouble(),
            (hearingAidY + bodyHeight * 0.5).toDouble(),
            (hearingAidX + bodyWidth * 0.5).toDouble(),
            (hearingAidY + bodyHeight).toDouble(),
            (hearingAidX + bodyWidth).toDouble(),
            (hearingAidY + bodyHeight * 1.2).toDouble()
        )
        g2d.draw(curve)
        
        // Add highlight to make it look more 3D
        g2d.color = Color(255, 255, 255, 100)
        val highlight = Ellipse2D.Double(
            (hearingAidX - bodyWidth / 3).toDouble(),
            (hearingAidY - bodyHeight / 3).toDouble(),
            (bodyWidth / 4).toDouble(),
            (bodyHeight / 5).toDouble()
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
        // Check cache first
        modelCache[hearingAidId]?.let { return it }
        
        // Get hearing aid data
        val hearingAid = hearingAidRepository.getHearingAidById(hearingAidId)
            ?: throw IllegalArgumentException("Hearing aid with ID $hearingAidId not found")
        
        // Determine model type based on hearing aid type
        val modelType = when {
            hearingAid.type.contains("RIC", ignoreCase = true) -> "ric"
            hearingAid.type.contains("BTE", ignoreCase = true) -> "bte"
            hearingAid.type.contains("ITC", ignoreCase = true) -> "itc"
            hearingAid.type.contains("CIC", ignoreCase = true) -> "cic"
            else -> "ric" // Default to RIC
        }
        
        // Create texture map based on available colors
        val textureMap = hearingAid.colors.associate { color ->
            // Extract color name (e.g., "#A0A0A0" -> "silver")
            val colorName = getColorName(color)
            colorName to "/models/textures/$modelType-$colorName.png"
        }
        
        // Create model data
        val modelData = HearingAidModelData(
            id = hearingAidId,
            modelType = modelType,
            modelPath = "/models/$modelType.glb",
            textureMap = textureMap
        )
        
        // Cache the data
        modelCache[hearingAidId] = modelData
        
        return modelData
    }
    
    /**
     * Get a human-readable color name from a hex color value
     */
    private fun getColorName(hexColor: String): String {
        return when (hexColor.toLowerCase()) {
            "#4e312d" -> "chestnut"
            "#bec2cb" -> "silver"
            "#708090" -> "graphite"
            "#cd7f32" -> "bronze"
            "#f7e7ce" -> "beige"
            "#ffffff" -> "white"
            "#000000" -> "black"
            else -> "default"
        }
    }
} 