// routes/AudiologistRoutes.kt
package routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import services.AudiologistService

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
                call.respond(HttpStatusCode.OK, audiologist)
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
                call.respond(HttpStatusCode.OK, updatedAudiologist)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to update audiologist: ${e.message}")
                )
            }
        }
    }
}