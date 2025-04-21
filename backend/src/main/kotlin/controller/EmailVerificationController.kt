package controller

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import service.EmailVerificationService
import model.VerificationToken
import kotlinx.serialization.Serializable

@Serializable
data class VerificationResponse(
    val email: String,
    val token: String,
    val message: String
)

class EmailVerificationController(private val emailVerificationService: EmailVerificationService) {
    fun Route.registerRoutes() {
        route("/api/verification") {
            post("/create") {
                val email = call.request.queryParameters["email"] 
                    ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Email is required"))
                
                val token = emailVerificationService.createVerificationToken(email)
                call.respond(
                    HttpStatusCode.Created, 
                    VerificationResponse(
                        email = token.email,
                        token = token.token,
                        message = "Verification token created successfully"
                    )
                )
            }
            
            post("/verify") {
                val email = call.request.queryParameters["email"]
                    ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Email is required"))
                val token = call.request.queryParameters["token"]
                    ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Token is required"))
                
                val verified = emailVerificationService.verifyToken(email, token)
                if (verified) {
                    call.respond(HttpStatusCode.OK, mapOf("message" to "Email verified successfully"))
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Invalid or expired token"))
                }
            }
            
            get("/status") {
                val email = call.request.queryParameters["email"]
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Email is required"))
                
                val isVerified = emailVerificationService.isEmailVerified(email)
                call.respond(mapOf("verified" to isVerified))
            }
        }
    }
} 