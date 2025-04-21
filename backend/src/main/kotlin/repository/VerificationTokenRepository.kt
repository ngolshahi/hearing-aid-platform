package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.PartitionKey
import com.azure.cosmos.models.CosmosQueryRequestOptions
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import config.DatabaseConfig
import model.VerificationToken
import java.time.Instant
import java.util.UUID

class VerificationTokenRepository {
    private val container: CosmosContainer = DatabaseConfig.getVerificationTokensContainer()
    
    // Custom ObjectMapper for handling Java 8 date/time types
    private val objectMapper = ObjectMapper().apply {
        registerModule(JavaTimeModule())
        disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    }
    
    /**
     * Create a new verification token
     * @param email The email address to verify
     * @param token The verification token
     * @return The created verification token
     */
    suspend fun createToken(email: String, token: String): VerificationToken? {
        val expiryDate = Instant.now().plusSeconds(3600) // 1 hour expiry
        val verificationToken = VerificationToken(
            id = UUID.randomUUID().toString(),
            email = email,
            token = token,
            expiryDate = expiryDate,
            verified = false
        )
        
        try {
            val itemResponse = container.createItem(verificationToken)
            if (itemResponse.statusCode == 201) {
                return verificationToken
            } else {
                return null
            }
        } catch (e: Exception) {
            println("Error creating verification token: ${e.message}")
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Get a verification token by email
     * @param email The email address
     * @return The verification token, or null if not found
     */
    fun getTokenByEmail(email: String): VerificationToken? {
        val query = "SELECT * FROM c WHERE c.email = '$email' AND c.verified = false ORDER BY c.expiryDate DESC"
        
        try {
            val queryIterable = container.queryItems(
                query, null, VerificationToken::class.java
            )
            
            return queryIterable.firstOrNull()
        } catch (e: Exception) {
            println("Error getting verification token: ${e.message}")
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Verify a token
     * @param email The email address
     * @param token The verification token
     * @return true if the token was verified, false otherwise
     */
    fun verifyToken(email: String, token: String): Boolean {
        val verificationToken = getTokenByEmail(email)
        
        if (verificationToken != null && verificationToken.token == token) {
            // Check if the token has expired
            if (Instant.now().isAfter(verificationToken.expiryDate)) {
                println("Token has expired")
                return false
            }
            
            // Mark the token as verified
            val updatedToken = verificationToken.copy(verified = true)
            
            try {
                val response = container.replaceItem(
                    updatedToken,
                    updatedToken.id,
                    PartitionKey(updatedToken.id),
                    null
                )
                
                return response.statusCode == 200
            } catch (e: Exception) {
                println("Error verifying token: ${e.message}")
                e.printStackTrace()
                return false
            }
        }
        
        return false
    }
    
    /**
     * Save a verification token to the database
     */
    fun save(token: VerificationToken) {
        // Convert to JSON string for reliable serialization
        val jsonString = objectMapper.writeValueAsString(token)
        // Convert back to a Map for CosmosDB
        val jsonMap = objectMapper.readValue(jsonString, Map::class.java)
        
        container.createItem(jsonMap)
    }
    
    /**
     * Find a token by email and token string
     */
    fun findByEmailAndToken(email: String, token: String): VerificationToken? {
        val sql = "SELECT * FROM c WHERE c.email = @email AND c.token = @token"
        val params = listOf(
            "email" to email,
            "token" to token
        )
        
        val querySpec = com.azure.cosmos.models.SqlQuerySpec(sql)
        params.forEachIndexed { index, (name, value) ->
            querySpec.parameters.add(com.azure.cosmos.models.SqlParameter("@$name", value))
        }
        
        val options = CosmosQueryRequestOptions()
        
        val results = container.queryItems(querySpec, options, Map::class.java)
            .stream()
            .toList()
            
        if (results.isEmpty()) {
            return null
        }
        
        // Convert map to JSON string then to VerificationToken to ensure proper deserialization
        val jsonString = objectMapper.writeValueAsString(results[0])
        return objectMapper.readValue(jsonString, VerificationToken::class.java)
    }
    
    /**
     * Find verification tokens by email
     */
    fun findByEmail(email: String): List<VerificationToken> {
        val sql = "SELECT * FROM c WHERE c.email = @email"
        val querySpec = com.azure.cosmos.models.SqlQuerySpec(sql)
        querySpec.parameters.add(com.azure.cosmos.models.SqlParameter("@email", email))
        
        val options = CosmosQueryRequestOptions()
        
        val results = container.queryItems(querySpec, options, Map::class.java)
            .stream()
            .toList()
            
        // Convert maps to JSON strings then to VerificationToken objects
        return results.map { 
            val jsonString = objectMapper.writeValueAsString(it)
            objectMapper.readValue(jsonString, VerificationToken::class.java)
        }
    }
    
    /**
     * Update a verification token
     */
    fun update(token: VerificationToken) {
        // Convert to JSON string for reliable serialization
        val jsonString = objectMapper.writeValueAsString(token)
        // Convert back to a Map for CosmosDB
        val jsonMap = objectMapper.readValue(jsonString, Map::class.java)
        
        container.replaceItem(
            jsonMap, 
            token.id, 
            PartitionKey(token.email), 
            null
        )
    }
} 