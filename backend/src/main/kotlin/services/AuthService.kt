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

@Serializable
data class PendingUser(
    val id: String = UUID.randomUUID().toString(), 
    val email: String,
    val name: String,
    val password: String,
    val createdAt: Long = Instant.now().epochSecond
)

class AuthService(
    private val userRepository: UserRepository = UserRepository(),
    private val verificationTokenRepository: VerificationTokenRepository = VerificationTokenRepository(),
    private val emailService: EmailService = EmailService()
) {
    private val pendingContainer: CosmosContainer = DatabaseConfig.getVerificationTokensContainer()
    
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
        
        // Create a pending user with a hashed password
        val hashedPassword = PasswordUtils.hashPassword(password)
        val pendingUser = PendingUser(
            email = email, 
            name = name, 
            password = hashedPassword
        )
        
        // Store the pending user
        try {
            pendingContainer.createItem(pendingUser)
            
            // Generate and send verification email
            val otp = emailService.generateOTP()
            val token = verificationTokenRepository.createToken(email, otp)
            
            if (token != null) {
                val emailSent = emailService.sendVerificationEmail(email, otp)
                if (emailSent) {
                    return Pair(pendingUser, "Your account is pending verification. Please check your email to verify your account before logging in.")
                } else {
                    return Pair(pendingUser, "Your account is pending verification, but we couldn't send a verification email. Please contact support.")
                }
            } else {
                return Pair(pendingUser, "Your account is pending verification, but we couldn't create a verification token. Please contact support.")
            }
        } catch (e: Exception) {
            println("Error creating pending user: ${e.message}")
            e.printStackTrace()
            return Pair(null, "Failed to create your account. Please try again later.")
        }
    }
    
    /**
     * Verify a user's email and create their account
     * @param email The user's email
     * @param token The verification token
     * @return true if the email was verified and account created, false otherwise
     */
    fun verifyEmail(email: String, token: String): Boolean {
        val tokenVerified = verificationTokenRepository.verifyToken(email, token)
        
        if (tokenVerified) {
            // Find the pending user
            val query = "SELECT * FROM c WHERE c.email = '$email' AND c._self LIKE '%verification-tokens%'"
            val results = pendingContainer.queryItems(query, null, PendingUser::class.java)
            val pendingUser = results.firstOrNull()
            
            if (pendingUser != null) {
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
                    // Delete the pending user
                    try {
                        pendingContainer.deleteItem(pendingUser.id, PartitionKey(pendingUser.id), null)
                    } catch (e: Exception) {
                        println("Error deleting pending user: ${e.message}")
                    }
                    return true
                }
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
        // Check if there's a pending user
        val query = "SELECT * FROM c WHERE c.email = '$email' AND c._self LIKE '%verification-tokens%'"
        val results = pendingContainer.queryItems(query, null, PendingUser::class.java)
        val pendingUser = results.firstOrNull()
        
        if (pendingUser != null) {
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