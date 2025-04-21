package service

import model.User
import model.VerificationRequest
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import repository.UserRepository
import java.time.LocalDateTime
import java.util.UUID

@Service
class AuthService(
    private val passwordEncoder: PasswordEncoder,
    private val userRepository: UserRepository,
    private val emailService: EmailService
) {
    fun register(email: String, password: String, firstName: String, lastName: String): User {
        // Check if user already exists
        if (userRepository.findByEmail(email) != null) {
            throw IllegalArgumentException("User with this email already exists")
        }

        // Create new user
        val user = User(
            email = email,
            password = passwordEncoder.encode(password),
            firstName = firstName,
            lastName = lastName,
            verificationCode = UUID.randomUUID().toString(),
            isVerified = false
        )

        // Save user
        val savedUser = userRepository.save(user)

        // Send verification email
        emailService.sendVerificationEmail(email, savedUser.verificationCode)

        return savedUser
    }

    fun verifyEmail(request: VerificationRequest): User {
        val user = userRepository.findByEmail(request.email)
            ?: throw IllegalArgumentException("User not found")

        if (user.verificationCode != request.code) {
            throw IllegalArgumentException("Invalid verification code")
        }

        // Create a new user with isVerified set to true
        val verifiedUser = user.copy(isVerified = true)
        return userRepository.save(verifiedUser)
    }

    private fun generateVerificationCode(): String {
        return (100000..999999).random().toString()
    }
} 