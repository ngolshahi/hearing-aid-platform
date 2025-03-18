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

class AppointmentService(private val appointmentRepository: AppointmentRepository = AppointmentRepository()) {
    
    fun getAvailableTimeSlots(date: String, appointmentTypeId: String): List<String> {
        return appointmentRepository.getAvailableTimeSlots(date, appointmentTypeId)
    }
    
    fun bookAppointment(appointmentRequest: AppointmentRequest): AppointmentResponse {
        return appointmentRepository.bookAppointment(appointmentRequest)
    }
}