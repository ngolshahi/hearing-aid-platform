import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import '../styles/BusinessReviews.css';

interface BusinessReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  location: string;
}

const BusinessReviews: React.FC = () => {
  const reviews: BusinessReview[] = [
    {
      id: '1',
      name: 'Emma Thompson',
      rating: 5,
      date: '2024-01-15',
      comment: 'The team at Auralise went above and beyond to help me find the perfect hearing solution. Their expertise and patience made the whole process comfortable and reassuring.',
      location: 'London, UK'
    },
    {
      id: '2',
      name: 'Michael Roberts',
      rating: 5,
      date: '2024-01-20',
      comment: 'Outstanding service from start to finish. The audiologists are incredibly knowledgeable and take the time to understand your specific needs. Highly recommend!',
      location: 'Manchester, UK'
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      rating: 5,
      date: '2024-02-01',
      comment: 'I was nervous about getting hearing aids, but the staff made me feel so comfortable. The follow-up care has been excellent, and I can hear better than I have in years.',
      location: 'Birmingham, UK'
    }
  ];

  return (
    <section className="business-reviews">
      <div className="reviews-container">
        <h2>What Our Customers Say</h2>
        <p className="reviews-subtitle">
          Trusted by thousands of customers across the UK
        </p>

        <div className="overall-rating">
          <div className="rating-number">4.9</div>
          <div className="rating-details">
            <div className="stars">{'★'.repeat(5)}</div>
            <p>Based on {reviews.length}+ verified Google reviews</p>
          </div>
        </div>

        <div className="testimonials-grid">
          {reviews.map(review => (
            <div key={review.id} className="testimonial-card">
              <div className="testimonial-header">
                <div className="reviewer-initial">
                  {review.name.charAt(0)}
                </div>
                <div className="reviewer-details">
                  <h3>{review.name}</h3>
                  <span className="location">{review.location}</span>
                </div>
              </div>

              <div className="review-rating">
                <span className="stars">{'★'.repeat(review.rating)}</span>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <p className="testimonial-text">{review.comment}</p>

              <div className="testimonial-footer">
                <div className="google-icon">
                  <FaGoogle />
                </div>
                <span className="verified-tag">Verified Google Review</span>
              </div>
            </div>
          ))}
        </div>

        <div className="reviews-cta">
          <p>Experience the Auralise difference for yourself</p>
          <button className="book-consultation-button">
            Book a Free Consultation
          </button>
        </div>
      </div>
    </section>
  );
};

export default BusinessReviews; 