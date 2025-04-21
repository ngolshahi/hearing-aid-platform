package service

import model.VerificationToken
import repository.VerificationTokenRepository
import java.time.Instant
import java.util.UUID

class EmailVerificationService {
    private val repository = VerificationTokenRepository()
    
    fun createVerificationToken(email: String): VerificationToken {
        val token = UUID.randomUUID().toString()
        val expiryDate = Instant.now().plusSeconds(3600) // 1 hour expiry
        
        val verificationToken = VerificationToken(
            email = email,
            token = token,
            expiryDate = expiryDate
        )
        
        // Store in Cosmos DB using our custom repository
        repository.save(verificationToken)
        
        return verificationToken
    }
    
    fun verifyToken(email: String, token: String): Boolean {
        val verificationToken = repository.findByEmailAndToken(email, token) ?: return false
        
        // Check if token is expired
        if (Instant.now().isAfter(verificationToken.expiryDate)) {
            return false
        }
        
        // Mark as verified
        val updatedToken = verificationToken.copy(verified = true)
        repository.update(updatedToken)
        
        return true
    }
    
    fun isEmailVerified(email: String): Boolean {
        val verificationTokens = repository.findByEmail(email)
        return verificationTokens.any { it.verified }
    }
} 