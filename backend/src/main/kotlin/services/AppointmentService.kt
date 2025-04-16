package services

import com.azure.cosmos.CosmosClient
import com.azure.cosmos.CosmosClientBuilder
import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.CosmosQueryRequestOptions
import com.azure.cosmos.models.PartitionKey
import com.fasterxml.jackson.databind.ObjectMapper
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.*
import repository.AppointmentRepository
import io.ktor.http.HttpStatusCode
import model.AppointmentRequest
import model.AppointmentResponse
import model.Appointment
import model.Audiologist
import model.AppointmentType

class AppointmentService(private val appointmentRepository: AppointmentRepository = AppointmentRepository()) {
    
    fun getAvailableTimeSlots(date: String, appointmentTypeId: String): List<String> {
        return appointmentRepository.getAvailableTimeSlots(date, appointmentTypeId)
    }
    
    fun bookAppointment(appointmentRequest: AppointmentRequest): AppointmentResponse {
        return appointmentRepository.bookAppointment(appointmentRequest)
    }
    
    fun getUserAppointments(userId: String): List<Appointment> {
        return appointmentRepository.getUserAppointments(userId)
    }
    
    fun getAudiologistAppointments(audiologistId: String): List<Appointment> {
        return appointmentRepository.getAudiologistAppointments(audiologistId)
    }
    
    fun findAvailableAudiologist(date: String, time: String, appointmentTypeId: String): Audiologist? {
        return appointmentRepository.findAvailableAudiologist(date, time, appointmentTypeId)
    }
}