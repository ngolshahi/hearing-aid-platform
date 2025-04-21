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
    val appointmentsContainer: String = dotenv["APPOINTMENTS_CONTAINER"] ?: 
        throw IllegalArgumentException("Appointments container name is missing")
    val appointmentTypesContainer: String = dotenv["APPOINTMENT_TYPES_CONTAINER"] ?: 
        throw IllegalArgumentException("Appointment types container name is missing")
    val audiologistsContainer: String = dotenv["AUDIOLOGISTS_CONTAINER"] ?: 
        throw IllegalArgumentException("Audiologists container name is missing")
    val verificationTokensContainer: String = dotenv["VERIFICATION_TOKENS_CONTAINER"] ?: "verification-tokens"

    // Set up the serializer adapter with our custom Jackson configuration
    // This is used internally by the Cosmos client
    init {
        // Register the JavaTimeModule with the default serializer
        System.setProperty("azure.cosmos.serialization.adapter", "com.azure.core.util.serializer.JacksonAdapter")
        // This will be used by the JacksonAdapter internally
        com.azure.core.util.Configuration.getGlobalConfiguration()
            .put("azure.cosmos.serialization.adapter", "com.azure.core.util.serializer.JacksonAdapter")
    }

    // Create a Cosmos client using the provided credentials
    val cosmosClient: CosmosClient = CosmosClientBuilder()
        .endpoint(cosmosDbUri)
        .key(cosmosDbKey)
        .consistencyLevel(ConsistencyLevel.EVENTUAL)
        .contentResponseOnWriteEnabled(true)
        .buildClient()

    // Initialize the CosmosDatabase
    val database: CosmosDatabase = cosmosClient.getDatabase(cosmosDbDatabase)

    // Container getters
    fun getUsersContainer(): CosmosContainer = database.getContainer(usersContainer)
    
    fun getHearingAidsContainer(): CosmosContainer = database.getContainer(hearingAidsContainer)

    fun getAppointmentsContainer(): CosmosContainer = database.getContainer(appointmentsContainer)

    fun getAppointmentTypesContainer(): CosmosContainer = database.getContainer(appointmentTypesContainer)

    fun getAudiologistsContainer(): CosmosContainer = database.getContainer(audiologistsContainer)
    
    fun getVerificationTokensContainer(): CosmosContainer = database.getContainer(verificationTokensContainer)
}