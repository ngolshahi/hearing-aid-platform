package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.CosmosQueryRequestOptions
import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.HearingAid
import io.ktor.http.HttpStatusCode

class HearingAidRepository {
    private val container: CosmosContainer = DatabaseConfig.getHearingAidsContainer()

    fun getHearingAids(): List<HearingAid> {
        val queryOptions = CosmosQueryRequestOptions()
        val sqlQuery = "SELECT * FROM c"
        
        return try {
            val hearingAids = mutableListOf<HearingAid>()
            val queryIterable = container.queryItems(sqlQuery, queryOptions, HearingAid::class.java)
            
            for (item in queryIterable) {
                hearingAids.add(item)
            }
            
            hearingAids
        } catch (e: Exception) {
            println("Error fetching hearing aids from database")
            e.printStackTrace()
            emptyList()
        }
    }
    
    fun getHearingAidById(id: String): HearingAid? {
        return try {
            val response = container.readItem(id, PartitionKey(id), HearingAid::class.java)
            response.item
        } catch (e: Exception) {
            println("Error reading hearing aid with ID: $id")
            e.printStackTrace()
            null
        }
    }
    
    suspend fun createHearingAid(hearingAid: HearingAid): HttpStatusCode {
        return try {
            val itemResponse = container.createItem(hearingAid)
            if (itemResponse.statusCode == 201) {
                HttpStatusCode.Created
            } else {
                HttpStatusCode.InternalServerError
            }
        } catch (e: Exception) {
            println("Error creating hearing aid.")
            e.printStackTrace()
            HttpStatusCode.InternalServerError
        }
    }
    
    suspend fun updateHearingAid(hearingAid: HearingAid): HttpStatusCode {
        return try {
            val itemResponse = container.replaceItem(
                hearingAid,
                hearingAid.id,
                PartitionKey(hearingAid.id),
                null
            )
            if (itemResponse.statusCode == 200) {
                HttpStatusCode.OK
            } else {
                HttpStatusCode.InternalServerError
            }
        } catch (e: Exception) {
            println("Error updating hearing aid with ID: ${hearingAid.id}")
            e.printStackTrace()
            HttpStatusCode.InternalServerError
        }
    }
    
    suspend fun deleteHearingAid(id: String): HttpStatusCode {
        return try {
            val itemResponse = container.deleteItem(id, PartitionKey(id), null)
            if (itemResponse.statusCode == 204) {
                HttpStatusCode.NoContent
            } else {
                HttpStatusCode.InternalServerError
            }
        } catch (e: Exception) {
            println("Error deleting hearing aid with ID: $id")
            e.printStackTrace()
            HttpStatusCode.InternalServerError
        }
    }
}