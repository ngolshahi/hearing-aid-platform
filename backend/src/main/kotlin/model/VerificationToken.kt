package model

import java.time.LocalDateTime

data class VerificationToken(
    val email: String,
    val token: String,
    val expiryDate: LocalDateTime
) 