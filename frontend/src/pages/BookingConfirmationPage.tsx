import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import '../styles/BookingConfirmationPage.css';

const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;

  // If no state is provided, redirect to the booking page
  React.useEffect(() => {
    if (!state || !state.appointmentId) {
      navigate('/book');
    }
  }, [state, navigate]);

  if (!state || !state.appointmentId) {
    return null; // Return null while redirecting
  }

  // Format date string to a more readable format
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateStr).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="booking-confirmation-page">
      <div className="booking-confirmation-container">
        <div className="confirmation-header">
          <div className="check-icon">✓</div>
          <h1>Booking Confirmed!</h1>
          <p>Your appointment has been successfully booked.</p>
        </div>

        <div className="confirmation-details">
          <h2>Appointment Details</h2>
          
          <div className="detail-item">
            <span className="detail-label">Appointment ID:</span>
            <span className="detail-value">{state.appointmentId}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{state.appointmentType}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{formatDate(state.date)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Time:</span>
            <span className="detail-value">{state.time}</span>
          </div>
          
          {state.audiologist && (
            <>
              <h3>Audiologist</h3>
              <div className="audiologist-card">
                {state.audiologist.image && (
                  <img 
                    src={state.audiologist.image} 
                    alt={state.audiologist.name} 
                    className="audiologist-image" 
                  />
                )}
                <div className="audiologist-info">
                  <h4>{state.audiologist.name}</h4>
                  {state.audiologist.qualifications && (
                    <p className="qualifications">{state.audiologist.qualifications}</p>
                  )}
                  {state.audiologist.email && (
                    <p className="email">
                      <i className="fas fa-envelope"></i> {state.audiologist.email}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="confirmation-message">
          <p>You will receive an email confirmation with these details shortly.</p>
          <p>If you need to reschedule or cancel, please contact us at least 24 hours before your appointment.</p>
        </div>

        <div className="confirmation-actions">
          <Link to="/profile" className="primary-button">View My Appointments</Link>
          <Link to="/" className="secondary-button">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage; 