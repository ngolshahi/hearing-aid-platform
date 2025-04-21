package config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl
import org.springframework.beans.factory.annotation.Value
import java.util.Properties

@Configuration
class SpringConfig {
    
    @Value("\${spring.mail.host:smtp.gmail.com}")
    private lateinit var mailHost: String
    
    @Value("\${spring.mail.port:587}")
    private val mailPort: Int = 587
    
    @Value("\${spring.mail.username:}")
    private lateinit var mailUsername: String
    
    @Value("\${spring.mail.password:}")
    private lateinit var mailPassword: String
    
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }
    
    @Bean
    fun javaMailSender(): JavaMailSender {
        val mailSender = JavaMailSenderImpl()
        mailSender.host = mailHost
        mailSender.port = mailPort
        mailSender.username = mailUsername
        mailSender.password = mailPassword
        
        val props = mailSender.javaMailProperties
        props["mail.transport.protocol"] = "smtp"
        props["mail.smtp.auth"] = "true"
        props["mail.smtp.starttls.enable"] = "true"
        props["mail.debug"] = "true"
        
        return mailSender
    }
} 