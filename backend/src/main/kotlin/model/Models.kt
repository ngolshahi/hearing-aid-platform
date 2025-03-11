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
    @JsonProperty("password") val password: String = ""
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