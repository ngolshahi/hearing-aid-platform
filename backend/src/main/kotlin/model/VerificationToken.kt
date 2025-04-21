package model

import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class VerificationToken(
    val id: String = java.util.UUID.randomUUID().toString(),
    val email: String,
    val token: String,
    val expiryDate: Instant,
    val verified: Boolean = false
) 