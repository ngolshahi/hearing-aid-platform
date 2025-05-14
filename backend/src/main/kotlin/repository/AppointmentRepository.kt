package repository

import com.azure.cosmos.CosmosContainer
import com.azure.cosmos.models.CosmosQueryRequestOptions
import com.azure.cosmos.models.PartitionKey
import config.DatabaseConfig
import model.Appointment
import model.UserDetails
import model.Audiologist
import model.WorkHours
import model.AppointmentType
import model.AppointmentRequest
import model.AppointmentResponse
import io.ktor.http.HttpStatusCode
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import repository.AudiologistRepository

class AppointmentRepository {
    private val appointmentsContainer: CosmosContainer = DatabaseConfig.getAppointmentsContainer()
    private val appointmentTypesContainer: CosmosContainer = DatabaseConfig.getAppointmentTypesContainer()
    val audiologistRepository = AudiologistRepository()
    
    /**
     * Get available time slots for a specific date and appointment type
     */
    fun getAvailableTimeSlots(date: String, appointmentTypeId: String): List<String> {
        try {
            val appointmentType = getAppointmentTypeById(appointmentTypeId)
            val audiologists = audiologistRepository.getAllAudiologists()
            val bookedAppointments = getBookedAppointmentsForDate(date)
            
            val availableSlots = mutableListOf<String>()
            val dateObj = LocalDate.parse(date)
            val dayOfWeek = dateObj.dayOfWeek.name.lowercase()
            
            // For each audiologist, find their available slots
            for (audiologist in audiologists) {
                val workSchedule = audiologist.workSchedule[dayOfWeek] ?: continue
                
                // Parse work hours
                val startTime = LocalTime.parse(workSchedule.start)
                val endTime = LocalTime.parse(workSchedule.end)
                
                // Generate all possible slots based on appointment duration
                var currentTime = startTime
                while (currentTime.plusMinutes(appointmentType.duration.toLong()).isBefore(endTime) || 
                    currentTime.plusMinutes(appointmentType.duration.toLong()).equals(endTime)) {
                    
                    val slotEndTime = currentTime.plusMinutes(appointmentType.duration.toLong())
                    val slotStart = currentTime.format(DateTimeFormatter.ofPattern("HH:mm"))
                    
                    // Check if slot is already booked
                    val isSlotBooked = bookedAppointments.any { appointment ->
                        val appointmentStart = LocalTime.parse(appointment.startTime)
                        val appointmentEnd = LocalTime.parse(appointment.endTime)
                        
                        // Check if there's an overlap
                        (currentTime.isBefore(appointmentEnd) || currentTime.equals(appointmentEnd)) && 
                        (slotEndTime.isAfter(appointmentStart) || slotEndTime.equals(appointmentStart))
                    }
                    
                    if (!isSlotBooked) {
                        availableSlots.add(slotStart)
                    }
                    
                    // Move to next 30-minute increment
                    currentTime = currentTime.plusMinutes(30)
                }
            }
            
            return availableSlots.distinct().sorted()
        } catch (e: Exception) {
            println("Error finding available slots: ${e.message}")
            e.printStackTrace()
            return emptyList()
        }
    }
    
    /**
     * Book an appointment
     */
    fun bookAppointment(appointmentRequest: AppointmentRequest): AppointmentResponse {
        try {
            // Get appointment type to determine duration
            val appointmentType = getAppointmentTypeById(appointmentRequest.appointmentTypeId)
            
            // Find an available audiologist
            val audiologist = findAvailableAudiologist(
                appointmentRequest.date,
                appointmentRequest.time,
                appointmentRequest.appointmentTypeId
            )
            
            if (audiologist == null) {
                return AppointmentResponse(
                    success = false,
                    message = "No audiologist available for the selected time slot"
                )
            }
            
            // Calculate end time
            val startTime = LocalTime.parse(appointmentRequest.time)
            val endTime = startTime.plusMinutes(appointmentType.duration.toLong())
            
            // Create appointment object
            val appointmentId = UUID.randomUUID().toString()
            val appointment = Appointment(
                id = appointmentId,
                audiologistId = audiologist.id,
                appointmentType = appointmentType.type,
                date = appointmentRequest.date,
                startTime = appointmentRequest.time,
                endTime = endTime.format(DateTimeFormatter.ofPattern("HH:mm")),
                status = "booked",
                userId = appointmentRequest.userId,
                notes = appointmentRequest.notes,
                userDetails = appointmentRequest.userDetails
            )
            
            // Save to Cosmos DB
            appointmentsContainer.createItem(appointment)
            
            return AppointmentResponse(
                success = true,
                appointmentId = appointmentId,
                message = "Appointment booked successfully"
            )
        } catch (e: Exception) {
            println("Error booking appointment: ${e.message}")
            e.printStackTrace()
            return AppointmentResponse(
                success = false,
                message = "Failed to book appointment: ${e.message}"
            )
        }
    }
    
    /**
     * Get a specific appointment type
     */
    private fun getAppointmentTypeById(id: String): AppointmentType {
        val response = appointmentTypesContainer.readItem(
            id, PartitionKey(id), AppointmentType::class.java
        )
        return response.item
    }
    
    /**
     * Get all booked appointments for a specific date
     */
    private fun getBookedAppointmentsForDate(date: String): List<Appointment> {
        val query = "SELECT * FROM c WHERE c.date = '$date' AND c.status = 'booked'"
        val queryOptions = CosmosQueryRequestOptions()
        
        val appointments = mutableListOf<Appointment>()
        val queryIterable = appointmentsContainer.queryItems(query, queryOptions, Appointment::class.java)
        
        queryIterable.forEach { appointments.add(it) }
        return appointments
    }
    
