package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.User
import io.ktor.http.HttpStatusCode

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
        // In a real app, hash the password before storing
        val user = User(id = email, name = name, email = email, password = password)
        
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

    fun verifyPassword(email: String, password: String): User? {
        val user = readUser(email) ?: return null
        // In a real app, compare hashed passwords
        if (user.password == password) {
            return user
        }
        return null
    }
}