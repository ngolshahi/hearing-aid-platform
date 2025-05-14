package routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import model.*
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

// Background noise levels
private enum class BackgroundNoise { none, low, medium, high }

// Sample contextual tests that we'll serve
private val sampleContextualTests = listOf(
    ContextualTest(
        id = "cafe-conversation",
        title = "Café Conversation",
        description = "You are sitting in a busy café. Two people at the next table are having a conversation about their weekend plans.",
        audioUrl = "/audio/cafe-conversation.mp3",
        backgroundNoise = BackgroundNoise.medium.name,
        questions = listOf(
            ContextualQuestion(
                id = "q1",
                text = "What day are they planning to meet?",
                options = listOf("Friday", "Saturday", "Sunday", "Monday"),
                correctAnswer = 1 // Saturday (index 1)
            ),
            ContextualQuestion(
                id = "q2",
                text = "Where are they planning to go?",
                options = listOf("Movie theater", "Restaurant", "Museum", "Park"),
                correctAnswer = 3 // Park (index 3)
            ),
            ContextualQuestion(
                id = "q3",
                text = "What time are they planning to meet?",
                options = listOf("10:00 AM", "12:30 PM", "2:00 PM", "4:30 PM"),
                correctAnswer = 2 // 2:00 PM (index 2)
            )
        )
    ),
    ContextualTest(
        id = "restaurant-order",
        title = "Restaurant Order",
        description = "You are at a restaurant with a lot of background noise. The waiter is taking your order.",
        audioUrl = "/audio/restaurant-order.mp3",
        backgroundNoise = BackgroundNoise.high.name,
        questions = listOf(
            ContextualQuestion(
                id = "q1",
                text = "What special is the waiter recommending?",
                options = listOf("Chicken Parmesan", "Grilled Salmon", "Beef Wellington", "Vegetable Stir Fry"),
                correctAnswer = 1 // Grilled Salmon
            ),
            ContextualQuestion(
                id = "q2",
                text = "What side dish comes with the special?",
                options = listOf("Mashed potatoes", "Rice pilaf", "Roasted vegetables", "Garden salad"),
                correctAnswer = 2 // Roasted vegetables
            ),
            ContextualQuestion(
                id = "q3",
                text = "What is the price of the special?",
                options = listOf("$18.95", "$21.50", "$24.95", "$27.50"),
                correctAnswer = 2 // $24.95
            )
        )
    )
)

// Sample sentences for speech-in-noise test
private val speechInNoiseSentences = listOf(
    "The quick brown fox jumps over the lazy dog",
    "She sells seashells by the seashore",
    "How much wood would a woodchuck chuck",
    "Peter Piper picked a peck of pickled peppers",
    "The rain in Spain stays mainly in the plain"
)

