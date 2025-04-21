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
            val item = response.item
            User(id = item.email, name = item.name, email = item.email, password = item.password)
        } catch (e: Exception) {
            println("Error reading user by email: $email")
            e.printStackTrace()
            null
        }
    }

    suspend fun createUser(name: String, email: String, password: String): User? {
        println("Creating user")
        // Hash the password before storing
        val hashedPassword = PasswordUtils.hashPassword(password)
        val user = User(id = email, name = name, email = email, password = hashedPassword)
        
        try {
            val itemResponse = container.createItem(user)
            println("Status code " + itemResponse.statusCode)
            if (itemResponse.statusCode == 201) {
                return user
            } else {
                return null
            }
        } catch (e: Exception) {
            println("Error creating user.")
            e.printStackTrace()
            return null
        }
    }

    fun updateUser(user: User): User? {
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