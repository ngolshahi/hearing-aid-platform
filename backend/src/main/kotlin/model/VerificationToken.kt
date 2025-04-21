package model

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual
import java.time.Instant

@Serializable
data class VerificationToken(
    val id: String = java.util.UUID.randomUUID().toString(),
    val email: String = "",
    val token: String = "",
    @Contextual
    val expiryDate: Instant = Instant.now(),
    val verified: Boolean = false
) 