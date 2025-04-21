package utils

import java.util.regex.Pattern

/**
 * Utility class for input validation
 */
object ValidationUtils {
    
    // Email regex pattern
    private val EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@(.+)$"
    )
    
    // Password regex pattern - at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    private val PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$"
    )
    
    /**
     * Validate a name
     * @param name The name to validate
     * @return true if the name is valid, false otherwise
     */
    fun isValidName(name: String): Boolean {
        return name.isNotBlank() && name.length >= 2 && name.matches(Regex("^[a-zA-Z\\s'-]+$"))
    }
    
    /**
     * Validate an email address
     * @param email The email to validate
     * @return true if the email is valid, false otherwise
     */
    fun isValidEmail(email: String): Boolean {
        return EMAIL_PATTERN.matcher(email).matches()
    }
    
    /**
     * Validate a password
     * @param password The password to validate
     * @return true if the password is valid, false otherwise
     */
    fun isValidPassword(password: String): Boolean {
        return PASSWORD_PATTERN.matcher(password).matches()
    }
    
    /**
     * Get password strength requirements
     * @return A string describing password requirements
     */
    fun getPasswordRequirements(): String {
        return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    }
} 