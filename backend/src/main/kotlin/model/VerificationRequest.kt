package model

import kotlinx.serialization.Serializable

@Serializable
data class VerificationRequest(
    val email: String,
    val token: String
) 