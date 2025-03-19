import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/LoginPage.css';
import { login, register } from '../services/authService';

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

  // Update isLogin when path changes
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError('');
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      // Validation
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
  
      if (isLogin) {
        // Handle login
        const response = await login({
          email: formData.email,
          password: formData.password
        });
  
        // Check for successful login - the token must exist AND not be null
        if (response && response.email) {
          // Login successful - store the token in localStorage or context
          localStorage.setItem('authToken', response.email);
          alert('Logged in successfully.');
          console.log('Logged in successfully as ' + localStorage.getItem('user'));
          navigate('/'); // Redirect to home page
        } else {
          // Login failed
          setError('Invalid email or password');
        }
      } else {
        // Handle registration (unchanged)
        const response = await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
  
        if (response && response.email) {
          // Registration successful
          alert('Account created successfully! Please log in.');
          navigate('/login');
        } else {
          // Registration failed
          setError('Registration failed');
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
    // Update URL when toggling
    navigate(isLogin ? '/signup' : '/login');
  };

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
            <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
              {error}
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