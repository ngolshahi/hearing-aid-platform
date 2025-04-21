package model

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class User @JsonCreator constructor(
    @JsonProperty("id") val id: String = "",
    @JsonProperty("name") val name: String = "",
    @JsonProperty("email") val email: String = "",
    @JsonProperty("password") val password: String = "",
    @JsonProperty("phone") val phone: String? = null,
    @JsonProperty("image") val image: String? = null,
    @JsonProperty("details") val details: UserDetails? = null,
    @JsonProperty("verified") val verified: Boolean = false
)

@Serializable
data class HearingAid @JsonCreator constructor(
    @JsonProperty("id") val id: String = UUID.randomUUID().toString(),
    @JsonProperty("name") val name: String = "",
    @JsonProperty("subtitle") val subtitle: String = "",
    @JsonProperty("brand") val brand: String = "",
    @JsonProperty("type") val type: String = "",
    @JsonProperty("price") val price: Double = 0.0,
    @JsonProperty("rating") val rating: Double = 0.0,
    @JsonProperty("releaseDate") val releaseDate: String = "",
    @JsonProperty("colors") val colors: List<String> = listOf(),
    @JsonProperty("image") val image: String = "",
    @JsonProperty("images") val images: List<String>? = null,
    @JsonProperty("description") val description: String = "",
    @JsonProperty("features") val features: List<Feature>? = null,
    @JsonProperty("specifications") val specifications: Map<String, String>? = null
)

@Serializable
data class Feature @JsonCreator constructor(
    @JsonProperty("icon") val icon: String = "",
    @JsonProperty("title") val title: String = "",
    @JsonProperty("description") val description: String = ""
)

@Serializable
data class Appointment @JsonCreator constructor(
    @JsonProperty("id") val id: String = UUID.randomUUID().toString(),
    @JsonProperty("audiologistId") val audiologistId: String = "",
    @JsonProperty("appointmentType") val appointmentType: String = "",
    @JsonProperty("date") val date: String = "",
    @JsonProperty("startTime") val startTime: String = "",
    @JsonProperty("endTime") val endTime: String = "",
    @JsonProperty("status") val status: String = "",
    @JsonProperty("userId") val userId: String? = null,
    @JsonProperty("notes") val notes: String? = null,
    @JsonProperty("userDetails") val userDetails: UserDetails? = null
)

@Serializable
data class UserDetails @JsonCreator constructor(
    @JsonProperty("firstName") val firstName: String = "",
    @JsonProperty("surname") val surname: String = "",
    @JsonProperty("addressNumber") val addressNumber: String = "",
    @JsonProperty("street") val street: String = "",
    @JsonProperty("city") val city: String = "",
    @JsonProperty("county") val county: String = "",
    @JsonProperty("postcode") val postcode: String = ""
)

@Serializable
data class Audiologist @JsonCreator constructor(
    @JsonProperty("id") val id: String = "",
    @JsonProperty("name") val name: String = "",
    @JsonProperty("image") val image: String = "",
    @JsonProperty("description") val description: String = "",
    @JsonProperty("qualifications") val qualifications: String = "",
    @JsonProperty("email") val email: String = "",
    @JsonProperty("phone") val phone: String = "",
    @JsonProperty("workSchedule") val workSchedule: Map<String, WorkHours> = mapOf(),
    @JsonProperty("password") val password: String = ""
)

@Serializable
data class WorkHours @JsonCreator constructor(
    @JsonProperty("start") val start: String = "",
    @JsonProperty("end") val end: String = ""
)

@Serializable
data class AppointmentType @JsonCreator constructor(
    @JsonProperty("id") val id: String = "",
    @JsonProperty("type") val type: String = "",
    @JsonProperty("duration") val duration: Int = 0,
    @JsonProperty("icon") val icon: String = ""
)

