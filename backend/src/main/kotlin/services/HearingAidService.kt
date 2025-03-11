package services

import model.HearingAid
import repository.HearingAidRepository
import io.ktor.http.HttpStatusCode

class HearingAidService(private val hearingAidRepository: HearingAidRepository = HearingAidRepository()) {
    
    fun getAllHearingAids(): List<HearingAid> {
        return hearingAidRepository.getHearingAids()
    }
    
    fun getHearingAidById(id: String): HearingAid? {
        return hearingAidRepository.getHearingAidById(id)
    }
    
    suspend fun createHearingAid(hearingAid: HearingAid): HttpStatusCode {
        return hearingAidRepository.createHearingAid(hearingAid)
    }
    
    suspend fun updateHearingAid(hearingAid: HearingAid): HttpStatusCode {
        // Check if hearing aid exists before updating
        val existingHearingAid = hearingAidRepository.getHearingAidById(hearingAid.id)
        if (existingHearingAid == null) {
            return HttpStatusCode.NotFound
        }
        
        return hearingAidRepository.updateHearingAid(hearingAid)
    }
    
    suspend fun deleteHearingAid(id: String): HttpStatusCode {
        // Check if hearing aid exists before deleting
        val existingHearingAid = hearingAidRepository.getHearingAidById(id)
        if (existingHearingAid == null) {
            return HttpStatusCode.NotFound
        }
        
        return hearingAidRepository.deleteHearingAid(id)
    }
}