package services

import model.User
import repository.UserRepository
import repository.VerificationTokenRepository
import io.ktor.http.HttpStatusCode
import utils.PasswordUtils
import utils.ValidationUtils
import java.time.Instant
import kotlinx.serialization.Serializable
import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.PartitionKey
import java.util.UUID
import config.DatabaseConfig
import java.util.concurrent.ConcurrentHashMap

@Serializable
data class PendingUser(
    val id: String = UUID.randomUUID().toString(), 
    val email: String,
    val name: String,
    val password: String,
    val otp: String = "", // Store OTP directly with the pending user
    val createdAt: Long = Instant.now().epochSecond
)

class AuthService(
    private val userRepository: UserRepository = UserRepository(),
    private val verificationTokenRepository: VerificationTokenRepository = VerificationTokenRepository(),
    private val emailService: EmailService = EmailService()
) {
    private val pendingContainer: CosmosContainer = DatabaseConfig.getVerificationTokensContainer()
    
    // Simple in-memory store of pending users with their OTPs
    private val pendingUsers = ConcurrentHashMap<String, PendingUser>()
    
    /**
     * Get a user by email
     * @param email The user's email
     * @return The user, or null if not found
     */
    fun getUserByEmail(email: String): User? {
        return userRepository.readUser(email)
    }
    
    /**
     * Register a new user with validation and email verification
     * @param name The user's name
     * @param email The user's email
     * @param password The user's password
     * @return A pair containing the pending user info and a message
     */
    suspend fun registerUser(name: String, email: String, password: String): Pair<PendingUser?, String> {
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
        
        // Generate OTP
        val otp = emailService.generateOTP()

        // Create a pending user with a hashed password and OTP
        val hashedPassword = PasswordUtils.hashPassword(password)
        val pendingUser = PendingUser(
            email = email, 
            name = name, 
            password = hashedPassword,
            otp = otp
        )
        
        // Store the pending user in memory
        pendingUsers[email] = pendingUser
        
        // Try to send verification email
        val emailSent = emailService.sendVerificationEmail(email, otp)
        
        if (emailSent) {
            return Pair(pendingUser, "Your account is pending verification. Please check your email to verify your account before logging in.")
        } else {
            return Pair(pendingUser, "Your account is pending verification, but we couldn't send a verification email. Please contact support.")
        }
    }
    
    /**
     * Verify a user's email and create their account
     * @param email The user's email
     * @param token The verification token (OTP)
     * @return true if the email was verified and account created, false otherwise
     */
    suspend fun verifyEmail(email: String, token: String): Boolean {
        val pendingUser = pendingUsers[email] ?: return false
        
        // Simple OTP matching
        if (pendingUser.otp == token) {
            // Create the actual user
            val user = User(
                id = email,
                name = pendingUser.name,
                email = pendingUser.email,
                password = pendingUser.password,
                verified = true
            )
            
            val createdUser = userRepository.createUser(user)
            if (createdUser != null) {
                // Remove from pending users
                pendingUsers.remove(email)
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
    suspend fun updateUser(user: User): User? {
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
        return user?.verified ?: false
    }
    
    /**
     * Resend the verification email to a pending user
     * @param email The user's email
     * @return true if the email was sent successfully, false otherwise
     */
    suspend fun resendVerificationEmail(email: String): Boolean {
        val pendingUser = pendingUsers[email] ?: return false
        
        // Generate new OTP
        val otp = emailService.generateOTP()
        
        // Update the pending user with the new OTP
        pendingUsers[email] = pendingUser.copy(otp = otp)
        
        // Send the verification email
        return emailService.sendVerificationEmail(email, otp)
    }
}