package com.example.com

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.request.receive
import io.ktor.http.HttpStatusCode
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import config.Database
import config.User

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Hello World!")
        }
        // Route to create a user by name (POST /user)
        post("/user") {
            // Receive the name of the user from the request body
            val rawJson = call.receive<String>()
            println("Received raw JSON: $rawJson")
        
            val user = try {
                Json.decodeFromString<User>(rawJson) // Using kotlinx.serialization to deserialize the JSON
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Invalid user data: ${e.message}")
                return@post
            }
            println("Decoded json to get: $user")
            
            // Call Database.createUser to create the user
            val responseStatus = Database.createUser(user.name)
        
            // Check if the status code is successful (201 Created)
            if (responseStatus == HttpStatusCode.Created) {
                // If the user is successfully created, return a 201 status
                call.respond(HttpStatusCode.Created, "User created successfully")
            } else {
                // If there was an error creating the user, return an internal server error
                call.respond(HttpStatusCode.InternalServerError, "Failed to create user")
            }
        }
        
        // Route to read a user by id (GET /user/{id})
        get("/user/{id}") {
            val id = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing or malformed id")
            
            // Call Database.readUser to retrieve the user
            val user = Database.readUser(id)

            if (user != null) {
                // If the user is found, return the user with a 200 status
                call.respond(HttpStatusCode.OK, user)
            } else {
                // If the user is not found, return a 404 status
                call.respond(HttpStatusCode.NotFound, "User not found")
            }
        }
         // Test route to automatically create a user (GET /test-create-user)
         get("/test-create-user") {
            val userName = "John Doe"
            val createdUser = Database.createUser(userName)

            if (createdUser == HttpStatusCode.Created) {
                call.respond(HttpStatusCode.OK, "Created user with usernname ${userName}")
            } else {
                call.respond(HttpStatusCode.InternalServerError, "Failed to create test user")
            }
        }
    }
}
