import React, { useState, useEffect } from 'react';
import '../styles/BookPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Quiz from './Quiz';
import { getCurrentUser } from '../services/authService';
import { 
  getAvailableTimeSlots, 
  bookAppointment, 
  AppointmentRequest,
  AppointmentResponse,
  getAvailableAudiologist
} from '../services/appointmentService';
import {Audiologist,getAudiologistById} from '../services/audiologistService';

interface LocationState {
  selectedService?: string;
}

const BookPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedService } = (location.state as LocationState) || {};
  
  const [step, setStep] = useState(1);
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    addressNumber: '',
    street: '',
    city: '',
    county: '',
    postcode: '',
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [audiologist, setAudiologist] = useState<Audiologist | null>(null);
  const [bookingStatus, setBookingStatus] = useState<{success: boolean; message: string} | null>(null);

  const appointmentTypes = [
    {
      type: 'Hearing Aid Consultation',
      duration: '60 minutes',
      icon: '👂',
      id: 'consultation'
    },
    {
      type: 'Microsuction (Wax Removal)',
      duration: '30 minutes',
      icon: '🔍',
      id: 'wax-removal'
    },
    {
      type: 'Aftercare/Repair',
      duration: '45 minutes',
      icon: '🔧',
      id: 'aftercare'
    },
    {
      type: 'Fitting',
      duration: '60 minutes',
      icon: '✨',
      id: 'fitting'
    },
  ];

  // Fetch available time slots when date and appointment type are selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedDate && appointmentTypeId) {
        setIsLoading(true);
        setErrorMessage('');
        try {
          const slots = await getAvailableTimeSlots(selectedDate, appointmentTypeId);
          setAvailableTimeSlots(slots);
          if (slots.length === 0) {
            setErrorMessage('No available time slots for the selected date.');
          }
        } catch (error) {
          setErrorMessage('Failed to fetch available time slots. Please try again.');
          console.error('Error fetching time slots:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchTimeSlots();
  }, [selectedDate, appointmentTypeId]);

  // Set appointment type based on selected service from previous page
  useEffect(() => {
    if (selectedService) {
      const selectedAppointment = appointmentTypes.find(apt => apt.id === selectedService);
      if (selectedAppointment) {
        setAppointmentType(selectedAppointment.type);
        setAppointmentTypeId(selectedAppointment.id);
      }
    }
  }, [selectedService]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const day = date.getDay();
    
    // Check if it's a weekday (1-5, Monday-Friday)
    if (day === 0 || day === 6) {
      alert('Please select a weekday (Monday-Friday)');
      return;
    }
    
    setSelectedDate(e.target.value);
    // Reset selected time when date changes
    setSelectedTime('');
    // Reset error message when date changes
    setErrorMessage('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppointmentTypeSelect = (type: string, id: string) => {
    setAppointmentType(type);
    setAppointmentTypeId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const currentUser = getCurrentUser();
      
      const appointmentRequest: AppointmentRequest = {
        appointmentTypeId,
        date: selectedDate,
        time: selectedTime,
        userId: currentUser?.id || undefined,
        notes,
        userDetails: {
          firstName: formData.firstName,
          surname: formData.surname,
          addressNumber: formData.addressNumber,
          street: formData.street,
          city: formData.city,
          county: formData.county,
          postcode: formData.postcode
        }
      };
      
      const response = await bookAppointment(appointmentRequest);
      setBookingStatus({
        success: response.success,
        message: response.message
      });
      
      if (response.success) {
        // Reset form and redirect to confirmation page or show success message
        setTimeout(() => {
          navigate('/booking-confirmation', { 
            state: { 
              appointmentId: response.appointmentId,
              appointmentType,
              date: selectedDate,
              time: selectedTime,
              audiologist
            } 
          });
        }, 2000);
      }
    } catch (error) {
      setErrorMessage('Failed to book appointment. Please try again later.');
      console.error('Error booking appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (results: any) => {
    setShowQuiz(false);
    if (results.appointmentType) {
      const appointmentMatch = appointmentTypes.find(apt => apt.id === results.appointmentType);
      if (appointmentMatch) {
        setAppointmentType(appointmentMatch.type);
        setAppointmentTypeId(appointmentMatch.id);
      }
    }
  };

  // Move to next step - fetch audiologist when moving to step 2
  const handleNextStep = async (nextStep: number) => {
    if (nextStep === 2) {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Fetch an available audiologist for the selected date, time, and appointment type
        const fetchedAudiologist = await getAvailableAudiologist(
          selectedDate, 
          selectedTime, 
          appointmentTypeId
        );
        
        if (fetchedAudiologist) {
          setAudiologist(fetchedAudiologist);
          setStep(nextStep);
        } else {
          setErrorMessage('No audiologist is available for the selected time slot. Please select another time.');
        }
      } catch (error) {
        console.error('Error fetching available audiologist:', error);
        setErrorMessage('Failed to find an available audiologist. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep(nextStep);
    }
  };

  // Add a refresh function to re-fetch available slots
  const refreshAvailableSlots = async () => {
    if (selectedDate && appointmentTypeId) {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const slots = await getAvailableTimeSlots(selectedDate, appointmentTypeId);
        setAvailableTimeSlots(slots);
        if (slots.length === 0) {
          setErrorMessage('No available time slots for the selected date. Please try another date.');
        }
      } catch (error) {
        setErrorMessage('Failed to fetch available time slots. Please try again.');
        console.error('Error fetching time slots:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="book-page">
      <div className="booking-container">
        <h1>Book Your Appointment</h1>
        
        {/* Progress indicator */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {bookingStatus && (
          <div className={`booking-status ${bookingStatus.success ? 'success' : 'error'}`}>
            {bookingStatus.message}
          </div>
        )}

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {isLoading && <div className="loading-spinner">Loading...</div>}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Appointment Details */}
          {step === 1 && (
            <div className="booking-step">
              <h2>Select Appointment Type</h2>
              <div className="appointment-types">
                {appointmentTypes.map((apt) => (
                  <div
                    key={apt.type}
                    className={`appointment-type ${appointmentType === apt.type ? 'selected' : ''}`}
                    onClick={() => handleAppointmentTypeSelect(apt.type, apt.id)}
                  >
                    <span className="appointment-icon">{apt.icon}</span>
                    <div className="appointment-type-content">
                      <h3>{apt.type}</h3>
                      <p>Duration: {apt.duration}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Quiz Option */}
              <div className="quiz-option">
                <p>Not sure what type of appointment you need?</p>
                <button
                  type="button"
                  className="quiz-button"
                  onClick={() => setShowQuiz(true)}
                >
                  <span className="quiz-icon">❓</span>
                  Take our quick quiz
                </button>
              </div>

              <div className="date-time-selection">
                <div className="form-group">
                  <label htmlFor="date">Preferred Date</label>
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group time-slot-group">
                  <div className="time-slot-header">
                    <label htmlFor="time">Preferred Time</label>
                    {selectedDate && (
                      <button 
                        type="button" 
                        className="refresh-slots-button"
                        onClick={refreshAvailableSlots}
                        disabled={isLoading || !selectedDate}
                      >
                        {isLoading ? 'Loading...' : 'Refresh Slots'}
                      </button>
                    )}
                  </div>
                  
                  <select
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    disabled={availableTimeSlots.length === 0 || !selectedDate || isLoading}
                  >
                    <option value="">Select a time</option>
                    {availableTimeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  
                  {selectedDate && availableTimeSlots.length === 0 && !isLoading && (
                    <div className="no-slots-message">
                      <p>No available slots for this date. Please try another date or check back later.</p>
                    </div>
                  )}
                  
                  {!selectedDate && (
                    <p className="helper-text">Please select a date first</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific requirements or concerns..."
                  />
                </div>
              </div>

              <button 
                type="button" 
                className="next-button"
                onClick={() => handleNextStep(2)}
                disabled={!appointmentType || !selectedDate || !selectedTime || isLoading}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 2: Audiologist Details */}
          {step === 2 && audiologist && (
            <div className="booking-step">
              <h2>Your Audiologist</h2>
              <div className="audiologist-card">
                <img src={audiologist.image} alt={audiologist.name} className="audiologist-image" />
                <div className="audiologist-info">
                  <h3>{audiologist.name}</h3>
                  <p className="qualifications">{audiologist.qualifications}</p>
                  <p className="description">{audiologist.description}</p>
                  <div className="contact-details">
                    <p><i className="fas fa-envelope"></i> {audiologist.email}</p>
                    <p><i className="fas fa-phone"></i> {audiologist.phone}</p>
                  </div>
                </div>
              </div>
              <div className="appointment-summary">
                <h3>Appointment Summary</h3>
                <p><strong>Type:</strong> {appointmentType}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
              </div>
              <div className="button-group">
                <button type="button" className="back-button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="next-button" onClick={() => handleNextStep(3)}>
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Personal Details */}
          {step === 3 && (
            <div className="booking-step">
              <h2>Your Details</h2>
              <div className="personal-details">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="surname">Surname</label>
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="addressNumber">House Number/Name</label>
                  <input
                    type="text"
                    id="addressNumber"
                    name="addressNumber"
                    value={formData.addressNumber}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="street">Street</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="county">County</label>
                  <input
                    type="text"
                    id="county"
                    name="county"
                    value={formData.county}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postcode">Postcode</label>
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="button-group">
                <button type="button" className="back-button" onClick={() => setStep(2)}>
                  Back
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      
      {showQuiz && (
        <Quiz
          type="appointment"
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default BookPage;