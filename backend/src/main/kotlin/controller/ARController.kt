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
    val message: String? = null
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
                    
                    // Process the image
                    val processedImage = arService.processImage(request.image, request.productId)
                    
                    // Respond with the processed image
                    call.respond(
                        HttpStatusCode.OK,
                        ARImageProcessResponse(
                            processedImage = processedImage
                        )
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ARImageProcessResponse(
                            processedImage = "",
                            success = false,
                            message = "Failed to process image: ${e.message}"
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
} 