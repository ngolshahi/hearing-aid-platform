package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.VerificationToken
import java.time.Instant
import java.util.UUID

class VerificationTokenRepository {
    private val container: CosmosContainer = DatabaseConfig.getVerificationTokensContainer()
    
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
} 