// routes/AudiologistRoutes.kt
package routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import services.AudiologistService
import kotlinx.serialization.Serializable
import io.ktor.server.request.*
import model.Audiologist
import model.LoginRequest
import model.AuthResponse



fun Route.audiologistRoutes() {
    val audiologistService = AudiologistService()
    
    route("/api/audiologists") {
        get {
            try {
                val audiologists = audiologistService.getAllAudiologists()
                call.respond(HttpStatusCode.OK, audiologists)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch audiologists: ${e.message}")
                )
            }
        }
        
        get("/{id}") {
            try {
                val id = call.parameters["id"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest, 
                    mapOf("message" to "Missing ID parameter")
                )
                
                val audiologist = audiologistService.getAudiologistById(id)

                if (audiologist != null) {
                    call.respond(HttpStatusCode.OK, audiologist)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("message" to "Audiologist not found"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch audiologist: ${e.message}")
                )
            }
        }
        put("/{id}") {
            try {
                val id = call.parameters["id"] ?: return@put call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing ID parameter")
                )
                
                val audiologist = call.receive<Audiologist>()
                
                // Ensure the ID in the path matches the ID in the body
                if (id != audiologist.id) {
                    return@put call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("message" to "ID in path does not match ID in request body")
                    )
                }
                
                val updatedAudiologist = audiologistService.updateAudiologist(audiologist)

                if (updatedAudiologist != null) {
                    call.respond(HttpStatusCode.OK, updatedAudiologist)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("message" to "Failed to update audiologist"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to update audiologist: ${e.message}")
                )
            }
        }
        post("/login") {
            try {
                val loginRequest = call.receive<LoginRequest>()
                val audiologist = audiologistService.authenticateAudiologist(loginRequest.email, loginRequest.password)
                
                if (audiologist != null) {  // Change this condition
                    call.respond(HttpStatusCode.OK, audiologist)
                } else {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("message" to "Failed to login"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.BadRequest, 
                    mapOf("message" to "Failed to login")
                )
            }
        }
    }
}