    /**
     * Find an available audiologist for a specific appointment request
     */
    fun findAvailableAudiologist(date: String, time: String, appointmentTypeId: String): Audiologist? {
        try {
            println("Finding available audiologist for date: $date, time: $time, appointmentTypeId: $appointmentTypeId")
            
            // Get appointment type to determine duration
            val appointmentType = getAppointmentTypeById(appointmentTypeId)
            
            // Get all audiologists
            val audiologists = audiologistRepository.getAllAudiologists()
            println("Found ${audiologists.size} audiologists")
            
            // Get all booked appointments for the date
            val bookedAppointments = getBookedAppointmentsForDate(date)
            
            // Calculate the end time based on appointment duration
            val requestStartTime = LocalTime.parse(time)
            val requestEndTime = requestStartTime.plusMinutes(appointmentType.duration.toLong())
            val dateObj = LocalDate.parse(date)
            val dayOfWeek = dateObj.dayOfWeek.name.lowercase()
            
            // Find an available audiologist
            for (audiologist in audiologists) {
                println("Checking audiologist: ${audiologist.name}")
                
                // Check if audiologist works on this day
                val workSchedule = audiologist.workSchedule[dayOfWeek]
                if (workSchedule == null) {
                    println("Audiologist ${audiologist.name} doesn't work on $dayOfWeek")
                    continue
                }
                
                // Check if requested time is within working hours
                val workStart = LocalTime.parse(workSchedule.start)
                val workEnd = LocalTime.parse(workSchedule.end)
                
                if (requestStartTime.isBefore(workStart) || requestEndTime.isAfter(workEnd)) {
                    println("Requested time is outside ${audiologist.name}'s working hours")
                    continue
                }
                
                // Check if audiologist has any conflicting appointments
                val hasConflict = bookedAppointments.any { appointment ->
                    if (appointment.audiologistId != audiologist.id) {
                        return@any false
                    }
                    
                    val appointmentStart = LocalTime.parse(appointment.startTime)
                    val appointmentEnd = LocalTime.parse(appointment.endTime)
                    
                    // Check for overlap
                    val overlaps = (requestStartTime.isBefore(appointmentEnd) && 
                                   requestEndTime.isAfter(appointmentStart))
                    
                    if (overlaps) {
                        println("Found conflicting appointment for ${audiologist.name} at $appointmentStart-$appointmentEnd")
                    }
                    
                    overlaps
                }
                
                if (!hasConflict) {
                    println("Found available audiologist: ${audiologist.name}")
                    return audiologist
                }
            }
            
            println("No available audiologist found")
            return null
        } catch (e: Exception) {
            println("Error finding available audiologist: ${e.message}")
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Get all appointments for a specific user
     */
    fun getUserAppointments(userId: String): List<Appointment> {
        try {
            println("Fetching appointments for user ID: $userId")
            
            // Properly escape the userId for use in the query
            val sanitizedUserId = userId.replace("'", "''")
            val query = "SELECT * FROM c WHERE c.userId = '$sanitizedUserId'"
            val queryOptions = CosmosQueryRequestOptions()
            
            println("Executing query: $query")
            
            val appointments = mutableListOf<Appointment>()
            val queryIterable = appointmentsContainer.queryItems(query, queryOptions, Appointment::class.java)
            
            queryIterable.forEach { appointments.add(it) }
            println("Found ${appointments.size} appointments for user $userId")
            
            return appointments
        } catch (e: Exception) {
            println("Error fetching appointments for user $userId: ${e.message}")
            e.printStackTrace()
            return emptyList()
        }
    }
    
    /**
     * Get all appointments for a specific audiologist
     */
    fun getAudiologistAppointments(audiologistId: String): List<Appointment> {
        try {
            println("Fetching appointments for audiologist ID: $audiologistId")
            
            // Properly escape the audiologistId for use in the query
            val sanitizedAudiologistId = audiologistId.replace("'", "''")
            val query = "SELECT * FROM c WHERE c.audiologistId = '$sanitizedAudiologistId'"
            val queryOptions = CosmosQueryRequestOptions()
            
            println("Executing query: $query")
            
            val appointments = mutableListOf<Appointment>()
            val queryIterable = appointmentsContainer.queryItems(query, queryOptions, Appointment::class.java)
            
            queryIterable.forEach { appointments.add(it) }
            println("Found ${appointments.size} appointments for audiologist $audiologistId")
            
            return appointments
        } catch (e: Exception) {
            println("Error fetching appointments for audiologist $audiologistId: ${e.message}")
            e.printStackTrace()
            return emptyList()
        }
    }
    
    /**
     * Cancel an appointment
     */
    fun cancelAppointment(appointmentId: String): AppointmentResponse {
        try {
            println("Attempting to cancel appointment $appointmentId")
            
            // Retrieve the appointment
            val response = appointmentsContainer.readItem(
                appointmentId, PartitionKey(appointmentId), Appointment::class.java
            )
            
            val appointment = response.item
            
            // Update the status to 'cancelled'
            val updatedAppointment = appointment.copy(
                status = "cancelled"
            )
            
            // Save back to Cosmos DB
            appointmentsContainer.replaceItem(updatedAppointment, appointmentId, PartitionKey(appointmentId), null)
            
            println("Appointment $appointmentId cancelled successfully")
            
            return AppointmentResponse(
                success = true,
                appointmentId = appointmentId,
                message = "Appointment cancelled successfully"
            )
        } catch (e: Exception) {
            println("Error cancelling appointment $appointmentId: ${e.message}")
            e.printStackTrace()
            return AppointmentResponse(
                success = false,
                message = "Failed to cancel appointment: ${e.message}"
            )
        }
    }
}