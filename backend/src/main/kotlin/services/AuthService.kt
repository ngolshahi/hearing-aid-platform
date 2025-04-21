package services

import model.User
import model.RegistrationResponse
import model.VerificationResponse
import repository.UserRepository
import io.ktor.http.HttpStatusCode
import utils.PasswordUtils
import utils.ValidationUtils
import utils.OTPUtils

class AuthService(
    private val userRepository: UserRepository = UserRepository(),
    private val emailService: EmailService = EmailService()
) {
    
    suspend fun registerUser(name: String, email: String, password: String): RegistrationResponse {
        // Validate inputs
        if (!ValidationUtils.isValidName(name)) {
            return RegistrationResponse(
                success = false,
                message = "Invalid name. Name should contain only letters, spaces, hyphens, and apostrophes."
            )
        }
        
        if (!ValidationUtils.isValidEmail(email)) {
            return RegistrationResponse(
                success = false,
                message = "Invalid email format."
            )
        }
        
        if (!ValidationUtils.isValidPassword(password)) {
            return RegistrationResponse(
                success = false,
                message = "Password does not meet requirements. ${ValidationUtils.getPasswordRequirements()}"
            )
        }
        
        // Check if user already exists
        val existingUser = userRepository.readUser(email)
        if (existingUser != null) {
            return RegistrationResponse(
                success = false,
                message = "User with this email already exists."
            )
        }
        
        // Hash the password
        val hashedPassword = PasswordUtils.hashPassword(password)
        
        // Create the user with isVerified = false
        val user = User(
            id = email,
            name = name,
            email = email,
            password = hashedPassword,
            isVerified = false
        )
        
        // Save the user to the database
        val savedUser = userRepository.createUser(user)
        
        if (savedUser != null) {
            // Generate OTP
            val otp = OTPUtils.generateOTP(email)
            
            // Send verification email
            val emailSent = emailService.sendVerificationEmail(email, name, otp)
            
            if (emailSent) {
                return RegistrationResponse(
                    success = true,
                    message = "Registration successful. Please check your email for verification code.",
                    email = email,
                    requiresVerification = true
                )
            } else {
                return RegistrationResponse(
                    success = true,
                    message = "Registration successful, but verification email could not be sent. Please contact support.",
                    email = email,
                    requiresVerification = true
                )
            }
        } else {
            return RegistrationResponse(
                success = false,
                message = "Failed to create user."
            )
        }
    }
    
    fun verifyEmail(email: String, otp: String): VerificationResponse {
        // Check if user exists
        val user = userRepository.readUser(email) ?: return VerificationResponse(
            success = false,
            message = "User not found."
        )
        
        // Check if user is already verified
        if (user.isVerified) {
            return VerificationResponse(
                success = true,
                message = "Email already verified."
            )
        }
        
        // Verify OTP
        val isOtpValid = OTPUtils.verifyOTP(email, otp)
        
        if (isOtpValid) {
            // Update user verification status
            val updatedUser = user.copy(isVerified = true)
            val result = userRepository.updateUser(updatedUser)
            
            if (result != null) {
                return VerificationResponse(
                    success = true,
                    message = "Email verified successfully."
                )
            } else {
                return VerificationResponse(
                    success = false,
                    message = "Failed to update user verification status."
                )
            }
        } else {
            return VerificationResponse(
                success = false,
                message = "Invalid or expired OTP."
            )
        }
    }
    
    fun authenticateUser(email: String, password: String): User? {
        val user = userRepository.verifyPassword(email, password)
        
        // Check if user is verified
        if (user != null && !user.isVerified) {
            return null
        }
        
        return user
    }
    
    fun updateUser(user: User): User? {
        // Check if the password has been changed
        val existingUser = userRepository.readUser(user.email)
        
        if (existingUser != null) {
            // If the password is different from the existing one, hash it
            if (user.password != existingUser.password) {
                // Validate the new password
                if (!ValidationUtils.isValidPassword(user.password)) {
                    return null
                }
                
                val hashedPassword = PasswordUtils.hashPassword(user.password)
                val updatedUser = user.copy(password = hashedPassword)
                return userRepository.updateUser(updatedUser)
            }
        }
        
        return userRepository.updateUser(user)
    }
}