import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHearingAidById, HearingAid as BasicHearingAid } from '../services/hearingAidService';
import HearingAidVisualiser from '../components/HearingAidVisualiser';
import '../styles/ProductPage.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

// Extended HearingAid interface that includes all the fields needed for the product page
interface HearingAid extends BasicHearingAid {
  subtitle?: string;
  images?: string[];
  features?: Feature[];
  specifications?: Record<string, string>;
  visualiserConfig?: {
    modelType: string;
    brandLine?: string;
  };
}

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

const getColorName = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#4e312d': 'chestnut-standard', // Chestnut
    '#bec2cb': 'silver', // Silver
    '#708090': 'graphite-gray', // Slate Gray
    '#CD7F32': 'caramel', // Bronze
    '#F7E7CE': 'beige', // Cream
    '#FFFFFF': 'white', // White (if needed)
    '#000000': 'tech-black' // Black (if needed)
  };
  
  return colorMap[hexColor] || 'silver'; // Default to silver if color not found
};

const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [product, setProduct] = useState<HearingAid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualiserSupported, setVisualiserSupported] = useState(false);
  const [showVisualiser, setShowVisualiser] = useState(false);

  // Mock reviews data
  const reviews: Review[] = [
    {
      id: '1',
      user: 'John D.',
      rating: 5,
      date: '2024-02-15',
      title: 'Life-changing device',
      comment: 'This hearing aid has completely transformed my daily life. The sound quality is exceptional, and the battery life is impressive.',
      verified: true,
    },
    {
      id: '2',
      user: 'Sarah M.',
      rating: 4,
      date: '2024-02-10',
      title: 'Great but expensive',
      comment: 'Excellent sound quality and comfortable to wear. The only downside is the price, but the quality makes up for it.',
      verified: true,
    },
    // Add more reviews...
  ];

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      try {
        const hearingAidData = await getHearingAidById(id);
        
        // Check if this model supports the 3D visualiser
        const supports3DVisualiser = id === '2' || id === '3' || id === '4'; // Edge AI 24 mRIC or other visualizer-supported models
        setVisualiserSupported(supports3DVisualiser);
        
        // Transform basic hearing aid data to extended format with default values
        const extendedData: HearingAid = {
          ...hearingAidData,
          subtitle: hearingAidData.subtitle || 'Advanced Hearing Solution',
          images: hearingAidData.images || [hearingAidData.image, hearingAidData.image, hearingAidData.image],
          features: hearingAidData.features || [
            {
              icon: '🔊',
              title: 'Advanced Sound Processing',
              description: 'Automatically adjusts to different sound environments'
            },
            {
              icon: '🔋',
              title: 'Long Battery Life',
              description: 'Up to 24 hours of continuous use'
            },
            {
              icon: '📱',
              title: 'Smartphone Connectivity',
              description: 'Stream audio directly from your devices'
            },
            {
              icon: '💧',
              title: 'Water Resistant',
              description: 'IP68 rated for water and dust protection'
            }
          ],
          specifications: hearingAidData.specifications || {
            'Battery Type': 'Rechargeable Li-ion',
            'Bluetooth': 'Version 5.0',
            'Noise Reduction': 'Advanced Digital',
            'Warranty': '3 Years',
            'Water Resistance': 'IP68',
            'Weight': '2.8g'
          },
          // Add visualiser configuration based on product ID or type
          visualiserConfig: hearingAidData.visualiserConfig || {
            modelType: id === '2' ? 'mric-r' : id === '3' ? 'ric-rt' : id === '4' ? 'itc-r' : 'mric-r',
            brandLine: 'genesis-ai'
          }
        };
        
        setProduct(extendedData);
        
        // Set initial selected color
        if (extendedData.colors && extendedData.colors.length > 0) {
          setSelectedColor(extendedData.colors[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError('Failed to load product data');
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // Calculate average rating
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  const startARExperience = () => {
    if (product) {
      navigate(`/try-on/${product.id}`);
    }
  };

  const openCompareModal = () => {
    setIsCompareModalOpen(true);
  };

  const toggleVisualiser = () => {
    setShowVisualiser(!showVisualiser);
  };

  if (loading) {
    return <div className="loading">Loading product information...</div>;
  }

  if (error || !product) {
    return <div className="error">{error || 'Product not found'}</div>;
  }

  return (
    <div className="product-page">
      <div className="product-container">
        {/* Product Gallery */}
        <div className="product-gallery">
          {showVisualiser ? (
            <HearingAidVisualiser 
              productId={product.id}
              selectedColor={selectedColor}
              modelType={product.visualiserConfig?.modelType}
              brandLine={product.visualiserConfig?.brandLine}
              onVisualiserClose={() => setShowVisualiser(false)}
            />
          ) : (
            <>
              <div className="main-image">
                <img 
                  src={product.images?.[selectedImage] || product.image} 
                  alt={`${product.name} - View ${selectedImage + 1}`} 
                />
              </div>
              <div className="image-thumbnails">
                {(product.images || [product.image]).map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${product.name} - Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="gallery-actions">
            {visualiserSupported && (
              <button className="view-3d-button" onClick={toggleVisualiser}>
                {showVisualiser ? 'View Photos' : 'View 3D Model'}
              </button>
            )}
            <button className="ar-button" onClick={startARExperience}>
              <span className="ar-icon">👓</span>
              Try On with AR
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-header">
            <h1>{product.name}</h1>
            <p className="subtitle">{product.subtitle}</p>
            <div className="brand-type">
              <span className="brand">{product.brand}</span>
              <span className="type">{product.type}</span>
            </div>
            <div className="rating">
              <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
              <span className="rating-number">({product.rating})</span>
            </div>
            <p className="price">£{product.price.toLocaleString()}</p>
          </div>

          <div className="color-selection">
            <h3>Select Color</h3>
            <div className="color-options">
              {product.colors.map(color => (
                <button
                  key={color}
                  className={`color-button ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color.toLowerCase() }}
                  onClick={() => setSelectedColor(color)}
                >
                  <span className="color-name">{getColorName(color).replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          <div className="product-actions">
            <button className="primary-button">Add to Cart</button>
            <button className="secondary-button" onClick={openCompareModal}>
              Compare Models
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          {product.features?.map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Specifications Section */}
      <div className="specifications-section">
        <h2>Technical Specifications</h2>
        <div className="specifications-grid">
          {Object.entries(product.specifications || {}).map(([key, value]) => (
            <div key={key} className="specification-item">
              <span className="spec-label">{key}</span>
              <span className="spec-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        
        <div className="reviews-summary">
          <div className="rating-overview">
            <div className="average-rating">
              <span className="large-rating">{averageRating.toFixed(1)}</span>
              <div className="rating-stars">
                <span className="stars">{'★'.repeat(Math.floor(averageRating))}</span>
                <span className="total-reviews">Based on {reviews.length} reviews</span>
              </div>
            </div>
          </div>
          <button className="write-review-button">
            Write a Review
          </button>
        </div>

        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.user}</span>
                  {review.verified && (
                    <span className="verified-badge">
                      <i className="fas fa-check-circle"></i> Verified Purchase
                    </span>
                  )}
                </div>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="review-rating">
                <span className="stars">{'★'.repeat(review.rating)}</span>
                <span className="rating-empty">{'★'.repeat(5 - review.rating)}</span>
              </div>

              <h3 className="review-title">{review.title}</h3>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="compare-modal">
          <div className="modal-content">
            <h2>Compare Models</h2>
            {/* Add comparison content */}
            <button 
              className="close-button"
              onClick={() => setIsCompareModalOpen(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;