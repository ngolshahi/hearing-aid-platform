package routes

import services.HearingAidService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.hearingAidRoutes() {
    val hearingAidService = HearingAidService()

    route("/api/hearingAids") {
        get {
            try {
                val hearingAids = hearingAidService.getAllHearingAids()
                call.respond(HttpStatusCode.OK, hearingAids)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch hearing aids")
                )
            }
        }
        
        get("/{id}") {
            try {
                val id = call.parameters["id"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing ID parameter")
                )
                
                val hearingAid = hearingAidService.getHearingAidById(id)
                if (hearingAid != null) {
                    call.respond(HttpStatusCode.OK, hearingAid)
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        mapOf("message" to "Hearing aid not found")
                    )
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch hearing aid")
                )
            }
        }
    }
}