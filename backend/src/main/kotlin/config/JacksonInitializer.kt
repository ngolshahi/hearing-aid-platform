package config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.azure.cosmos.implementation.Utils

/**
 * Global Jackson initializer that runs when the application starts.
 * This ensures that Jackson modules are registered properly for Cosmos DB.
 */
object JacksonInitializer {
    init {
        try {
            // Configure Azure's internal ObjectMapper
            val internalMapper = Utils.getSimpleObjectMapper()
            internalMapper.registerModule(JavaTimeModule())
            internalMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        } catch (e: Exception) {
            println("Warning: Could not configure Azure internal ObjectMapper: ${e.message}")
        }
    }
    
    /**
     * Call this method to ensure the initializer is loaded
     */
    fun initialize() {
        // The initialization is done in the init block
        // This method is just to ensure the class is loaded
    }
} 