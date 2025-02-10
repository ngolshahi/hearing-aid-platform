import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ShopPage.css';
import Quiz from './Quiz';

interface HearingAid {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  rating: number;
  releaseDate: string;
  colors: string[];
  image: string;
  description: string;
}

const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  // Mock data
  const hearingAidTypes = ['In-the-Ear (ITE)', 'Behind-the-Ear (BTE)', 'In-the-Canal (ITC)', 'Completely-in-Canal (CIC)'];
  const brands = ['Phonak', 'Oticon', 'Starkey', 'ReSound', 'Widex', 'Signia'];
  const colors = ['Beige', 'Brown', 'Black', 'Silver'];

  // Mock hearing aids data
  const hearingAids: HearingAid[] = [
    {
      id: '1',
      name: 'Premium Plus BTE',
      brand: 'Phonak',
      type: 'Behind-the-Ear (BTE)',
      price: 2499,
      rating: 4.8,
      releaseDate: '2023-06-15',
      colors: ['Beige', 'Brown', 'Black'],
      image: '/images/bte-premium-main.png',
      description: 'Advanced hearing aid with superior sound quality',
    },
    {
      id: '2',
      name: 'Invisible ITC',
      brand: 'Starkey',
      type: 'In-the-Canal (ITC)',
      price: 1899,
      rating: 4.6,
      releaseDate: '2023-05-20',
      colors: ['Beige', 'Brown'],
      image: '/images/itc-invisible.png',
      description: 'Discreet and comfortable in-canal solution',
    },
    {
      id: '3',
      name: 'Elite ITE',
      brand: 'Oticon',
      type: 'In-the-Ear (ITE)',
      price: 2199,
      rating: 4.7,
      releaseDate: '2023-07-01',
      colors: ['Beige', 'Brown', 'Black', 'Silver'],
      image: '/images/ite-elite.png',
      description: 'Custom-fitted for optimal comfort',
    },
    {
      id: '4',
      name: 'Mini CIC',
      brand: 'ReSound',
      type: 'Completely-in-Canal (CIC)',
      price: 2899,
      rating: 4.9,
      releaseDate: '2023-08-10',
      colors: ['Beige', 'Brown'],
      image: '/images/cic-mini.png',
      description: 'Nearly invisible with premium sound quality',
    },
    // Add more hearing aids as needed...
  ];

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleColorChange = (color: string) => {
    if (showAllColors) return; // Don't change colors if "No Preference" is selected
    
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    const isMin = event.target.id === 'min-price';
    setPriceRange(prev => isMin ? [value, prev[1]] : [prev[0], value]);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/shop/product/${productId}`);
  };

  const handleQuizComplete = (results: any) => {
    setShowQuiz(false);
    
    // Update types
    if (results.types && results.types.length > 0) {
      setSelectedTypes(results.types);
    }
    
    // Update brands
    if (results.brands && results.brands.length > 0) {
      setSelectedBrands(results.brands);
    }
    
    // Update colors
    if (results.colors && results.colors.length > 0) {
      setSelectedColors(results.colors);
    }
    
    // Update price range
    if (results.priceRange) {
      setPriceRange(results.priceRange);
    }
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setShowAllColors(false);
    setPriceRange([0, 5000]);
    setSortBy('featured');
  };

  const getFilteredHearingAids = () => {
    return hearingAids.filter(aid => {
      // Filter by type
      if (selectedTypes.length > 0 && !selectedTypes.includes(aid.type)) {
        return false;
      }

      // Filter by brand
      if (selectedBrands.length > 0 && !selectedBrands.includes(aid.brand)) {
        return false;
      }

      // Filter by color
      if (selectedColors.length > 0 && !showAllColors) {
        // Check if the hearing aid has ANY of the selected colors
        const hasMatchingColor = selectedColors.some(selectedColor => 
          aid.colors.includes(selectedColor)
        );
        if (!hasMatchingColor) {
          return false;
        }
      }

      // Filter by price range
      if (aid.price < priceRange[0] || aid.price > priceRange[1]) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort the filtered results
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        default: // 'featured'
          return 0;
      }
    });
  };

  return (
    <div className="shop-page">
      <div className="shop-container">
        {/* Quiz Banner */}
        <div className="quiz-banner">
          <div className="quiz-content">
            <h2>Not sure which hearing aid is right for you?</h2>
            <p>Take our quick quiz to find the perfect match for your needs.</p>
            <button 
              className="quiz-button"
              onClick={() => setShowQuiz(true)}
            >
              Take the Quiz
            </button>
          </div>
        </div>

        <div className="shop-layout">
          {/* Filter Toggle for Mobile */}
          <button className="filter-toggle" onClick={toggleFilter}>
            <i className="fas fa-filter"></i> Filters
          </button>

          {/* Overlay for mobile */}
          {isFilterOpen && (
            <div className="filter-overlay" onClick={toggleFilter}></div>
          )}

          {/* Filters Sidebar */}
          <aside className={`filters ${isFilterOpen ? 'open' : ''}`}>
            <div className="filters-header">
              <h2>Filters</h2>
              <button className="close-filters" onClick={toggleFilter}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Reset Filters Button */}
            <button className="reset-filters" onClick={resetFilters}>
              Reset All Filters
            </button>

            <div className="filter-section">
              <h3>Type</h3>
              {hearingAidTypes.map(type => (
                <label key={type} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeChange(type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h3>Brand</h3>
              {brands.map(brand => (
                <label key={brand} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                  />
                  {brand}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h3>Color</h3>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={showAllColors}
                  onChange={() => {
                    setShowAllColors(!showAllColors);
                    if (!showAllColors) {
                      setSelectedColors([]); // Clear color selection when enabling "No Preference"
                    }
                  }}
                />
                No Preference
              </label>
              {colors.map(color => (
                <label 
                  key={color} 
                  className={`filter-option ${showAllColors ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColors.includes(color)}
                    onChange={() => handleColorChange(color)}
                    disabled={showAllColors}
                  />
                  <span 
                    className="color-sample" 
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                  {color}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-range">
                <input
                  type="number"
                  id="min-price"
                  value={priceRange[0]}
                  onChange={handlePriceChange}
                  min="0"
                  max="5000"
                />
                <span>to</span>
                <input
                  type="number"
                  id="max-price"
                  value={priceRange[1]}
                  onChange={handlePriceChange}
                  min="0"
                  max="5000"
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="products-section">
            {/* Sort Controls */}
            <div className="sort-controls">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              {getFilteredHearingAids().map(product => (
                <div 
                  key={product.id} 
                  className="product-card"
                  onClick={() => handleProductClick(product.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleProductClick(product.id);
                    }
                  }}
                >
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="brand">{product.brand}</p>
                    <p className="type">{product.type}</p>
                    <div className="rating">
                      <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
                      <span className="rating-number">({product.rating})</span>
                    </div>
                    <p className="price">£{product.price.toLocaleString()}</p>
                    <div className="available-colors">
                      {product.colors.map(color => (
                        <span
                          key={color}
                          className="color-dot"
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="product-actions">
                      <button className="primary-button">Add to Cart</button>
                      <button className="secondary-button">Compare</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {showQuiz && (
        <Quiz
          type="hearing-aid"
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default ShopPage;
