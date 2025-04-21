package services

import model.User
import repository.UserRepository
import io.ktor.http.HttpStatusCode
import utils.PasswordUtils

class AuthService(private val userRepository: UserRepository = UserRepository()) {
    
    suspend fun registerUser(name: String, email: String, password: String): User? {
        // In a real application, you should:
        // 1. Validate user input (email format, password strength, etc.)
        // 2. Check if user already exists
        // 3. Hash the password
        // 4. Create the user
        
        val existingUser = userRepository.readUser(email)
        if (existingUser != null) {
            return null // User already exists
        }
        
        return userRepository.createUser(name, email, password)
    }
    
    fun authenticateUser(email: String, password: String): User? {
        return userRepository.verifyPassword(email, password)
    }
    
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