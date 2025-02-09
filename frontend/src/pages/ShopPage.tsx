import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ShopPage.css';

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

  // Mock data
  const hearingAidTypes = ['In-the-Ear (ITE)', 'Behind-the-Ear (BTE)', 'In-the-Canal (ITC)', 'Completely-in-Canal (CIC)'];
  const brands = ['Phonak', 'Oticon', 'Starkey', 'ReSound', 'Widex', 'Signia'];
  const colors = ['Beige', 'Brown', 'Black', 'Silver', 'Blue'];

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
    // Add more hearing aids...
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
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
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
              onClick={() => navigate('/hearing-aid-quiz')}
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
              <div className="color-options">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`color-button ${selectedColors.includes(color) ? 'selected' : ''}`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    onClick={() => handleColorChange(color)}
                  >
                    <span className="color-name">{color}</span>
                  </button>
                ))}
              </div>
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
              {hearingAids.map(product => (
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
    </div>
  );
};

export default ShopPage;
