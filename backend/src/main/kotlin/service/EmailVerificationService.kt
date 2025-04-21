package service

import config.DatabaseConfig
import model.VerificationToken
import java.time.Instant
import java.util.UUID
import com.azure.cosmos.models.PartitionKey

class EmailVerificationService {
    private val container = DatabaseConfig.getVerificationTokensContainer()
    
    fun createVerificationToken(email: String): VerificationToken {
        val token = UUID.randomUUID().toString()
        val expiryDate = Instant.now().plusSeconds(3600) // 1 hour expiry
        
        val verificationToken = VerificationToken(
            email = email,
            token = token,
            expiryDate = expiryDate
        )
        
        // Store in Cosmos DB
        container.createItem(verificationToken)
        
        return verificationToken
    }
    
    fun verifyToken(email: String, token: String): Boolean {
        val query = "SELECT * FROM c WHERE c.email = '$email' AND c.token = '$token' AND c.expiryDate > ${Instant.now().epochSecond}"
        
        val results = container.queryItems(query, null, VerificationToken::class.java)
        val verificationToken = results.firstOrNull() ?: return false
        
        // Mark as verified
        val updatedToken = verificationToken.copy(verified = true)
        container.replaceItem(updatedToken, updatedToken.id, PartitionKey(updatedToken.id), null)
        
        return true
    }
    
    fun isEmailVerified(email: String): Boolean {
        val query = "SELECT * FROM c WHERE c.email = '$email' AND c.verified = true"
        val results = container.queryItems(query, null, VerificationToken::class.java)
        return results.any()
    }
} 