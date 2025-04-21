package service

import model.User
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import repository.UserRepository
import java.util.*

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    fun createUser(email: String, password: String, firstName: String, lastName: String): User {
        if (userRepository.findByEmail(email) != null) {
            throw IllegalArgumentException("User with email $email already exists")
        }

        val user = User(
            email = email,
            password = passwordEncoder.encode(password),
            firstName = firstName,
            lastName = lastName,
            verificationCode = UUID.randomUUID().toString(),
            isVerified = false
        )

        return userRepository.save(user)
    }

    fun verifyUser(email: String, code: String): User {
        val user = userRepository.findByEmail(email)
            ?: throw IllegalArgumentException("User not found")

        if (user.verificationCode != code) {
            throw IllegalArgumentException("Invalid verification code")
        }

        user.isVerified = true
        return userRepository.save(user)
    }

    fun getUserByEmail(email: String): User? {
        return userRepository.findByEmail(email)
    }
} 