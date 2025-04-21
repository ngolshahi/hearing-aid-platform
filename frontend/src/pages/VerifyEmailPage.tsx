import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import '../styles/LoginPage.css';

const VerifyEmailPage: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyUserEmail = async () => {
      // Get email and token from URL query parameters
      const queryParams = new URLSearchParams(location.search);
      const email = queryParams.get('email');
      const token = queryParams.get('token');

      if (!email || !token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Missing email or token.');
        return;
      }

      try {
        const result = await verifyEmail(email, token);
        if (result.success) {
          setVerificationStatus('success');
          setMessage(result.message);
        } else {
          setVerificationStatus('error');
          setMessage(result.message);
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyUserEmail();
  }, [location.search]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1>Email Verification</h1>
            <p>
              {verificationStatus === 'verifying' 
                ? 'Please wait while we verify your email' 
                : verificationStatus === 'success'
                  ? 'Your email has been verified!'
                  : 'Verification Failed'}
            </p>
          </div>
            
          <div className="verification-content">
            <div className="verification-icon">
              {verificationStatus === 'verifying' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4a90e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              )}
              {verificationStatus === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )}
              {verificationStatus === 'error' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
            </div>
              
            <p className="verification-message">
              {message}
            </p>
              
            <div className="verification-actions">
              {verificationStatus !== 'verifying' && (
                <button
                  onClick={() => navigate('/login')}
                  className={verificationStatus === 'success' ? 'submit-button' : 'secondary-button'}
                >
                  {verificationStatus === 'success' ? 'Proceed to Login' : 'Back to Login'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 