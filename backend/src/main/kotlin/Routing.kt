package com.example.com

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.request.receive
import io.ktor.http.HttpStatusCode
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import routes.userRoutes
import routes.hearingAidRoutes
import routes.audiologistRoutes
import routes.appointmentRoutes
import routes.hearingTestRoutes
import controller.EmailVerificationController
import controller.ARController
import service.EmailVerificationService
import services.ARService
import repository.HearingAidRepository


@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String
)

@Serializable
data class AuthResponse(val userId: String?, val token: String?, val message: String)

fun Application.configureRouting() {
    val emailVerificationService = EmailVerificationService()
    val emailVerificationController = EmailVerificationController(emailVerificationService)
    
    // Initialize AR Service
    val hearingAidRepository = HearingAidRepository()  // Adjust this if your repository init is different
    val azureVisionKey = environment.config.propertyOrNull("azure.vision.key")?.getString()
    val azureVisionEndpoint = environment.config.propertyOrNull("azure.vision.endpoint")?.getString()
    val arService = ARService(hearingAidRepository, azureVisionKey, azureVisionEndpoint)
    val arController = ARController(arService)
    
    routing {
        get("/") {
            call.respondText("Hello World!")
        }
        userRoutes() 
        hearingAidRoutes()
        appointmentRoutes()
        audiologistRoutes()
        hearingTestRoutes()
        
        // Register email verification routes
        with(emailVerificationController) {
            this@routing.registerRoutes()
        }
        
        // Register AR routes
        with(arController) {
            configureRoutes(this@routing)
        }
    }
}
