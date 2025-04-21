package services

import model.User
import repository.UserRepository
import repository.VerificationTokenRepository
import io.ktor.http.HttpStatusCode
import utils.PasswordUtils
import utils.ValidationUtils

class AuthService(
    private val userRepository: UserRepository = UserRepository(),
    private val verificationTokenRepository: VerificationTokenRepository = VerificationTokenRepository(),
    private val emailService: EmailService = EmailService()
) {
    
    /**
     * Register a new user with validation and email verification
     * @param name The user's name
     * @param email The user's email
     * @param password The user's password
     * @return A pair containing the user and a message
     */
    suspend fun registerUser(name: String, email: String, password: String): Pair<User?, String> {
        // Validate input
        if (!ValidationUtils.isValidName(name)) {
            return Pair(null, "Invalid name format")
        }
        
        if (!ValidationUtils.isValidEmail(email)) {
            return Pair(null, "Invalid email format")
        }
        
        if (!ValidationUtils.isSecurePassword(password)) {
            return Pair(null, "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number")
        }
        
        // Check if user already exists
        val existingUser = userRepository.readUser(email)
        if (existingUser != null) {
            return Pair(null, "User with this email already exists")
        }
        
        // Create the user with a hashed password
        val hashedPassword = PasswordUtils.hashPassword(password)
        val user = User(id = email, name = name, email = email, password = hashedPassword)
        
        // Store the user in the database
        val createdUser = userRepository.createUser(name, email, hashedPassword)
        if (createdUser == null) {
            return Pair(null, "Failed to create user")
        }
        
        // Generate and send verification email
        val otp = emailService.generateOTP()
        val token = verificationTokenRepository.createToken(email, otp)
        
        if (token != null) {
            val emailSent = emailService.sendVerificationEmail(email, otp)
            if (emailSent) {
                return Pair(createdUser, "User created successfully. Please check your email for verification.")
            } else {
                return Pair(createdUser, "User created successfully, but verification email could not be sent.")
            }
        } else {
            return Pair(createdUser, "User created successfully, but verification token could not be created.")
        }
    }
    
    /**
     * Verify a user's email
     * @param email The user's email
     * @param token The verification token
     * @return true if the email was verified, false otherwise
     */
    fun verifyEmail(email: String, token: String): Boolean {
        return verificationTokenRepository.verifyToken(email, token)
    }
    
    /**
     * Authenticate a user
     * @param email The user's email
     * @param password The user's password
     * @return The authenticated user, or null if authentication failed
     */
    fun authenticateUser(email: String, password: String): User? {
        return userRepository.verifyPassword(email, password)
    }
    
    /**
     * Update a user's profile
     * @param user The user to update
     * @return The updated user, or null if the update failed
     */
    fun updateUser(user: User): User? {
        // Check if the password has been changed
        val existingUser = userRepository.readUser(user.email)
        
        if (existingUser != null) {
            // If the password is different from the existing one, hash it
            if (user.password != existingUser.password) {
                val hashedPassword = PasswordUtils.hashPassword(user.password)
                val updatedUser = user.copy(password = hashedPassword)
                return userRepository.updateUser(updatedUser)
            }
        }
        
        return userRepository.updateUser(user)
    }
}