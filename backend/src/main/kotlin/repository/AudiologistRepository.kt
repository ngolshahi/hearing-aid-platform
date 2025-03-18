package repository

import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.Audiologist

class AudiologistRepository {
    private val audiologistsContainer = DatabaseConfig.getAudiologistsContainer()
    
    fun getAudiologistById(id: String): Audiologist {
        val response = audiologistsContainer.readItem(
            id, PartitionKey(id), Audiologist::class.java
        )
        return response.item
    }
    
    fun getAllAudiologists(): List<Audiologist> {
        val query = "SELECT * FROM c"
        val audiologists = mutableListOf<Audiologist>()
        val queryIterable = audiologistsContainer.queryItems(
            query, null, Audiologist::class.java
        )
        
        queryIterable.forEach { audiologists.add(it) }
        return audiologists
    }

    fun updateAudiologist(audiologist: Audiologist): Audiologist {
        val response = audiologistsContainer.replaceItem(
            audiologist,
            audiologist.id,
            PartitionKey(audiologist.id),
            null
        )
        return response.item
    }
}