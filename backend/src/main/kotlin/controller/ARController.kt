package controller

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import services.ARService
import java.util.*

/**
 * Request model for processing an image with AR overlay
 */
@Serializable
data class ARImageProcessRequest(
    val image: String, // Base64 encoded image
    val productId: String
)

/**
 * Response model for processed AR image
 */
@Serializable
data class ARImageProcessResponse(
    val processedImage: String, // Base64 encoded image with AR overlay
    val success: Boolean = true,
    val message: String? = null,
    val fallbackMode: Boolean = false
)

/**
 * Controller for AR-related functionality
 */
class ARController(private val arService: ARService) {

    /**
     * Configure routes for AR functionality
     */
    fun configureRoutes(routing: Routing) {
        routing.route("/api/ar") {
            // Process an image with AR hearing aid overlay
            post("/process-image") {
                try {
                    val request = call.receive<ARImageProcessRequest>()
                    
                    // Validate the request
                    if (request.image.isBlank()) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ARImageProcessResponse(
                                processedImage = "",
                                success = false,
                                message = "Image data is required"
                            )
                        )
                        return@post
                    }
                    
                    // Check if image is a valid base64 string
                    if (!isValidBase64(request.image)) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            ARImageProcessResponse(
                                processedImage = "",
                                success = false,
                                message = "Invalid image data format. Expected base64 encoded image."
                            )
                        )
                        return@post
                    }
                    
                    try {
                        // Process the image
                        val processedImage = arService.processImage(request.image, request.productId)
                        
                        // Respond with the processed image
                        call.respond(
                            HttpStatusCode.OK,
                            ARImageProcessResponse(
                                processedImage = processedImage
                            )
                        )
                    } catch (e: IllegalArgumentException) {
                        // Handle specific known errors with appropriate messages
                        val isFallback = e.message?.contains("fallback", ignoreCase = true) ?: false
                        
                        if (isFallback) {
                            // This is a case where we're using the fallback center position
                            val processedImage = arService.processImage(request.image, request.productId)
                            call.respond(
                                HttpStatusCode.OK,
                                ARImageProcessResponse(
                                    processedImage = processedImage,
                                    success = true,
                                    message = "Used approximate ear position, results may not be perfect",
                                    fallbackMode = true
                                )
                            )
                        } else if (e.message?.contains("hearing aid", ignoreCase = true) == true) {
                            // Product not found
                            call.respond(
                                HttpStatusCode.NotFound,
                                ARImageProcessResponse(
                                    processedImage = "",
                                    success = false,
                                    message = "Hearing aid product not found: ${e.message}"
                                )
                            )
                        } else {
                            // Other validation errors
                            call.respond(
                                HttpStatusCode.BadRequest,
                                ARImageProcessResponse(
                                    processedImage = "",
                                    success = false,
                                    message = e.message ?: "Invalid request parameters"
                                )
                            )
                        }
                    }
                } catch (e: Exception) {
                    // Log the error for debugging
                    System.err.println("Error processing AR image: ${e.message}")
                    e.printStackTrace()
                    
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ARImageProcessResponse(
                            processedImage = "",
                            success = false,
                            message = "Server error processing image. Please try again or use a different image."
                        )
                    )
                }
            }
            
            // Route to get AR model data for a hearing aid (for future 3D implementation)
            get("/models/{id}") {
                try {
                    val hearingAidId = call.parameters["id"] ?: run {
                        call.respond(HttpStatusCode.BadRequest, "Hearing aid ID is required")
                        return@get
                    }
                    
                    val modelData = arService.getHearingAidModelData(hearingAidId)
                    call.respond(HttpStatusCode.OK, modelData)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        "Failed to get model data: ${e.message}"
                    )
                }
            }
        }
    }
    
    /**
     * Validate if a string is valid base64
     */
    private fun isValidBase64(base64String: String): Boolean {
        return try {
            // Try to decode a small portion to validate format
            val testString = if (base64String.length > 100) base64String.substring(0, 100) else base64String
            Base64.getDecoder().decode(testString)
            true
        } catch (e: Exception) {
            false
        }
    }
} 