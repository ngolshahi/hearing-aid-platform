import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Contact Section */}
          <div className="footer-section">
            <h3>Contact Us</h3>
            <div className="contact-info">
              <a href="tel:+441234567890" className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+44 (0) 123 456 7890</span>
              </a>
              <a href="mailto:info@auralise.com" className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>info@auralise.com</span>
              </a>
            </div>
          </div>

          {/* Address Section */}
          <div className="footer-section">
            <h3>Visit Us</h3>
            <address className="address-info">
              <p>123 Hearing Care Street</p>
              <p>Manchester, M1 1AB</p>
              <p>United Kingdom</p>
            </address>
            {/* Map */}
            <div className="map-container">
              <iframe
                title="Location Map"
                src="https://www.google.com/maps/embed?pb=YOUR_MAPS_EMBED_URL"
                width="100%"
                height="200"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <nav className="footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <Link to="/accessibility">Accessibility</Link>
              <Link to="/sitemap">Sitemap</Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Auralise. All rights reserved.</p>
          <div className="social-links">
            <a href="https://facebook.com" aria-label="Facebook">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://twitter.com" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
