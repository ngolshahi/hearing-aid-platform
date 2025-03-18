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
    }
}