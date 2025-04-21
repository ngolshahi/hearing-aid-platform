package com.example.com

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import routes.configureAuthRoutes
import routes.configureUserRoutes
import routes.configureAudiologistRoutes

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    // Start Spring Boot application
    runApplication<Application>(*args)
    
    // Start Ktor server
    io.ktor.server.netty.EngineMain.main(args)
}

// Ktor application configuration
fun Application.module() {
    install(CORS) {
        anyHost()
    }
    
    install(ContentNegotiation) {
        json()
    }
    
    routing {
        configureAuthRoutes()
        configureUserRoutes()
        configureAudiologistRoutes()
    }
}
