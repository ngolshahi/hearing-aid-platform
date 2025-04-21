package service

import model.VerificationToken
import model.User
import java.time.Instant
import java.util.UUID
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.statements.InsertStatement
import org.jetbrains.exposed.dao.UUIDEntity
import org.jetbrains.exposed.dao.UUIDEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.UUIDTable
import java.util.UUID

object VerificationTokens : UUIDTable() {
    val email = varchar("email", 255)
    val token = varchar("token", 255)
    val expiryDate = long("expiry_date")
    val verified = bool("verified")
}

class VerificationTokenEntity(id: EntityID<UUID>) : UUIDEntity(id) {
    companion object : UUIDEntityClass<VerificationTokenEntity>(VerificationTokens)
    
    var email by VerificationTokens.email
    var token by VerificationTokens.token
    var expiryDate by VerificationTokens.expiryDate
    var verified by VerificationTokens.verified
}

class EmailVerificationService {
    fun createVerificationToken(email: String): VerificationToken {
        val token = UUID.randomUUID().toString()
        val expiryDate = Instant.now().plusSeconds(3600) // 1 hour expiry
        
        return transaction {
            VerificationTokenEntity.new {
                this.email = email
                this.token = token
                this.expiryDate = expiryDate.epochSecond
                this.verified = false
            }
            
            VerificationToken(
                id = UUID.randomUUID().toString(),
                email = email,
                token = token,
                expiryDate = expiryDate
            )
        }
    }
    
    fun verifyToken(email: String, token: String): Boolean {
        return transaction {
            val verificationToken = VerificationTokenEntity.find {
                (VerificationTokens.email eq email) and
                (VerificationTokens.token eq token) and
                (VerificationTokens.verified eq false)
            }.firstOrNull() ?: return@transaction false
            
            if (Instant.now().epochSecond > verificationToken.expiryDate) {
                return@transaction false
            }
            
            verificationToken.verified = true
            true
        }
    }
    
    fun isEmailVerified(email: String): Boolean {
        return transaction {
            VerificationTokenEntity.find {
                (VerificationTokens.email eq email) and
                (VerificationTokens.verified eq true)
            }.any()
        }
    }
} 