fun Route.hearingTestRoutes() {

    // Endpoint to save hearing test results
    post("/api/hearing-test") {
        try {
            val request = call.receive<HearingTestRequest>()
            
            // Calculate a simple overall score based on number of frequencies heard
            val heardCount = request.results.count { it.heard }
            val totalTests = request.results.size
            val overallScore = if (totalTests > 0) (heardCount * 100) / totalTests else 0
            
            // Generate a basic recommendation based on score
            val recommendation = when {
                overallScore >= 90 -> "Your hearing appears to be normal. Regular check-ups are recommended."
                overallScore >= 70 -> "You have mild hearing loss. Consider scheduling a consultation with our audiologist."
                overallScore >= 50 -> "You have moderate hearing loss. We recommend booking a professional consultation."
                else -> "You have significant hearing loss. Please schedule a consultation with our audiologist as soon as possible."
            }
            
            // Create a new hearing test record
            val hearingTest = HearingTest(
                userId = request.userId,
                date = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME),
                results = request.results,
                overallScore = overallScore,
                recommendation = recommendation
            )
            
            // In a real implementation, save this to a database
            // For now, we'll just return the response
            
            call.respond(
                HttpStatusCode.OK,
                HearingTestResponse(
                    testId = hearingTest.id,
                    overallScore = overallScore,
                    recommendation = recommendation
                )
            )
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError, 
                mapOf("error" to "Failed to process hearing test: ${e.message}")
            )
        }
    }
    
    // Get available contextual tests
    get("/api/hearing-test/contextual") {
        try {
            // In a real implementation, fetch from database
            // For now, return the sample tests
            call.respond(HttpStatusCode.OK, sampleContextualTests)
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError, 
                mapOf("error" to "Failed to retrieve contextual tests: ${e.message}")
            )
        }
    }
    
    // Get a specific contextual test by ID
    get("/api/hearing-test/contextual/{id}") {
        try {
            val id = call.parameters["id"] ?: return@get call.respond(
                HttpStatusCode.BadRequest, 
                mapOf("error" to "Missing test ID")
            )
            
            val test = sampleContextualTests.find { it.id == id }
            
            if (test != null) {
                call.respond(HttpStatusCode.OK, test)
            } else {
                call.respond(
                    HttpStatusCode.NotFound, 
                    mapOf("error" to "Contextual test not found")
                )
            }
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError, 
                mapOf("error" to "Failed to retrieve contextual test: ${e.message}")
            )
        }
    }
    
    // Submit contextual test results
    post("/api/hearing-test/contextual") {
        try {
            val result = call.receive<ContextualTestResult>()
            
            // In a real implementation, save to database
            // For now, just return success
            
            call.respond(
                HttpStatusCode.OK,
                mapOf("message" to "Contextual test results saved successfully")
            )
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError, 
                mapOf("error" to "Failed to save contextual test results: ${e.message}")
            )
        }
    }
    
    // Submit complete hearing test results (tone + contextual)
    post("/api/hearing-test/complete") {
        try {
            val request = call.receive<CompleteHearingTestResult>()
            
            // In a real implementation, save to database and perform calculations
            // For now, just return success
            
            call.respond(
                HttpStatusCode.OK,
                mapOf("message" to "Complete hearing test results saved successfully")
            )
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError, 
                mapOf("error" to "Failed to save complete test results: ${e.message}")
            )
        }
    }
    
    // Get test results for a user (placeholder for future implementation)
    get("/api/hearing-test/{userId}") {
        try {
            val userId = call.parameters["userId"] ?: return@get call.respond(
                HttpStatusCode.BadRequest, 
                mapOf("error" to "Missing user ID")
            )
            
            // In a real implementation, fetch from database
            // For now, return a placeholder response
            
            call.respond(
                HttpStatusCode.OK,
                mapOf("message" to "Test history feature coming soon")
            )
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError, 
                mapOf("error" to "Failed to retrieve hearing test history: ${e.message}")
            )
        }
    }

    // Endpoint for speech-in-noise test
    post("/api/hearing-test/speech-in-noise") {
        try {
            val request = call.receive<SpeechInNoiseTestRequest>()
            
            // Calculate score based on correct recognitions
            val correctCount = request.results.count { it.isCorrect }
            val totalTests = request.results.size
            val overallScore = if (totalTests > 0) (correctCount * 100) / totalTests else 0
            
            // Generate recommendation based on score
            val recommendation = when {
                overallScore >= 90 -> "Excellent speech recognition in noisy environments."
                overallScore >= 70 -> "Good speech recognition, but may have difficulty in very noisy situations."
                overallScore >= 50 -> "Moderate difficulty understanding speech in noise. Consider a consultation."
                else -> "Significant difficulty understanding speech in noise. Please schedule a consultation."
            }
            
            // Create response
            call.respond(
                HttpStatusCode.OK,
                SpeechInNoiseTestResponse(
                    testId = UUID.randomUUID().toString(),
                    overallScore = overallScore,
                    recommendation = recommendation
                )
            )
        } catch (e: Exception) {
            call.respond(
                HttpStatusCode.InternalServerError,
                mapOf("error" to "Failed to process speech-in-noise test: ${e.message}")
            )
        }
    }
} 