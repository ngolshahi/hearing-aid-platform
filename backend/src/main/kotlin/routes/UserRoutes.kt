package routes

import services.AuthService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class UserRequest(val email: String, val password: String, val firstName: String? = null, val lastName: String? = null)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class AuthResponse(val email: String?, val token: String?, val message: String)

fun Route.userRoutes() {
    val authService = AuthService()
    
    route("/api/users") {
        post("/register") {
            try {
                val userRequest = call.receive<UserRequest>()
                
                // Create a user in your database
                // Note: You need to update the User model to include email, password fields
                val result = authService.registerUser("${userRequest.firstName} ${userRequest.lastName}", userRequest.email, userRequest.password)
                
                if (result == HttpStatusCode.Created) {
                    call.respond(HttpStatusCode.Created, AuthResponse(
                        email = null, // You might want to return the created user ID here
                        token = null, // For now, not implementing JWT tokens
                        message = "User created successfully"
                    ))
                } else {
                    call.respond(HttpStatusCode.InternalServerError, AuthResponse(
                        email = null,
                        token = null,
                        message = "Failed to create user"
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
        
        post("/login") {
            try {
                val loginRequest = call.receive<LoginRequest>()
                
                if (authService.authenticateUser(loginRequest.email, loginRequest.password)) {
                    call.respond(HttpStatusCode.OK, AuthResponse(
                        email = loginRequest.email,
                        token = "dummy-token", // In a real app, generate a JWT token here
                        message = "Login successful"
                    ))
                } else {
                    call.respond(HttpStatusCode.Unauthorized, AuthResponse(
                        email = null,
                        token = null,
                        message = "Invalid credentials"
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
    }
}