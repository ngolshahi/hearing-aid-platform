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
        
        // Create the user with a hashed password, initially unverified
        val hashedPassword = PasswordUtils.hashPassword(password)
        val user = User(
            id = email, 
            name = name, 
            email = email, 
            password = hashedPassword,
            verified = false
        )
        
        // Store the user in the database
        val createdUser = userRepository.createUser(user)
        if (createdUser == null) {
            return Pair(null, "Failed to create user")
        }
        
        // Generate and send verification email
        val otp = emailService.generateOTP()
        val token = verificationTokenRepository.createToken(email, otp)
        
        if (token != null) {
            val emailSent = emailService.sendVerificationEmail(email, otp)
            if (emailSent) {
                return Pair(createdUser, "Your account has been created. Please check your email to verify your account before logging in.")
            } else {
                return Pair(createdUser, "Your account has been created, but verification email could not be sent. Please contact support.")
            }
        } else {
            return Pair(createdUser, "Your account has been created, but verification token could not be created. Please contact support.")
        }
    }
    
    /**
     * Verify a user's email
     * @param email The user's email
     * @param token The verification token
     * @return true if the email was verified, false otherwise
     */
    fun verifyEmail(email: String, token: String): Boolean {
        val tokenVerified = verificationTokenRepository.verifyToken(email, token)
        
        if (tokenVerified) {
            // Update the user's verified status
            val user = userRepository.readUser(email)
            if (user != null) {
                val verifiedUser = user.copy(verified = true)
                userRepository.updateUser(verifiedUser)
                return true
            }
        }
        
        return false
    }
    
    /**
     * Authenticate a user
     * @param email The user's email
     * @param password The user's password
     * @return The authenticated user, or null if authentication failed
     */
    fun authenticateUser(email: String, password: String): User? {
        val user = userRepository.verifyPassword(email, password)
        
        // Check if the user is verified
        if (user != null && !user.verified) {
            // User exists but is not verified
            return null
        }
        
        return user
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
            // Preserve the verification status
            val updatedUser = if (user.password != existingUser.password) {
                val hashedPassword = PasswordUtils.hashPassword(user.password)
                user.copy(password = hashedPassword, verified = existingUser.verified)
            } else {
                user.copy(verified = existingUser.verified)
            }
            
            return userRepository.updateUser(updatedUser)
        }
        
        return userRepository.updateUser(user)
    }
    
    /**
     * Check if a user's email is verified
     * @param email The user's email
     * @return true if the email is verified, false otherwise
     */
    fun isEmailVerified(email: String): Boolean {
        val user = userRepository.readUser(email)
        return user?.verified == true
    }
    
    /**
     * Resend verification email
     * @param email The user's email
     * @return true if the email was sent, false otherwise
     */
    suspend fun resendVerificationEmail(email: String): Boolean {
        val user = userRepository.readUser(email)
        if (user != null && !user.verified) {
            // Generate and send verification email
            val otp = emailService.generateOTP()
            val token = verificationTokenRepository.createToken(email, otp)
            
            if (token != null) {
                return emailService.sendVerificationEmail(email, otp)
            }
        }
        return false
    }
}