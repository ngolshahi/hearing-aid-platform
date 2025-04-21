package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.User
import io.ktor.http.HttpStatusCode
import utils.PasswordUtils

class UserRepository {
    private val container: CosmosContainer = DatabaseConfig.getUsersContainer()

    fun readUser(email: String): User? {
        return try {
            // Retrieve the item using the email as both ID and partition key
            val response = container.readItem(email, PartitionKey(email), User::class.java)
            response.item
        } catch (e: Exception) {
            println("Error reading user by email: $email")
            e.printStackTrace()
            null
        }
    }

    suspend fun createUser(user: User): User? {
        println("Creating user: ${user.email}")
        try {
            val itemResponse = container.createItem(user)
            println("Status code " + itemResponse.statusCode)
            if (itemResponse.statusCode == 201) {
                return user
            } else {
                return null
            }
        } catch (e: Exception) {
            println("Error creating user: ${e.message}")
            e.printStackTrace()
            return null
        }
    }

    suspend fun updateUser(user: User): User? {
        try {
            // First check if the user exists
            val existingUser = readUser(user.email) ?: return null
            
            // Update the user in the database
            val response = container.replaceItem(
                user,
                user.email, // Use email as the ID since that's what we use for readUser
                PartitionKey(user.email),
                null
            )
            
            return if (response.statusCode == 200) {
                user
            } else {
                null
            }
        } catch (e: Exception) {
            println("Error updating user with ID: ${user.id}")
            e.printStackTrace()
            return null
        }
    }

    fun verifyPassword(email: String, password: String): User? {
        val user = readUser(email) ?: return null
        // Compare hashed passwords
        if (PasswordUtils.verifyPassword(password, user.password)) {
            return user
        }
        return null
    }
}
   