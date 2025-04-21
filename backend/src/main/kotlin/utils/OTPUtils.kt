package utils

import java.security.SecureRandom
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

/**
 * Utility class for OTP (One-Time Password) generation and verification
 */
object OTPUtils {
    
    // Store OTPs with their expiration times
    private val otpStore = ConcurrentHashMap<String, OTPData>()
    
    // OTP length
    private const val OTP_LENGTH = 6
    
    // OTP expiration time in minutes
    private const val OTP_EXPIRATION_MINUTES = 10L
    
    /**
     * Generate a new OTP for the given email
     * @param email The email to generate an OTP for
     * @return The generated OTP
     */
    fun generateOTP(email: String): String {
        val otp = generateRandomOTP()
        val expirationTime = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES)
        
        // Store the OTP with its expiration time
        otpStore[email] = OTPData(otp, expirationTime)
        
        return otp
    }
    
    /**
     * Verify an OTP for the given email
     * @param email The email to verify the OTP for
     * @param otp The OTP to verify
     * @return true if the OTP is valid, false otherwise
     */
    fun verifyOTP(email: String, otp: String): Boolean {
        val otpData = otpStore[email] ?: return false
        
        // Check if the OTP has expired
        if (LocalDateTime.now().isAfter(otpData.expirationTime)) {
            otpStore.remove(email)
            return false
        }
        
        // Check if the OTP matches
        if (otpData.otp == otp) {
            // Remove the OTP after successful verification
            otpStore.remove(email)
            return true
        }
        
        return false
    }
    
    /**
     * Generate a random OTP
     * @return The generated OTP
     */
    private fun generateRandomOTP(): String {
        val random = SecureRandom()
        val digits = "0123456789"
        val otp = StringBuilder(OTP_LENGTH)
        
        for (i in 0 until OTP_LENGTH) {
            otp.append(digits[random.nextInt(digits.length)])
        }
        
        return otp.toString()
    }
    
    /**
     * Data class to store OTP and its expiration time
     */
    private data class OTPData(
        val otp: String,
        val expirationTime: LocalDateTime
    )
} 