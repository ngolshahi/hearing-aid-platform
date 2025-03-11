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

    suspend fun createUser(name: String, email: String, password: String): HttpStatusCode {
        // In a real app, hash the password before storing
        val user = User(id = email, name = name, email = email, password = password)
        
        return try {
            val itemResponse = container.createItem(user)
            if (itemResponse.statusCode == 201) {
                HttpStatusCode.Created
            } else {
                HttpStatusCode.InternalServerError
            }
        } catch (e: Exception) {
            println("Error creating user.")
            e.printStackTrace()
            HttpStatusCode.InternalServerError
        }
    }

    fun verifyPassword(email: String, password: String): Boolean {
        val user = readUser(email) ?: return false
        // In a real app, compare hashed passwords
        return user.password == password
    }
}