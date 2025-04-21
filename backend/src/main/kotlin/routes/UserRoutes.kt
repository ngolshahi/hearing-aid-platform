package routes

import services.AuthService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import model.UserRequest
import model.LoginRequest
import model.AuthResponse
import model.User
import model.VerificationRequest


fun Route.userRoutes() {
    val authService = AuthService()
    
    route("/api/users") {
        post("/register") {
            try {
                val userRequest = call.receive<UserRequest>()
                
                // Create a user in your database with validation
                val (user, message) = authService.registerUser(
                    "${userRequest.firstName} ${userRequest.lastName}", 
                    userRequest.email, 
                    userRequest.password
                )
                
                if (user != null) {
                    call.respond(HttpStatusCode.Created, mapOf(
                        "user" to user,
                        "message" to message
                    ))
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to message))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Failed to register: ${e.message}"))
            }
        }
        
        post("/verify-email") {
            try {
                val verificationRequest = call.receive<VerificationRequest>()
                val verified = authService.verifyEmail(verificationRequest.email, verificationRequest.token)
                
                if (verified) {
                    call.respond(HttpStatusCode.OK, mapOf("message" to "Email verified successfully"))
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Invalid or expired verification token"))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Failed to verify email: ${e.message}"))
            }
        }
        
        post("/login") {
            try {
                val loginRequest = call.receive<LoginRequest>()
                
                // Change this line - authenticateUser returns User?, not Boolean
                val user = authService.authenticateUser(loginRequest.email, loginRequest.password)
                
                if (user != null) {  // Check if the user exists
                    call.respond(HttpStatusCode.OK, user)
                } else {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("message" to "Failed to login"))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, AuthResponse(
                    email = null,
                    token = null,
                    message = e.message ?: "Invalid request"
                ))
            }
        }
        
        // Add a route for updating users
        put("/{id}") {
            try {
                val id = call.parameters["id"] ?: return@put call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing ID parameter")
                )
                
                val user = call.receive<User>()
                
                // Ensure the ID in the path matches the ID in the body
                if (id != user.id) {
                    return@put call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("message" to "ID in path does not match ID in request body")
                    )
                }
                
                val updatedUser = authService.updateUser(user)

                if (updatedUser != null) {
                    call.respond(HttpStatusCode.OK, updatedUser)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("message" to "Failed to update user"))
                }
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to update user: ${e.message}")
                )
            }
        }
    }
}