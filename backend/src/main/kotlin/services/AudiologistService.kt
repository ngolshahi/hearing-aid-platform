// service/AudiologistService.kt
package services

import repository.AudiologistRepository
import model.Audiologist

class AudiologistService(private val audiologistRepository: AudiologistRepository = AudiologistRepository()) {
    
    fun getAudiologistById(id: String): Audiologist? {
        return audiologistRepository.getAudiologistById(id)
    }
    
    fun getAllAudiologists(): List<Audiologist> {
        return audiologistRepository.getAllAudiologists()
    }

    fun updateAudiologist(audiologist: Audiologist): Audiologist? {
        return audiologistRepository.updateAudiologist(audiologist)
    }

    fun authenticateAudiologist(username: String, password: String): Audiologist? {
        return audiologistRepository.authenticateAudiologist(username, password)
    }


}