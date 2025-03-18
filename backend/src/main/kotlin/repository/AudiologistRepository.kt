package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.Audiologist
import io.ktor.http.HttpStatusCode
import com.azure.cosmos.models.SqlParameter
import com.azure.cosmos.models.SqlQuerySpec

class AudiologistRepository {
    private val audiologistsContainer: CosmosContainer = DatabaseConfig.getAudiologistsContainer()

    fun getAudiologistById(id: String): Audiologist? {
        return try {
            // Retrieve the item using the email as both ID and partition key
            val response = audiologistsContainer.readItem(id, PartitionKey(id), Audiologist::class.java)
            val item = response.item
            Audiologist(id = item.id, name = item.name, image = item.image, description = item.description, qualifications = item.qualifications, email = item.email, phone = item.phone, workSchedule = item.workSchedule, password = item.password)
        } catch (e: Exception) {
            println("Error reading user with id $id")
            e.printStackTrace()
            null
        }
    }
    
    fun getAudiologistByEmail(email: String): Audiologist? {
        val query = SqlQuerySpec(
            "SELECT * FROM c WHERE c.email = @email",
            listOf(SqlParameter("@email", email))
        )
    
        val queryIterable = audiologistsContainer.queryItems(
            query, null, Audiologist::class.java
        )
    
        return queryIterable.firstOrNull()
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

    fun authenticateAudiologist(email: String, password: String): Audiologist? {
        val audiologist = getAudiologistByEmail(email)
        if (audiologist != null && audiologist.password == password) {
            return audiologist
        }
        return null
    }
}