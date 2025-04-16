import React, { useState, useEffect } from 'react';
import { 
  updateUserProfile, 
  updateAudiologistProfile, 
  getCurrentUser, 
  Audiologist,
  User,
  logout,
  WorkHours
} from '../services/authService';
import { 
  getUserAppointments, 
  getAudiologistAppointments, 
  Appointment 
} from '../services/appointmentService';
import '../styles/ProfilePage.css';

// Days of the week for work schedule
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ProfilePage: React.FC = () => {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('personal');
  
  // State for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    description: (currentUser as Audiologist)?.description || '',
    qualifications: (currentUser as Audiologist)?.qualifications || '',
    image: (currentUser as Audiologist)?.image || currentUser?.image || '',
    workSchedule: (currentUser as Audiologist)?.workSchedule || {},
    password: currentUser?.password || '',
  });
  
  // State for file upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    currentUser?.image || (currentUser as Audiologist)?.image || null
  );
  
  // State for delete account confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // State for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [fetchedAppointments, setFetchedAppointments] = useState(false);

  // Determine if the current user is an audiologist
  const isAudiologist = currentUser && 'qualifications' in currentUser;

  // Fetch user appointments
  useEffect(() => {
    if (currentUser && activeTab === 'appointments' && !fetchedAppointments && !isLoadingAppointments) {
      fetchAppointments();
    }
  }, [currentUser, activeTab, fetchedAppointments, isLoadingAppointments]);

  const fetchAppointments = async () => {
    if (!currentUser) return;
    
    setIsLoadingAppointments(true);
    try {
      let userAppointments: Appointment[] = [];
      
      if (isAudiologist) {
        // Fetch appointments where audiologistId matches the current user's ID
        console.log(`Fetching appointments for audiologist ID: ${currentUser.id}`);
        userAppointments = await getAudiologistAppointments(currentUser.id);
      } else {
        // Fetch appointments where userId matches the current user's ID
        console.log(`Fetching appointments for user ID: ${currentUser.id}`);
        userAppointments = await getUserAppointments(currentUser.id);
      }
      
      setAppointments(userAppointments);
      setFetchedAppointments(true);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Format work schedule for display
  const formatWorkSchedule = (schedule: Record<string, WorkHours>): string => {
    if (!schedule || Object.keys(schedule).length === 0) {
      return 'No schedule set';
    }

    return DAYS_OF_WEEK
      .filter(day => schedule[day])
      .map(day => {
        const { start, end } = schedule[day];
        return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${start} - ${end}`;
      })
      .join('\n');
  };

  // Update work schedule hours for a specific day
  const handleWorkScheduleChange = (day: string, field: 'start' | 'end', value: string) => {
    setEditedProfile(prev => {
      const newWorkSchedule = { ...prev.workSchedule };
      
      if (!newWorkSchedule[day]) {
        newWorkSchedule[day] = { start: '09:00', end: '17:00' };
      }
      
      newWorkSchedule[day] = {
        ...newWorkSchedule[day],
        [field]: value
      };
      
      return {
        ...prev,
        workSchedule: newWorkSchedule
      };
    });
  };

  // Toggle if a day is included in the work schedule
  const toggleWorkDay = (day: string, isActive: boolean) => {
    setEditedProfile(prev => {
      const newWorkSchedule = { ...prev.workSchedule };
      
      if (isActive) {
        if (!newWorkSchedule[day]) {
          newWorkSchedule[day] = { start: '09:00', end: '17:00' };
        }
      } else {
        delete newWorkSchedule[day];
      }
      
      return {
        ...prev,
        workSchedule: newWorkSchedule
      };
    });
  };

  const handleEditProfile = async () => {
    if (isEditing) {
      try {
        let updated;
        let imageUrl = editedProfile.image;
        
        // Handle image upload if a new image was selected
        if (selectedImage) {
          // In a real app, you would upload the image to your server or a service like AWS S3
          // and get back a URL to store in the user profile
          // For this example, we'll simulate it with a local data URL
          imageUrl = imagePreview as string;
          console.log('Image would be uploaded to server and URL stored');
        }
        
        // Different update logic for audiologists and regular users
        if (isAudiologist) {       
          console.log('Trying to update user ' + currentUser.id)   
          let updatedUser : Audiologist = {
            id: currentUser.id,
            name: editedProfile.name,
            phone: editedProfile.phone,
            email: editedProfile.email,
            description: editedProfile.description,
            qualifications: editedProfile.qualifications,
            image: imageUrl,
            workSchedule: editedProfile.workSchedule,
            password: editedProfile.password,
          }
          updated = await updateAudiologistProfile(updatedUser);
        } else {
          if (currentUser) {
            let updatedUser : User = {
              id: currentUser.id,
              email: editedProfile.email,
              password: editedProfile.password,
              name: editedProfile.name,
              phone: editedProfile.phone,
              image: imageUrl
            }
            updated = await updateUserProfile(updatedUser);
          } else {
            console.log('Not logged in');
            return;
          }
        }

        if (updated) {
          // Update localStorage with new user info
          localStorage.setItem('user', JSON.stringify(updated));
          
          console.log('Setting is editing to false')
          // Exit editing mode
          setIsEditing(false);
        } else {
          console.error('Error updating profile');
          alert('Failed to edit profile')
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to edit profile')
        setIsEditing(false);
      }
    } else {
      // Enter editing mode
      setIsEditing(true);
    }
  };

  const handleDeleteAccount = async () => {
    // Basic validation to prevent accidental deletion
    if (deleteConfirmationText.toLowerCase() !== 'delete my account') {
      alert('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    try {
      // Call backend to delete account (you'll need to implement this endpoint)
      // For now, we'll use logout as a placeholder
      logout();
      
      // Redirect to home or login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  // Format date to more human-readable format
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // Get appointment status class
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
      case 'confirmed':
        return 'confirmed';
      case 'pending':
        return 'pending';
      case 'cancelled':
        return 'cancelled';
      case 'completed':
        return 'completed';
      default:
        return '';
    }
  };

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
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-image-large" />
              ) : currentUser.image ? (
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
              {isAudiologist ? 'My Patients' : 'My Appointments'}
            </button>
          </div>

          <div className="profile-content">
            {activeTab === 'personal' && (
              <div className="personal-info-section">
                <div className="info-card">
                  <h2>Personal Information</h2>
                  
                  {/* Profile Image Upload */}
                  <div className="form-group image-upload-group">
                    <label>Profile Image</label>
                    {isEditing ? (
                      <div className="image-upload-container">
                        <div className="profile-image-preview">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Profile preview" />
                          ) : (
                            <div className="profile-initials">
                              {editedProfile.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="profile-image"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="file-input"
                        />
                        <label htmlFor="profile-image" className="file-input-label">
                          Choose New Image
                        </label>
                      </div>
                    ) : (
                      <div className="profile-image-display">
                        {currentUser.image || (currentUser as Audiologist)?.image ? (
                          <img 
                            src={currentUser.image || (currentUser as Audiologist)?.image || ''} 
                            alt="Profile" 
                            className="profile-image-medium" 
                          />
                        ) : (
                          <div className="profile-no-image">No profile image set</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Full Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editedProfile.name} 
                        onChange={(e) => setEditedProfile(prev => ({...prev, name: e.target.value}))}
                      />
                    ) : (
                    <input type="text" value={currentUser.name} readOnly />
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={currentUser.email} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editedProfile.phone} 
                        onChange={(e) => setEditedProfile(prev => ({...prev, phone: e.target.value}))}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <input type="text" value={currentUser.phone || 'Not provided'} readOnly />
                    )}
                  </div>
                  
                  {/* Audiologist-specific fields */}
                  {isAudiologist && (
                    <>
                      <div className="form-group">
                        <label>Description</label>
                        {isEditing ? (
                          <textarea 
                            value={editedProfile.description} 
                            onChange={(e) => setEditedProfile(prev => ({...prev, description: e.target.value}))}
                            placeholder="Enter your professional description"
                          />
                        ) : (
                          <input 
                            type="text" 
                            value={(currentUser as any).description || 'Not provided'} 
                            readOnly 
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label>Qualifications</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editedProfile.qualifications} 
                            onChange={(e) => setEditedProfile(prev => ({...prev, qualifications: e.target.value}))}
                            placeholder="Enter your qualifications"
                          />
                        ) : (
                          <input 
                            type="text" 
                            value={(currentUser as any).qualifications || 'Not provided'} 
                            readOnly 
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label>Work Schedule</label>
                        {isEditing ? (
                          <div className="work-schedule-editor">
                            <p className="schedule-help-text">Set your working hours for each day:</p>
                            {DAYS_OF_WEEK.map(day => {
                              const isActive = !!editedProfile.workSchedule[day];
                              return (
                                <div key={day} className="schedule-day-row">
                                  <div className="day-checkbox">
                                    <input 
                                      type="checkbox" 
                                      id={`work-${day}`}
                                      checked={isActive}
                                      onChange={(e) => toggleWorkDay(day, e.target.checked)}
                                    />
                                    <label htmlFor={`work-${day}`} className="day-name">
                                      {day.charAt(0).toUpperCase() + day.slice(1)}
                                    </label>
                                  </div>
                                  
                                  {isActive && (
                                    <div className="time-inputs">
                                      <input 
                                        type="time" 
                                        value={editedProfile.workSchedule[day]?.start || '09:00'}
                                        onChange={(e) => handleWorkScheduleChange(day, 'start', e.target.value)}
                                        className="time-input"
                                      />
                                      <span className="time-separator">to</span>
                                      <input 
                                        type="time" 
                                        value={editedProfile.workSchedule[day]?.end || '17:00'}
                                        onChange={(e) => handleWorkScheduleChange(day, 'end', e.target.value)}
                                        className="time-input"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <pre className="work-schedule-display">
                            {formatWorkSchedule((currentUser as Audiologist).workSchedule)}
                          </pre>
                        )}
                      </div>
                    </>
                  )}
                  
                  <button 
                    className="primary-button"
                    onClick={handleEditProfile}
                  >
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>

                <div className="account-actions">
                  <button className="outlined-button" onClick={() => logout()}>Log Out</button>
                  <button 
                    className="danger-button" 
                    onClick={() => setShowDeleteConfirmation(true)}
                  >
                    Delete Account
                  </button>
                </div>

                {/* Delete Account Confirmation Modal */}
                {showDeleteConfirmation && (
                  <div className="delete-confirmation-modal">
                    <div className="modal-content">
                      <h2>Delete Account</h2>
                      <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                      <p>Please type "DELETE MY ACCOUNT" to confirm:</p>
                      <input 
                        type="text" 
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="Type DELETE MY ACCOUNT"
                      />
                      <div className="modal-actions">
                        <button 
                          className="danger-button" 
                          onClick={handleDeleteAccount}
                        >
                          Confirm Delete
                        </button>
                        <button 
                          className="outlined-button" 
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmationText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="appointments-section">
                <div className="section-header">
                  <h2>{isAudiologist ? 'Patient Appointments' : 'My Appointments'}</h2>
                  <button 
                    className="refresh-button" 
                    onClick={() => {
                      setFetchedAppointments(false);
                      // This will trigger the useEffect to fetch appointments again
                    }}
                    disabled={isLoadingAppointments}
                  >
                    {isLoadingAppointments ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {isLoadingAppointments ? (
                  <div className="loading-appointments">Loading appointments...</div>
                ) : !currentUser.id ? (
                  // Handle the case where currentUser doesn't have an ID
                  <div className="appointment-error">
                    <p>Unable to fetch appointments. Your account may not be fully set up.</p>
                    <button className="primary-button" onClick={() => window.location.reload()}>Retry</button>
                  </div>
                ) : appointments.length > 0 ? (
                  appointments.map(appointment => (
                    <div className="appointment-card" key={appointment.id}>
                      <div className="appointment-header">
                        <div className="appointment-type">{appointment.appointmentType}</div>
                        <div className={`appointment-status ${getStatusClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </div>
                      </div>
                      <div className="appointment-details">
                        <div className="appointment-info">
                          <i className="appointment-icon">📅</i>
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="appointment-info">
                          <i className="appointment-icon">🕒</i>
                          <span>{appointment.startTime} - {appointment.endTime}</span>
                        </div>
                        {isAudiologist && (
                          <div className="appointment-info">
                            <i className="appointment-icon">👤</i>
                            <span>
                              {appointment.userDetails ? 
                                `${appointment.userDetails.firstName} ${appointment.userDetails.surname}` : 
                                'Unknown patient'}
                            </span>
                          </div>
                        )}
                        {appointment.notes && (
                          <div className="appointment-info full-width">
                            <i className="appointment-icon">📝</i>
                            <span>{appointment.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="appointment-actions">
                        <button className="secondary-button">
                          {isAudiologist ? 'Edit Appointment' : 'Reschedule'}
                        </button>
                        <button className="outlined-button">
                          {isAudiologist ? 'Mark as Complete' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-appointments">
                    <p>{isAudiologist ? 'No upcoming patient appointments.' : 'No upcoming appointments.'}</p>
                    {!isAudiologist && (
                      <button className="primary-button" onClick={() => window.location.href = '/book'}>
                        Book New Appointment
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;