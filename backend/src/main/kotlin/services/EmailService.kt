package services

import io.github.cdimascio.dotenv.Dotenv
import java.util.Properties
import java.util.Random
import javax.mail.Authenticator
import javax.mail.Message
import javax.mail.MessagingException
import javax.mail.PasswordAuthentication
import javax.mail.Session
import javax.mail.Transport
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage

/**
 * Service for sending emails via SMTP
 */
class EmailService {
    private val dotenv = Dotenv.load()
    
    // SMTP configuration
    private val smtpHost = dotenv["SMTP_HOST"] ?: "smtp.gmail.com"
    private val smtpPort = dotenv["SMTP_PORT"] ?: "587"
    private val smtpUser = dotenv["SMTP_USER"] ?: throw IllegalArgumentException("SMTP_USER env variable is required")
    private val smtpPassword = dotenv["SMTP_PASSWORD"] ?: throw IllegalArgumentException("SMTP_PASSWORD env variable is required")
    private val fromEmail = dotenv["FROM_EMAIL"] ?: smtpUser
    private val appName = dotenv["APP_NAME"] ?: "Hearing Aid Platform"
    
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
            // Set up mail server properties
            val properties = Properties()
            properties["mail.smtp.host"] = smtpHost
            properties["mail.smtp.port"] = smtpPort
            properties["mail.smtp.auth"] = "true"
            properties["mail.smtp.starttls.enable"] = "true"
            
            // Create a session with authentication
            val session = Session.getInstance(properties, object : Authenticator() {
                override fun getPasswordAuthentication(): PasswordAuthentication {
                    return PasswordAuthentication(smtpUser, smtpPassword)
                }
            })
            
            // Create the email message
            val message = MimeMessage(session)
            message.setFrom(InternetAddress(fromEmail))
            message.addRecipient(Message.RecipientType.TO, InternetAddress(email))
            message.subject = "Verify Your Email - $appName"
            
            // Create a nice HTML email body with the OTP
            val htmlContent = """
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #2c5282; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .otp { font-size: 32px; font-weight: bold; text-align: center; color: #2c5282; 
                               letter-spacing: 5px; margin: 20px 0; }
                        .verify-button { background-color: #2c5282; color: white; padding: 12px 20px; 
                                       text-decoration: none; border-radius: 4px; font-weight: bold; 
                                       display: inline-block; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Verification</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Thank you for registering with $appName. To complete your registration, please use the following verification code:</p>
                            <div class="otp">$otp</div>
                            <p>Or click the button below to verify your email:</p>
                            <div style="text-align: center;">
                                <a href="${dotenv["APP_URL"] ?: "http://localhost:3000"}/verify?email=${email}&token=${otp}" class="verify-button">
                                    Verify Email
                                </a>
                            </div>
                            <p>This code will expire in 1 hour.</p>
                            <p>If you did not request this verification, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${java.time.Year.now().value} $appName. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            """.trimIndent()
            
            // Set the HTML content
            message.setContent(htmlContent, "text/html; charset=utf-8")
            
            // Send the message
            Transport.send(message)
            
            println("Verification email sent successfully to $email")
            return true
        } catch (e: MessagingException) {
            println("Error sending verification email: ${e.message}")
            e.printStackTrace()
            return false
        } catch (e: Exception) {
            println("Unexpected error in sendVerificationEmail: ${e.message}")
            e.printStackTrace()
            return false
        }
    }
} 