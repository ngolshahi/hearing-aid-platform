package service

import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service

@Service
class EmailService(private val mailSender: JavaMailSender) {
    
    fun sendVerificationEmail(email: String, verificationCode: String) {
        val message = SimpleMailMessage().apply {
            setTo(email)
            setSubject("Email Verification")
            setText("""
                Thank you for registering! Please verify your email by entering the following code:
                
                $verificationCode
                
                If you did not request this verification, please ignore this email.
            """.trimIndent())
        }
        
        mailSender.send(message)
    }
} 