import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';
import HearingAidViewer from '../components/HearingAidModel';
import BusinessReviews from '../components/BusinessReviews';
import { useNavigate } from 'react-router-dom';
import OscillatingWave from '../components/OscillatingWave';

const HomePage: React.FC = () => {
  const [hearingAidColor, setHearingAidColor] = useState('#2c5282');
  const [activeSection, setActiveSection] = useState('');
  const navigate = useNavigate();

  // Check which section is visible during scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentSection = '';
      
      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop - 100;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id') || '';
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  

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
      image: '/images/ric-hearing-aid.png',
      category: 'ric'
    },
    {
      type: 'ITC (In-the-Canal)',
      description: 'Custom-made to fit in your ear canal',
      price: 'From £1,199',
      image: '/images/itc-hearing-aid.png',
      category: 'itc'
    },
    {
      type: 'IIC (Invisible-in-Canal)',
      description: 'Nearly invisible when worn',
      price: 'From £1,499',
      image: '/images/iic-hearing-aid.png',
      category: 'iic'
    },
    {
      type: 'BTE (Behind-the-Ear)',
      description: 'Powerful and easy to handle',
      price: 'From £899',
      image: '/images/bte-hearing-aid.png',
      category: 'bte'
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
      id: 'microsuction'
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

  const handleLearnMore = (category: string) => {
    console.log('Navigating to shop with selected type:', category);
    navigate('/shop', { state: { selectedType: category } });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="blur-circle blue-circle"></div>
        <div className="blur-circle purple-circle"></div>

        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span>✨ Premium Hearing Solutions</span>
            </div>
            <h1>Rediscover the Sounds of Life</h1>
            <p>
              Experience the latest in hearing technology with personalized care
              from our expert audiologists. Get back to enjoying the
              conversations and moments that matter most.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => navigate("/book")}
              >
                Book Consultation
              </button>
              <button
                className="outlined-light-button"
                onClick={() => navigate("/hearing-test")}
              >
                Free Hearing Test
              </button>
            </div>
          </div>

          <div className="hero-model floating">
            <div className="model-container">
              <HearingAidViewer color={hearingAidColor} />
              <div className="color-picker">
                <p>Customize your device color:</p>
                <div className="color-options">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      className={`color-button ${
                        hearingAidColor === color.value ? "active" : ""
                      }`}
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
          </div>
        </div>
      </section>

      {/* Hearing Test Section */}
      <section id="hearing-test" className="hearing-test-section">
        <div className="oscillating-wave-background">
          <OscillatingWave
            color="#3b82f6"
            secondaryColor="#2c5282"
            opacity={0.15}
            waveCount={4}
            amplitude={25}
            speed={0.015}
            gradientToWhite={true}
            variant="section"
          />
        </div>
        <div className="hearing-test-container">
          <div className="hearing-test-content">
            <h2>Take Our Free Online Hearing Assessment</h2>
            <p className="subtitle">
              Complete our quick 5-minute hearing check to get an initial
              assessment of your hearing health from the comfort of your home.
            </p>

            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">Quick 5-minute test</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎧</div>
                <div className="feature-text">Works best with headphones</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📱</div>
                <div className="feature-text">Compatible with all devices</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">Private and secure</div>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={() => navigate("/hearing-test")}
            >
              Start Free Hearing Check
            </button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="products-section">
        <div className="section-header">
          <h2>Discover Our Premium Hearing Solutions</h2>
          <p>
            Explore our range of state-of-the-art hearing aids designed to suit
            your lifestyle and hearing needs
          </p>
        </div>

        <div className="products-grid">
          {hearingAids.map((aid, index) => (
            <div key={index} className="product-card">
              <div className="product-image">
                <img src={aid.image} alt={aid.type} />
              </div>
              <div className="product-content">
                <h3>{aid.type}</h3>
                <p>{aid.description}</p>
                <div className="product-price">{aid.price}</div>
                <button
                  className="secondary-button"
                  onClick={() => handleLearnMore(aid.category)}
                >
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="section-header">
          <h2>Our Expert Services</h2>
          <p>
            We provide comprehensive hearing care services to ensure you receive
            the best possible treatment
          </p>
        </div>

        <div className="services-grid">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="service-card">
              <div className="service-icon">{appointment.icon}</div>
              <div className="service-content">
                <h3>{appointment.type}</h3>
                <p>{appointment.description}</p>
                <div className="service-duration">
                  <span>⏱️</span> {appointment.duration}
                </div>
                <button
                  className="secondary-button"
                  onClick={() => handleBookNow(appointment.id)}
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews">
        <BusinessReviews />
      </section>
    </div>
  );
};

export default HomePage;