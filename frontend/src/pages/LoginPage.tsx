import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/LoginPage.css';
import { isAuthenticated, login, register, resendVerification } from '../services/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  

  // Update isLogin when path changes
  useEffect(() => {

    const checkAuth = async () => {
      try {
        const authStatus = await isAuthenticated();
        if (authStatus) {
          // If authenticated, redirect to profile page
          navigate('/profile');
        }
      } catch (err) {
        console.error('Authentication check failed', err);
      }
    };

    checkAuth();
    
    setIsLogin(location.pathname === '/login');
  }, [location.pathname, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError('');
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage('');
    
    try {
      const result = await resendVerification(verificationEmail);
      if (result.success) {
        setVerificationMessage(result.message);
      } else {
        setVerificationMessage(result.message);
      }
    } catch (err) {
      setVerificationMessage('Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setNeedsVerification(false);

    // Validate password match for registration
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Handle login with verification check
        const loginResult = await login({
          email: formData.email,
          password: formData.password
        });

        if (loginResult.user) {
          navigate('/dashboard');
        } else if (!loginResult.verified && loginResult.message.includes('not verified')) {
          // User exists but email isn't verified
          setNeedsVerification(true);
          setVerificationEmail(formData.email);
          setError('');
        } else {
          setError(loginResult.message || 'Invalid email or password');
        }
      } else {
        // Password validation on client side
        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
          setError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number');
          setIsLoading(false);
          return;
        }
        
        // Name validation on client side
        const nameRegex = /^[A-Za-z\s-]{2,}$/;
        if (!nameRegex.test(formData.firstName || '') || !nameRegex.test(formData.lastName || '')) {
          setError('Names must be at least 2 characters and contain only letters, spaces, and hyphens');
          setIsLoading(false);
          return;
        }

        // Handle registration with improved error handling
        const response = await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
  
        if (response.user) {
          // Registration successful, but user still needs to verify email
          setNeedsVerification(true);
          setVerificationEmail(formData.email);
          setError('');
        } else {
          // Registration failed with specific error message
          setError(response.message);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    });
    setError('');
    setNeedsVerification(false);
    // Update URL when toggling
    navigate(isLogin ? '/signup' : '/login');
  };

  // If user needs to verify email, show verification message
  if (needsVerification) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-header">
              <h1>Email Verification Required</h1>
              <p>Please check your email for a verification link</p>
            </div>
            
            <div className="verification-content">
              <div className="verification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4a90e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-3.5"></path>
                  <path d="M14 11l-4.5 4.5L8 14"></path>
                  <path d="M18 9.8l-5.3 5.3-1.4-1.4"></path>
                  <path d="M2 10h2"></path>
                  <path d="M2 14h2"></path>
                  <path d="M20 6h2"></path>
                  <path d="M7 6h10"></path>
                </svg>
              </div>
              
              <p className="verification-message">
                We've sent a verification email to <strong>{verificationEmail}</strong>
              </p>
              
              <p className="verification-instructions">
                Please check your inbox and click the verification link to activate your account.
              </p>
              
              {verificationMessage && (
                <div className={`verification-status ${verificationMessage.includes('success') ? 'success' : 'error'}`}>
                  {verificationMessage}
                </div>
              )}
              
              <div className="verification-actions">
                <p>Didn't receive the email?</p>
                <button 
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="submit-button"
                >
                  {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                </button>
                
                <button
                  onClick={() => {
                    setNeedsVerification(false);
                    setVerificationEmail('');
                    setFormData({
                      email: '',
                      password: '',
                      confirmPassword: '',
                      firstName: '',
                      lastName: '',
                    });
                  }}
                  className="secondary-button"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
            
          <div className="auth-image">
            <img 
              src="/images/auth-image.png" 
              alt="Person wearing a hearing aid" 
            />
            <div className="image-overlay">
              <h2>One Step Closer to Better Hearing</h2>
              <p>Complete your email verification to unlock all features of our platform.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>
              {isLogin 
                ? 'Sign in to access your account' 
                : 'Join us for better hearing healthcare'}
            </p>
          </div>

          {error && (
            <div className="error-message" style={{ 
              color: 'white', 
              backgroundColor: '#ff5252', 
              padding: '10px 15px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>Error:</strong> {error}
              {!isLogin && error.includes('Password must be') && (
                <ul style={{ marginTop: '5px', marginBottom: '0', paddingLeft: '20px' }}>
                  <li>At least 8 characters long</li>
                  <li>Include at least one uppercase letter (A-Z)</li>
                  <li>Include at least one lowercase letter (a-z)</li>
                  <li>Include at least one number (0-9)</li>
                </ul>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="name-fields">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Smith"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john.smith@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="forgot-password">
                <button type="button" onClick={() => navigate('/forgot-password')}>
                  Forgot your password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin 
                ? "Don't have an account?" 
                : "Already have an account?"}
              <button type="button" onClick={toggleForm}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <div className="auth-image">
          <img 
            src="/images/auth-image.png" 
            alt="Person wearing a hearing aid" 
          />
          <div className="image-overlay">
            <h2>Your Journey to Better Hearing Starts Here</h2>
            <p>Join thousands of satisfied customers who trust Auralise for their hearing care needs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;