@Serializable
data class AppointmentRequest @JsonCreator constructor(
    @JsonProperty("appointmentTypeId") val appointmentTypeId: String = "",
    @JsonProperty("date") val date: String = "",
    @JsonProperty("time") val time: String = "",
    @JsonProperty("userId") val userId: String? = null,
    @JsonProperty("notes") val notes: String? = null,
    @JsonProperty("userDetails") val userDetails: UserDetails? = null
)

@Serializable
data class AppointmentResponse @JsonCreator constructor(
    @JsonProperty("success") val success: Boolean = false,
    @JsonProperty("appointmentId") val appointmentId: String? = null,
    @JsonProperty("message") val message: String = ""
)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class AuthResponse(val email: String?, val token: String?, val message: String)

@Serializable
data class UserRequest(val email: String, val password: String, val firstName: String? = null, val lastName: String? = null)

@Serializable
data class UserRegistrationResponse(
    val user: User? = null,
    val message: String = ""
)

@Serializable
data class HearingTest @JsonCreator constructor(
    @JsonProperty("id") val id: String = UUID.randomUUID().toString(),
    @JsonProperty("userId") val userId: String? = null,
    @JsonProperty("date") val date: String = "",
    @JsonProperty("results") val results: List<ToneTestResult> = listOf(),
    @JsonProperty("overallScore") val overallScore: Int = 0,
    @JsonProperty("recommendation") val recommendation: String = ""
)

@Serializable
data class ToneTestResult @JsonCreator constructor(
    @JsonProperty("frequency") val frequency: Int = 0,
    @JsonProperty("heard") val heard: Boolean = false,
    @JsonProperty("intensity") val intensity: Int = 50 // Volume level 0-100
)

@Serializable
data class HearingTestRequest @JsonCreator constructor(
    @JsonProperty("userId") val userId: String? = null,
    @JsonProperty("results") val results: List<ToneTestResult> = listOf()
)

@Serializable
data class HearingTestResponse @JsonCreator constructor(
    @JsonProperty("testId") val testId: String = "",
    @JsonProperty("overallScore") val overallScore: Int = 0,
    @JsonProperty("recommendation") val recommendation: String = ""
)

@Serializable
data class ContextualTest @JsonCreator constructor(
    @JsonProperty("id") val id: String = UUID.randomUUID().toString(),
    @JsonProperty("title") val title: String = "",
    @JsonProperty("description") val description: String = "",
    @JsonProperty("audioUrl") val audioUrl: String = "",
    @JsonProperty("questions") val questions: List<ContextualQuestion> = listOf(),
    @JsonProperty("backgroundNoise") val backgroundNoise: String = "none" // "none", "low", "medium", "high"
)

@Serializable
data class ContextualQuestion @JsonCreator constructor(
    @JsonProperty("id") val id: String = UUID.randomUUID().toString(),
    @JsonProperty("text") val text: String = "",
    @JsonProperty("options") val options: List<String> = listOf(),
    @JsonProperty("correctAnswer") val correctAnswer: Int = 0
)

@Serializable
data class ContextualTestResult @JsonCreator constructor(
    @JsonProperty("userId") val userId: String? = null,
    @JsonProperty("testId") val testId: String = "",
    @JsonProperty("score") val score: Int = 0,
    @JsonProperty("maxScore") val maxScore: Int = 0,
    @JsonProperty("answers") val answers: Map<String, Int> = mapOf()
)

@Serializable
data class CompleteHearingTestResult @JsonCreator constructor(
    @JsonProperty("id") val id: String = UUID.randomUUID().toString(),
    @JsonProperty("userId") val userId: String? = null,
    @JsonProperty("date") val date: String = "",
    @JsonProperty("toneResults") val toneResults: List<ToneTestResult> = listOf(),
    @JsonProperty("contextualResult") val contextualResult: ContextualTestResult? = null,
    @JsonProperty("toneScore") val toneScore: Int = 0,
    @JsonProperty("overallScore") val overallScore: Int = 0,
    @JsonProperty("recommendation") val recommendation: String = ""
)