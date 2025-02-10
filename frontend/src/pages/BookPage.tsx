import React, { useState, useEffect } from 'react';
import '../styles/BookPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Quiz from './Quiz';

interface Audiologist {
  id: number;
  name: string;
  image: string;
  description: string;
  qualifications: string;
  email: string;
  phone: string;
}

interface LocationState {
  selectedService?: string;
}

const BookPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedService } = (location.state as LocationState) || {};
  const [step, setStep] = useState(1);
  const [appointmentType, setAppointmentType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
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

  // Mock audiologist data
  const audiologist: Audiologist = {
    id: 1,
    name: 'Dr. Sarah Thompson',
    image: '/images/audiologist.png',
    description: 'Dr. Thompson has over 15 years of experience in audiology, specializing in hearing aid fitting and rehabilitation.',
    qualifications: 'BSc Audiology, PhD Hearing Sciences',
    email: 'sarah.thompson@auralise.com',
    phone: '07700 900123',
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const day = date.getDay();
    
    // Check if it's a weekday (1-5, Monday-Friday)
    if (day === 0 || day === 6) {
      alert('Please select a weekday (Monday-Friday)');
      return;
    }
    
    setSelectedDate(e.target.value);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log({
      appointmentType,
      selectedDate,
      selectedTime,
      notes,
      ...formData
    });
  };

  const handleQuizComplete = (results: any) => {
    setShowQuiz(false);
    if (results.appointmentType) {
      // Find the matching appointment type and set it
      const appointmentMatch = appointmentTypes.find(apt => apt.id === results.appointmentType);
      if (appointmentMatch) {
        setAppointmentType(appointmentMatch.type);
      }
    }
  };

  useEffect(() => {
    if (selectedService) {
      // Find the appointment type that matches the selected service ID
      const selectedAppointment = appointmentTypes.find(apt => apt.id === selectedService);
      if (selectedAppointment) {
        setAppointmentType(selectedAppointment.type);
      }
    }
  }, [selectedService]);

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
                    onClick={() => setAppointmentType(apt.type)}
                  >
                    <span className="appointment-icon">{apt.icon}</span>
                    <h3>{apt.type}</h3>
                    <p>Duration: {apt.duration}</p>
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

                <div className="form-group">
                  <label htmlFor="time">Preferred Time</label>
                  <select
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Select a time</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
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
                onClick={() => setStep(2)}
                disabled={!appointmentType || !selectedDate || !selectedTime}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 2: Audiologist Details */}
          {step === 2 && (
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
              <div className="button-group">
                <button type="button" className="back-button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="next-button" onClick={() => setStep(3)}>
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
                <button type="submit" className="submit-button">
                  Book Appointment
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
