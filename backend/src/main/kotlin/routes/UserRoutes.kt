package routes

import services.AuthService
import services.PendingUser
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
import model.UserRegistrationResponse

@Serializable
data class LoginResponse(
    val user: User? = null,
    val verified: Boolean = false,
    val message: String = ""
)

@Serializable
data class ResendVerificationRequest(val email: String)

fun Route.userRoutes() {
    val authService = AuthService()
    
    route("/api/users") {
        post("/register") {
            try {
                val userRequest = call.receive<UserRequest>()
                
                println("Registration attempt for: ${userRequest.email}")
                
                // Create a pending user in the database with validation
                val (pendingUser, message) = authService.registerUser(
                    "${userRequest.firstName} ${userRequest.lastName}", 
                    userRequest.email, 
                    userRequest.password
                )
                
                if (pendingUser != null) {
                    println("Pending user created for: ${pendingUser.email}")
                    call.respond(
                        HttpStatusCode.Created, 
                        UserRegistrationResponse(
                            // Don't send the actual user object since it's not created yet
                            user = null,
                            message = message
                        )
                    )
                } else {
                    println("Registration failed for ${userRequest.email}: $message")
                    call.respond(
                        HttpStatusCode.BadRequest, 
                        UserRegistrationResponse(user = null, message = message)
                    )
                }
            } catch (e: Exception) {
                println("Exception during registration: ${e.message}")
                e.printStackTrace()
                call.respond(
                    HttpStatusCode.BadRequest, 
                    UserRegistrationResponse(user = null, message = "Failed to register: ${e.message}")
                )
            }
        }
        
        post("/verify-email") {
            try {
                val verificationRequest = call.receive<VerificationRequest>()
                println("Verifying email: ${verificationRequest.email} with OTP: ${verificationRequest.token}")
                
                val verified = authService.verifyEmail(verificationRequest.email, verificationRequest.token)
                
                if (verified) {
                    call.respond(HttpStatusCode.OK, mapOf("message" to "Email verified successfully. You can now log in."))
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Invalid verification code. Please try again."))
                }
            } catch (e: Exception) {
                println("Error verifying email: ${e.message}")
                e.printStackTrace()
                call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Failed to verify email: ${e.message}"))
            }
        }
        
        post("/resend-verification") {
            try {
                val request = call.receive<ResendVerificationRequest>()
                println("Resending verification email to: ${request.email}")
                
                val sent = authService.resendVerificationEmail(request.email)
                
                if (sent) {
                    call.respond(HttpStatusCode.OK, mapOf("message" to "Verification email resent successfully"))
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Failed to resend verification email. User may not exist or has already been verified."))
                }
            } catch (e: Exception) {
                println("Error resending verification: ${e.message}")
                e.printStackTrace()
                call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Failed to resend verification email: ${e.message}"))
            }
        }
        
        post("/login") {
            try {
                val loginRequest = call.receive<LoginRequest>()
                
                // Check if user exists in the database
                val existingUser = authService.getUserByEmail(loginRequest.email)
                
                if (existingUser == null) {
                    call.respond(HttpStatusCode.Unauthorized, LoginResponse(
                        user = null,
                        verified = false,
                        message = "Invalid email or password"
                    ))
                    return@post
                }
                
                // Check if the user is verified
                if (!existingUser.verified) {
                    // User exists but isn't verified
                    val passwordCorrect = authService.authenticateUser(loginRequest.email, loginRequest.password) != null
                    
                    if (passwordCorrect) {
                        call.respond(HttpStatusCode.Forbidden, LoginResponse(
                            user = null,
                            verified = false,
                            message = "Your email is not verified. Please check your email for the verification link or request a new one."
                        ))
                    } else {
                        call.respond(HttpStatusCode.Unauthorized, LoginResponse(
                            user = null,
                            verified = false,
                            message = "Invalid email or password"
                        ))
                    }
                    return@post
                }
                
                // Try to authenticate
                val user = authService.authenticateUser(loginRequest.email, loginRequest.password)
                
                if (user != null) {
                    call.respond(HttpStatusCode.OK, user)
                } else {
                    call.respond(HttpStatusCode.Unauthorized, LoginResponse(
                        user = null,
                        verified = true,
                        message = "Invalid email or password"
                    ))
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
        
        get("/check-verification/{email}") {
            try {
                val email = call.parameters["email"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("message" to "Missing email parameter")
                )
                
                val isVerified = authService.isEmailVerified(email)
                call.respond(HttpStatusCode.OK, mapOf("verified" to isVerified))
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("message" to "Failed to check verification status: ${e.message}")
                )
            }
        }
    }
}