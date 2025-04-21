package controller

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import service.EmailVerificationService
import model.VerificationToken

class EmailVerificationController(private val emailVerificationService: EmailVerificationService) {
    fun Route.registerRoutes() {
        route("/api/verification") {
            post("/create") {
                val email = call.request.queryParameters["email"] 
                    ?: return@post call.respond(HttpStatusCode.BadRequest, "Email is required")
                
                val token = emailVerificationService.createVerificationToken(email)
                call.respond(HttpStatusCode.Created, token)
            }
            
            post("/verify") {
                val email = call.request.queryParameters["email"]
                    ?: return@post call.respond(HttpStatusCode.BadRequest, "Email is required")
                val token = call.request.queryParameters["token"]
                    ?: return@post call.respond(HttpStatusCode.BadRequest, "Token is required")
                
                val verified = emailVerificationService.verifyToken(email, token)
                if (verified) {
                    call.respond(HttpStatusCode.OK, "Email verified successfully")
                } else {
                    call.respond(HttpStatusCode.BadRequest, "Invalid or expired token")
                }
            }
            
            get("/status") {
                val email = call.request.queryParameters["email"]
                    ?: return@get call.respond(HttpStatusCode.BadRequest, "Email is required")
                
                val isVerified = emailVerificationService.isEmailVerified(email)
                call.respond(mapOf("verified" to isVerified))
            }
        }
    }
} 