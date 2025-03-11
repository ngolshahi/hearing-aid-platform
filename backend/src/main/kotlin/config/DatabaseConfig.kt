package config

import com.azure.cosmos.CosmosClient
import com.azure.cosmos.CosmosClientBuilder
import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.CosmosDatabase
import com.azure.cosmos.ConsistencyLevel
import io.github.cdimascio.dotenv.Dotenv

object DatabaseConfig {
    // Load environment variables from the .env file
    private val dotenv = Dotenv.load()

    // Fetch Cosmos DB connection details from environment variables
    private val cosmosDbUri: String = dotenv["AZURE_COSMOS_DB_URI"] ?: 
        throw IllegalArgumentException("Cosmos DB URI is missing")
    private val cosmosDbKey: String = dotenv["AZURE_COSMOS_DB_KEY"] ?: 
        throw IllegalArgumentException("Cosmos DB Key is missing")
    private val cosmosDbDatabase: String = dotenv["AZURE_COSMOS_DB_DATABASE"] ?: 
        throw IllegalArgumentException("Cosmos DB Database name is missing")
    val usersContainer: String = dotenv["USERS_CONTAINER"] ?: 
        throw IllegalArgumentException("Users Container name is missing")
    val hearingAidsContainer: String = dotenv["HEARING_AID_CONTAINER"] ?: 
        throw IllegalArgumentException("Hearing Aid Container name is missing")

    // Create a Cosmos client using the provided credentials
    val cosmosClient: CosmosClient = CosmosClientBuilder()
        .endpoint(cosmosDbUri)
        .key(cosmosDbKey)
        .consistencyLevel(ConsistencyLevel.EVENTUAL)
        .buildClient()

    // Initialize the CosmosDatabase
    val database: CosmosDatabase = cosmosClient.getDatabase(cosmosDbDatabase)

    // Container getters
    fun getUsersContainer(): CosmosContainer = database.getContainer(usersContainer)
    
    fun getHearingAidsContainer(): CosmosContainer = database.getContainer(hearingAidsContainer)
}