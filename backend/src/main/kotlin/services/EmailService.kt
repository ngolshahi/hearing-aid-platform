package services

import java.util.Random

/**
 * Service for sending emails
 * This is a simple implementation that logs to the console
 * In a production environment, you would use a real email service
 */
class EmailService {
    
    /**
     * Generate a random OTP (One-Time Password)
     * @param length The length of the OTP
     * @return The generated OTP
     */
    fun generateOTP(length: Int = 6): String {
        val random = Random()
        val otp = StringBuilder()
        
        for (i in 0 until length) {
            otp.append(random.nextInt(10))
        }
        
        return otp.toString()
    }
    
    /**
     * Send a verification email with OTP
     * @param email The recipient's email address
     * @param otp The OTP to include in the email
     * @return true if the email was sent successfully, false otherwise
     */
    fun sendVerificationEmail(email: String, otp: String): Boolean {
        try {
            // In a real application, you would use a library like JavaMail or a service like SendGrid
            println("Sending verification email to $email with OTP: $otp")
            return true
        } catch (e: Exception) {
            println("Error sending verification email: ${e.message}")
            e.printStackTrace()
            return false
        }
    }
} 