package com.example.com

import config.appSerializersModule
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.http.*
import io.ktor.server.netty.EngineMain
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    install(ContentNegotiation) {
        json(Json {
            serializersModule = appSerializersModule
            prettyPrint = true
            isLenient = true
        })
    }
    install(CORS) {
        anyHost() // Allow all hosts (replace with specific domains in production)
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowCredentials = true
        allowNonSimpleContentTypes = true
        allowSameOrigin = true
    }    

    configureRouting()
}
