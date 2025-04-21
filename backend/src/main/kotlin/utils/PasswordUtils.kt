package utils

import org.mindrot.jbcrypt.BCrypt

/**
 * Utility class for password hashing and verification
 */
object PasswordUtils {
    
    /**
     * Hash a password using BCrypt
     * @param password The plain text password to hash
     * @return The hashed password
     */
    fun hashPassword(password: String): String {
        return BCrypt.hashpw(password, BCrypt.gensalt())
    }
    
    /**
     * Verify a password against a hash
     * @param password The plain text password to verify
     * @param hashedPassword The hashed password to check against
     * @return true if the password matches the hash, false otherwise
     */
    fun verifyPassword(password: String, hashedPassword: String): Boolean {
        return BCrypt.checkpw(password, hashedPassword)
    }
} 