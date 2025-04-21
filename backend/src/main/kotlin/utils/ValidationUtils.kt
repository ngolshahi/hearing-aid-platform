package utils

/**
 * Utility class for input validation
 */
object ValidationUtils {
    
    /**
     * Validate an email address
     * @param email The email address to validate
     * @return true if the email is valid, false otherwise
     */
    fun isValidEmail(email: String): Boolean {
        val emailRegex = Regex("^[A-Za-z0-9+_.-]+@(.+)\$")
        return emailRegex.matches(email)
    }
    
    /**
     * Validate a password
     * @param password The password to validate
     * @return true if the password meets security requirements, false otherwise
     */
    fun isSecurePassword(password: String): Boolean {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        val passwordRegex = Regex("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}\$")
        return passwordRegex.matches(password)
    }
    
    /**
     * Validate a name
     * @param name The name to validate
     * @return true if the name is valid, false otherwise
     */
    fun isValidName(name: String): Boolean {
        // Name should be at least 2 characters and contain only letters, spaces, and hyphens
        val nameRegex = Regex("^[A-Za-z\\s-]{2,}\$")
        return nameRegex.matches(name)
    }
} 