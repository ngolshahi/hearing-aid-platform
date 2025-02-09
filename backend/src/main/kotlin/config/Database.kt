package config

import com.azure.cosmos.*
import com.azure.cosmos.models.*
import io.github.cdimascio.dotenv.Dotenv
import kotlinx.serialization.Serializable
import io.ktor.http.HttpStatusCode
import java.util.UUID

@Serializable
data class User(val id: String? = null, val name: String)

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

    suspend fun createUser(name: String): HttpStatusCode {
        val userId = UUID.randomUUID().toString()  // Generate unique ID
        val user = User(id = userId, name = name)  // Create user with generated ID
        println("User to be inserted: $user")  // Log the user object to check ID
    
        return try {
            // Perform item creation asynchronously
            val itemResponse: CosmosItemResponse<User> = container.createItem(user)
    
            // If the status code is 201, return success
            if (itemResponse.statusCode == 201) {
                HttpStatusCode.Created
            } else {
                HttpStatusCode.InternalServerError  // If not created, return an error
            }
        } catch (e: Exception) {
            println("Error creating user.")
            e.printStackTrace()
            HttpStatusCode.InternalServerError  // Return error status on failure
        }
    }

    fun readUser(id: String): User? {
        // Retrieve the document by id
        val container: CosmosContainer = cosmosClient.getDatabase(cosmosDbDatabase).getContainer(cosmosDbContainer)
        return getDocumentById(id, container)
    }

    private fun getDocumentById(id: String, container: CosmosContainer): User? {
        return try {
            // Retrieve the item using the ID and partition key (which could also be 'id' in simple cases).
            val response = container.readItem(id, PartitionKey(id), User::class.java)
            response.item // Return the user object if found
        } catch (e: Exception) {
            println("Error reading user by id: $id")
            e.printStackTrace()
            null
        }
    }

}
