package model

data class VerificationRequest(
    val email: String,
    val code: String
) 