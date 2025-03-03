package config

import com.azure.cosmos.*
import com.azure.cosmos.models.*
import io.github.cdimascio.dotenv.Dotenv
import kotlinx.serialization.Serializable
import io.ktor.http.HttpStatusCode
import java.util.UUID
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

@Serializable
data class User @JsonCreator constructor(
    @JsonProperty("id") val id: String = "",
    @JsonProperty("name") val name: String = "",
    @JsonProperty("email") val email: String = "",
    @JsonProperty("password") val password: String = ""
)

object Database {
    // Load environment variables from the .env file
    private val dotenv = Dotenv.load()

    // Fetch Cosmos DB connection details from environment variables
    private val cosmosDbUri: String = dotenv["AZURE_COSMOS_DB_URI"] ?: throw IllegalArgumentException("Cosmos DB URI is missing")
    private val cosmosDbKey: String = dotenv["AZURE_COSMOS_DB_KEY"] ?: throw IllegalArgumentException("Cosmos DB Key is missing")
    private val cosmosDbDatabase: String = dotenv["AZURE_COSMOS_DB_DATABASE"] ?: throw IllegalArgumentException("Cosmos DB Database name is missing")
    private val cosmosDbContainer: String = dotenv["AZURE_COSMOS_DB_CONTAINER"] ?: throw IllegalArgumentException("Cosmos DB Container name is missing")

    // Create a Cosmos client using the provided credentials
    private val cosmosClient: CosmosClient = CosmosClientBuilder()
        .endpoint(cosmosDbUri)
        .key(cosmosDbKey)
        .consistencyLevel(ConsistencyLevel.EVENTUAL) // Set your consistency level
        .buildClient()
    

    // Initialize the CosmosDatabase
    private val database: CosmosDatabase = cosmosClient.getDatabase(cosmosDbDatabase)

    // Initialize the CosmosContainer
    private val container: CosmosContainer = database.getContainer(cosmosDbContainer)

    fun readUser(email: String): User? {
        // Retrieve the document by email (which is both the ID and partition key)
        val container: CosmosContainer = cosmosClient.getDatabase(cosmosDbDatabase).getContainer(cosmosDbContainer)
        return getDocumentByEmail(email, container)
    }
    
    private fun getDocumentByEmail(email: String, container: CosmosContainer): User? {
        return try {
            // Retrieve the item using the email as both ID and partition key
            val response = container.readItem(email, PartitionKey(email), User::class.java)
            val item = response.item
            return User(id = item.email, name = item.name, email = item.email, password = item.password)
        } catch (e: Exception) {
            println("Error reading user by email: $email")
            e.printStackTrace()
            null
        }
    }

    // Add these methods to your Database object
    suspend fun createUser(name: String, email: String, password: String): HttpStatusCode {
        // In a real app, hash the password before storing
        val user = User(id = email,name = name, email = email, password = password)
        
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
