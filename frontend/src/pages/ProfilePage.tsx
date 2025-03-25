// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { 
  updateUserProfile, 
  updateAudiologistProfile, 
  getCurrentUser, 
  Audiologist,
  User,
  logout 
} from '../services/authService';
import '../styles/ProfilePage.css';

const ProfilePage: React.FC = () => {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('personal');

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <h1>Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="content-below-navbar">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {currentUser.image ? (
                <img src={currentUser.image} alt="Profile" className="profile-image-large" />
              ) : (
                <div className="profile-initials-large">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1>{currentUser.name}</h1>
              <p className="profile-email">{currentUser.email}</p>
            </div>
          </div>
        </div>

        <div className="profile-container">
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Info
            </button>
            <button 
              className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              My Appointments
            </button>
            <button 
              className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              My Orders
            </button>
          </div>

          <div className="profile-content">
            {activeTab === 'personal' && (
              <div className="personal-info-section">
                <div className="info-card">
                  <h2>Personal Information</h2>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={currentUser.name} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={currentUser.email} readOnly />
                  </div>
                  {currentUser.details && (
                    <>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="text" value={currentUser.phone || 'Not provided'} readOnly />
                      </div>
                      
                    </>
                  )}
                  <button className="primary-button">Edit Profile</button>
                </div>

                <div className="account-actions">
                  <button className="outlined-button" onClick={logout}>Log Out</button>
                  <button className="danger-button">Delete Account</button>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="appointments-section">
                <h2>My Appointments</h2>
                {/* Example appointment, replace with actual data */}
                <div className="appointment-card">
                  <div className="appointment-header">
                    <div className="appointment-type">Hearing Test</div>
                    <div className="appointment-status confirmed">Confirmed</div>
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-info">
                      <i className="appointment-icon">📅</i>
                      <span>Monday, April 5, 2025</span>
                    </div>
                    <div className="appointment-info">
                      <i className="appointment-icon">🕒</i>
                      <span>10:30 AM</span>
                    </div>
                    <div className="appointment-info">
                      <i className="appointment-icon">👩‍⚕️</i>
                      <span>Dr. Emily Johnson</span>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button className="secondary-button">Reschedule</button>
                    <button className="outlined-button">Cancel</button>
                  </div>
                </div>
                <div className="no-appointments">
                  <p>No more upcoming appointments.</p>
                  <button className="primary-button">Book New Appointment</button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="orders-section">
                <h2>My Orders</h2>
                <div className="order-card">
                  <div className="order-header">
                    <div className="order-number">Order #AUR-2025-0342</div>
                    <div className="order-status shipped">Shipped</div>
                  </div>
                  <div className="order-product">
                    <div className="product-image-small">
                      <div className="placeholder-image"></div>
                    </div>
                    <div className="product-details">
                      <h3>Auralise Pro X5</h3>
                      <p>Crystal Blue • Premium Package</p>
                    </div>
                    <div className="product-price">£1,299</div>
                  </div>
                  <div className="order-footer">
                    <div className="order-date">Ordered on March 15, 2025</div>
                    <button className="secondary-button">Track Order</button>
                  </div>
                </div>
                <div className="no-orders">
                  <p>No previous orders found.</p>
                  <button className="primary-button">Browse Shop</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;