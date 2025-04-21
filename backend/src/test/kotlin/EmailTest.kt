import services.EmailService
import kotlin.test.Test

class EmailTest {
    
    /**
     * Test sending an email with SMTP
     * Note: This test requires proper SMTP configuration in your .env file
     * Comment out the @Test annotation if you don't want to run this test
     */
    // @Test
    fun testSendEmail() {
        // Replace with your actual test email
        val testEmail = "your_test_email@example.com"
        
        val emailService = EmailService()
        val otp = emailService.generateOTP()
        
        println("Sending verification email to $testEmail with OTP: $otp")
        val result = emailService.sendVerificationEmail(testEmail, otp)
        
        println("Email sent: $result")
        assert(result) { "Failed to send email" }
    }
} 