package config

import com.azure.core.util.serializer.JacksonAdapter
import com.azure.core.util.serializer.SerializerAdapter
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule

/**
 * Configure Jackson serialization for Azure CosmosDB
 */
object JacksonConfig {
    /**
     * Get a configured Jackson adapter for Azure CosmosDB
     */
    fun getConfiguredMapper(): ObjectMapper {
        return ObjectMapper().apply {
            registerModule(JavaTimeModule())
            disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        }
    }
    
    /**
     * Get a configured Azure SerializerAdapter
     */
    fun getConfiguredSerializer(): SerializerAdapter {
        return JacksonAdapter().serializer(JacksonAdapter.createDefaultSerializerBuilder()
            .addModule(JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .build())
    }
} 