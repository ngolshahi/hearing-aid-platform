package routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import services.AppointmentService
import model.AppointmentRequest

fun Route.appointmentRoutes() {
    val appointmentService = AppointmentService()

    route("/api/appointments") {
        get("/available") {
            try {
                val date = call.parameters["date"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing date parameter")
                )
                
                val appointmentTypeId = call.parameters["appointmentTypeId"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing appointmentTypeId parameter")
                )
                
                val availableSlots = appointmentService.getAvailableTimeSlots(date, appointmentTypeId)
                call.respond(HttpStatusCode.OK, availableSlots)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch available slots: ${e.message}")
                )
            }
        }
        
        post("/book") {
            try {
                val appointmentRequest = call.receive<AppointmentRequest>()
                val response = appointmentService.bookAppointment(appointmentRequest)
                
                if (response.success) {
                    call.respond(HttpStatusCode.Created, response)
                } else {
                    call.respond(HttpStatusCode.BadRequest, response)
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to book appointment: ${e.message}")
                )
            }
        }

        get("/user/{userId}") {
            try {
                val userId = call.parameters["userId"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing userId parameter")
                )
                
                val appointments = appointmentService.getUserAppointments(userId)
                call.respond(HttpStatusCode.OK, appointments)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch appointments: ${e.message}")
                )
            }
        }

        get("/available-audiologist") {
            try {
                val date = call.parameters["date"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing date parameter")
                )
                
                val time = call.parameters["time"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing time parameter")
                )
                
                val appointmentTypeId = call.parameters["appointmentTypeId"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing appointmentTypeId parameter")
                )
                
                val audiologist = appointmentService.findAvailableAudiologist(date, time, appointmentTypeId)
                if (audiologist != null) {
                    call.respond(HttpStatusCode.OK, audiologist)
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        mapOf("message" to "No available audiologist found for the selected time slot")
                    )
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to find available audiologist: ${e.message}")
                )
            }
        }

        get("/audiologist/{audiologistId}") {
            try {
                val audiologistId = call.parameters["audiologistId"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing audiologistId parameter")
                )
                
                val appointments = appointmentService.getAudiologistAppointments(audiologistId)
                call.respond(HttpStatusCode.OK, appointments)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to fetch audiologist appointments: ${e.message}")
                )
            }
        }
    }
}