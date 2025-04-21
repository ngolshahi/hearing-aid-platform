package services

import io.github.cdimascio.dotenv.Dotenv
import java.util.Properties
import javax.mail.Message
import javax.mail.MessagingException
import javax.mail.Session
import javax.mail.Transport
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage

/**
 * Service for sending emails
 */
class EmailService {
    
    // Load environment variables
    private val dotenv = Dotenv.load()
    
    // Email configuration
    private val smtpHost = dotenv["SMTP_HOST"] ?: "smtp.gmail.com"
    private val smtpPort = dotenv["SMTP_PORT"]?.toInt() ?: 587
    private val smtpUsername = dotenv["SMTP_USERNAME"] ?: ""
    private val smtpPassword = dotenv["SMTP_PASSWORD"] ?: ""
    private val fromEmail = dotenv["FROM_EMAIL"] ?: "noreply@hearingaidplatform.com"
    
    /**
     * Send a verification email with OTP
     * @param toEmail The recipient's email
     * @param name The recipient's name
     * @param otp The OTP to include in the email
     * @return true if the email was sent successfully, false otherwise
     */
    fun sendVerificationEmail(toEmail: String, name: String, otp: String): Boolean {
        val subject = "Email Verification - Hearing Aid Platform"
        val body = """
            <html>
            <body>
                <h2>Hello $name,</h2>
                <p>Thank you for registering with the Hearing Aid Platform. Please verify your email address by entering the following OTP:</p>
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">$otp</h1>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you did not register for an account, please ignore this email.</p>
                <p>Best regards,<br>The Hearing Aid Platform Team</p>
            </body>
            </html>
        """.trimIndent()
        
        return sendEmail(toEmail, subject, body)
    }
    
    /**
     * Send an email
     * @param toEmail The recipient's email
     * @param subject The email subject
     * @param body The email body (HTML)
     * @return true if the email was sent successfully, false otherwise
     */
    private fun sendEmail(toEmail: String, subject: String, body: String): Boolean {
        try {
            // Set up mail server properties
            val props = Properties()
            props["mail.smtp.host"] = smtpHost
            props["mail.smtp.port"] = smtpPort.toString()
            props["mail.smtp.auth"] = "true"
            props["mail.smtp.starttls.enable"] = "true"
            
            // Create a session with the mail server
            val session = Session.getInstance(props, object : javax.mail.Authenticator() {
                override fun getPasswordAuthentication(): javax.mail.PasswordAuthentication {
                    return javax.mail.PasswordAuthentication(smtpUsername, smtpPassword)
                }
            })
            
            // Create a message
            val message = MimeMessage(session)
            message.setFrom(InternetAddress(fromEmail))
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail))
            message.setSubject(subject)
            message.setContent(body, "text/html; charset=utf-8")
            
            // Send the message
            Transport.send(message)
            
            return true
        } catch (e: MessagingException) {
            println("Error sending email: ${e.message}")
            e.printStackTrace()
            return false
        }
    }
} 