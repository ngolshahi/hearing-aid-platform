// service/AudiologistService.kt
package services

import repository.AudiologistRepository
import model.Audiologist
import utils.PasswordUtils

class AudiologistService(private val audiologistRepository: AudiologistRepository = AudiologistRepository()) {
    
    fun getAudiologistById(id: String): Audiologist? {
        return audiologistRepository.getAudiologistById(id)
    }
    
    fun getAllAudiologists(): List<Audiologist> {
        return audiologistRepository.getAllAudiologists()
    }

    fun updateAudiologist(audiologist: Audiologist): Audiologist? {
        // Check if the password has been changed
        val existingAudiologist = audiologistRepository.getAudiologistById(audiologist.id)
        
        if (existingAudiologist != null) {
            // If the password is different from the existing one, hash it
            if (audiologist.password != existingAudiologist.password) {
                val hashedPassword = PasswordUtils.hashPassword(audiologist.password)
                val updatedAudiologist = audiologist.copy(password = hashedPassword)
                return audiologistRepository.updateAudiologist(updatedAudiologist)
            }
        }
        
        return audiologistRepository.updateAudiologist(audiologist)
    }

    fun authenticateAudiologist(username: String, password: String): Audiologist? {
        return audiologistRepository.authenticateAudiologist(username, password)
    }


}