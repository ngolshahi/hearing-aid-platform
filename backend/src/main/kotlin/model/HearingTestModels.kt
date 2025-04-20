package model

data class SpeechInNoiseResult(
    val sentence: String,
    val recognizedText: String,
    val isCorrect: Boolean
)

data class SpeechInNoiseTestRequest(
    val userId: String?,
    val results: List<SpeechInNoiseResult>,
    val noiseLevel: String,
    val noiseType: String
)

data class SpeechInNoiseTestResponse(
    val testId: String,
    val overallScore: Int,
    val recommendation: String
) 