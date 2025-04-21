package model

import kotlinx.serialization.Serializable

// VerificationRequest class has been moved to VerificationRequest.kt
// Removing duplicate declaration

@Serializable
data class VerificationResponse(
    val success: Boolean,
    val message: String
)

@Serializable
data class RegistrationResponse(
    val success: Boolean,
    val message: String,
    val userId: String? = null
) 