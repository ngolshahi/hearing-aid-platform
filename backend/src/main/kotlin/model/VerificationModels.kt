package model

import kotlinx.serialization.Serializable

@Serializable
data class VerificationRequest(
    val email: String,
    val otp: String
)

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