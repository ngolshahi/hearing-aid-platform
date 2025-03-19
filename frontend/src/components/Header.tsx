import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, currentUser } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo-container" onClick={closeMenu}>
          <span className="logo">Auralise</span>
        </Link>

        {/* Mobile menu button */}
        <button className="mobile-menu-button" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Navigation menu */}
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li><Link to="/" className="nav-link" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/book" className="nav-link" onClick={closeMenu}>Book</Link></li>
            <li><Link to="/shop" className="nav-link" onClick={closeMenu}>Shop</Link></li>
            <li><Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link></li>
          </ul>

          <div className="auth-buttons">
            {isAuthenticated ? (
              <Link to="/profile" className="profile-button" onClick={closeMenu}>
                <div className="profile-avatar">
                  {currentUser?.image ? (
                    <img src={currentUser.image} alt="Profile" className="profile-image" />
                  ) : (
                    <div className="profile-initials">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <>
                <Link to="/login" className="login-button" onClick={closeMenu}>Login</Link>
                <Link to="/signup" className="signup-button" onClick={closeMenu}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;