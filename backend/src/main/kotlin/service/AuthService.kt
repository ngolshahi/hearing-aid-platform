package service

import model.User
import model.VerificationRequest
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID

@Service
class AuthService(
    private val passwordEncoder: PasswordEncoder,
    private val userRepository: UserRepository,
    private val emailService: EmailService
) {
    fun register(email: String, password: String): User {
        // Check if user already exists
        if (userRepository.findByEmail(email) != null) {
            throw IllegalArgumentException("User with this email already exists")
        }

        // Create new user
        val user = User(
            id = UUID.randomUUID().toString(),
            email = email,
            password = passwordEncoder.encode(password),
            isVerified = false,
            createdAt = LocalDateTime.now()
        )

        // Save user
        val savedUser = userRepository.save(user)

        // Send verification email
        val verificationCode = generateVerificationCode()
        emailService.sendVerificationEmail(email, verificationCode)

        return savedUser
    }

    fun verifyEmail(request: VerificationRequest): User {
        val user = userRepository.findByEmail(request.email)
            ?: throw IllegalArgumentException("User not found")

        // TODO: Implement verification code validation
        // For now, just mark the user as verified
        user.isVerified = true
        return userRepository.save(user)
    }

    private fun generateVerificationCode(): String {
        return (100000..999999).random().toString()
    }
} 