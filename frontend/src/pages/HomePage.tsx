import React, { useState } from 'react';
import '../styles/HomePage.css';
import HearingAidViewer from '../components/HearingAidModel';
import BusinessReviews from '../components/BusinessReviews';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [hearingAidColor, setHearingAidColor] = useState('#2c5282');
  const navigate = useNavigate();

  const colors = [
    { name: 'Blue', value: '#2c5282' },
    { name: 'Beige', value: '#deb887' },
    { name: 'Silver', value: '#c0c0c0' },
    { name: 'Black', value: '#2d3748' },
    { name: 'Rose Gold', value: '#b76e79' },
  ];

  const hearingAids = [
    {
      type: 'RIC (Receiver-in-Canal)',
      description: 'Discreet and powerful, perfect for most hearing losses',
      price: 'From £999',
      image: '/images/ric-hearing-aid.png'
    },
    {
      type: 'ITC (In-the-Canal)',
      description: 'Custom-made to fit in your ear canal',
      price: 'From £1,199',
      image: '/images/itc-hearing-aid.png'
    },
    {
      type: 'IIC (Invisible-in-Canal)',
      description: 'Nearly invisible when worn',
      price: 'From £1,499',
      image: '/images/iic-hearing-aid.png'
    },
    {
      type: 'BTE (Behind-the-Ear)',
      description: 'Powerful and easy to handle',
      price: 'From £899',
      image: '/images/bte-hearing-aid.png'
    }
  ];

  const appointments = [
    {
      type: 'Hearing Aid Consultation',
      description: 'Expert advice on finding your perfect hearing solution',
      duration: '60 minutes',
      icon: '👂',
      id: 'consultation'
    },
    {
      type: 'Microsuction (Wax Removal)',
      description: 'Safe and comfortable ear wax removal',
      duration: '30 minutes',
      icon: '🔍',
      id: 'wax-removal'
    },
    {
      type: 'Aftercare/Repair',
      description: 'Maintenance and support for your hearing aids',
      duration: '45 minutes',
      icon: '🔧',
      id: 'aftercare'
    },
    {
      type: 'Fitting',
      description: 'Professional fitting and adjustment of your hearing aids',
      duration: '60 minutes',
      icon: '✨',
      id: 'fitting'
    }
  ];

  const handleBookNow = (serviceId: string) => {
    navigate('/book', { state: { selectedService: serviceId } });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Better Hearing, Better Life</h1>
          <p>Experience the latest in hearing technology with personalized care and support</p>
          <div className="model-container">
            <HearingAidViewer color={hearingAidColor} />
            <div className="color-picker">
              <p>Choose your color:</p>
              <div className="color-options">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    className={`color-button ${hearingAidColor === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setHearingAidColor(color.value)}
                    aria-label={`Select ${color.name}`}
                  >
                    <span className="color-name">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className="primary-button">Book Your Consultation</button>
        </div>
      </section>

      {/* Hearing Aids Section */}
      <section className="section hearing-aids">
        <h2>Our Hearing Aid Solutions</h2>
        <div className="cards-grid">
          {hearingAids.map((aid, index) => (
            <div key={index} className="card">
              <div className="card-image">
                <img src={aid.image} alt={aid.type} />
              </div>
              <div className="card-content">
                <h3>{aid.type}</h3>
                <p>{aid.description}</p>
                <p className="price">{aid.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appointments Section */}
      <section className="section appointments">
        <h2>Our Services</h2>
        <div className="cards-grid">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card">
              <div className="card-icon">{appointment.icon}</div>
              <div className="card-content">
                <h3>{appointment.type}</h3>
                <p>{appointment.description}</p>
                <p className="duration">Duration: {appointment.duration}</p>
                <button 
                  className="secondary-button"
                  onClick={() => handleBookNow(appointment.id)}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BusinessReviews />
    </div>
  );
};

export default HomePage;
