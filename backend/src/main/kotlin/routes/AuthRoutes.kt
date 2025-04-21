package routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import model.User
import model.RegistrationResponse
import model.VerificationRequest
import model.VerificationResponse
import services.AuthService

fun Application.configureAuthRoutes() {
    val authService = AuthService()
    
    routing {
        register(authService)
        login(authService)
        verifyEmail(authService)
    }
}

private fun Route.register(authService: AuthService) {
    post("/register") {
        try {
            val user = call.receive<User>()
            val response = authService.registerUser(user.name, user.email, user.password)
            call.respond(response)
        } catch (e: Exception) {
            call.respond(
                RegistrationResponse(
                    success = false,
                    message = "Registration failed: ${e.message}"
                )
            )
        }
    }
}

private fun Route.login(authService: AuthService) {
    post("/login") {
        try {
            val user = call.receive<User>()
            val authenticatedUser = authService.authenticateUser(user.email, user.password)
            
            if (authenticatedUser != null) {
                call.respond(authenticatedUser)
            } else {
                call.respond(
                    HttpStatusCode.Unauthorized,
                    mapOf("message" to "Invalid credentials or email not verified")
                )
            }
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError,
                mapOf("message" to "Login failed: ${e.message}")
            )
        }
    }
}

private fun Route.verifyEmail(authService: AuthService) {
    post("/verify-email") {
        try {
            val request = call.receive<VerificationRequest>()
            val response = authService.verifyEmail(request.email, request.otp)
            call.respond(response)
        } catch (e: Exception) {
            call.respond(
                VerificationResponse(
                    success = false,
                    message = "Verification failed: ${e.message}"
                )
            )
        }
    }
} 