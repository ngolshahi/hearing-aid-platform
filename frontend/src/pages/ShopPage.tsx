import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ShopPage.css';
import Quiz from './Quiz';
import { getHearingAids, HearingAid } from '../services/hearingAidService';
import { colorGroups, getColorName, getDisplayColorByName, hearingAidHasSelectedColor, getUniqueColorGroups } from '../utils/colorUtils';

// Define a mapping for our category slugs to hearing aid types displayed in UI
const categoryToTypeMap: Record<string, string> = {
  'ric': 'RIC (Receiver-in-Canal)',
  'itc': 'ITC (In-the-Canal)',
  'iic': 'IIC (Invisible-in-Canal)',
  'bte': 'BTE (Behind-the-Ear)'
};

// Define a more direct mapping from category slug to exact type strings
const categoryToExactTypes: Record<string, string[]> = {
  'ric': ['Mini Receiver-In-Canal (mRIC)', 'Receiver-In-Canal (RIC)'],
  'itc': ['In-The-Canal (ITC)'],
  'iic': ['Invisible-In-Canal (IIC)'],
  'bte': ['Behind-the-Ear (BTE)']
};

// This function gets matching types from available hearingAidTypes based on a category
const getMatchingHearingAidTypes = (category: string, availableTypes: string[]): string[] => {
  console.log('Finding matches for category:', category);
  console.log('Available types:', availableTypes);
  
  // Use our direct mapping
  if (categoryToExactTypes[category]) {
    // Get the exact type strings for this category
    const exactTypeStrings = categoryToExactTypes[category];
    console.log('Looking for exact types:', exactTypeStrings);
    
    // Filter available types to only include those that are in our exact list
    const result = availableTypes.filter(availableType => 
      exactTypeStrings.includes(availableType)
    );
    
    console.log('Matched types by exact mapping:', result);
    return result;
  }
  
  // Fallback to generic string matching if needed
  const fallbackResult = availableTypes.filter(type => 
    type.toLowerCase().includes(category.toLowerCase())
  );
  
  console.log('Matched types by fallback:', fallbackResult);
  return fallbackResult;
};

const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAllColors, setShowAllColors] = useState(true); // Set to true by default
  // Add a special type filter that works regardless of available types
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // State for hearing aids data and loading status
  const [hearingAids, setHearingAids] = useState<HearingAid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Arrays for filter options that will be populated from the fetched data
  const [hearingAidTypes, setHearingAidTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [availableColorGroups, setAvailableColorGroups] = useState<typeof colorGroups>([]);
  
  // Use a ref to track if we've already processed a selected type
  const processedSelectedType = React.useRef<string | null>(null);
  // Track initial data loading
  const initialDataLoaded = React.useRef(false);
  // Track whether we've set filters from navigation
  const filtersSetFromNavigation = React.useRef(false);

  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Check for filter parameters from navigation
  useEffect(() => {
    const state = location.state as { selectedType?: string; filterCategory?: string } | null;
    
    if (state && state.selectedType && hearingAidTypes.length > 0 && 
        processedSelectedType.current !== state.selectedType) {
      
      console.log('Selecting types matching category:', state.selectedType);
      processedSelectedType.current = state.selectedType;
      filtersSetFromNavigation.current = true;
      
      // Use our helper function to get matching types
      const matchingTypes = getMatchingHearingAidTypes(state.selectedType, hearingAidTypes);
      
      console.log('Matching types:', matchingTypes);
      
      if (matchingTypes.length > 0) {
        // Clear any previous selected types and set only the matching types
        setSelectedTypes(matchingTypes);
      } else {
        // If no matches found, try to find types containing the category name
        console.log('No direct matches found, trying fallback method...');
        const fallbackMatches = hearingAidTypes.filter(type => 
          type.toLowerCase().includes(state.selectedType!.toLowerCase())
        );
        
        if (fallbackMatches.length > 0) {
          console.log('Fallback matches found:', fallbackMatches);
          setSelectedTypes(fallbackMatches);
        } else {
          console.log('No matches found at all, keeping all types selected');
        }
      }
      
      // Clear the location state to prevent filter being applied on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
    else if (state && state.filterCategory) {
      // For backward compatibility
      console.log('Filtering by category:', state.filterCategory);
      setCategoryFilter(state.filterCategory);
      filtersSetFromNavigation.current = true;
      
      // Clear the location state to prevent filter being applied on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, hearingAidTypes]);

  // Fetch hearing aids from the API
  useEffect(() => {
    const fetchHearingAids = async () => {
      setIsLoading(true);
      try {
        const data = await getHearingAids();
        setHearingAids(data);
        
        // Extract unique types, brands, and colors from the fetched data
        const types = [...new Set(data.map(aid => aid.type))];
        const brandsList = [...new Set(data.map(aid => aid.brand))];
        // Extract all color hex codes
        const colorHexCodes = [...new Set(data.flatMap(aid => aid.colors))];
        
        // Get unique color groups from all hex codes
        const uniqueColorGroups = getUniqueColorGroups(colorHexCodes);
        
        console.log('Available hearing aid types:', types);
        console.log('Available color groups:', uniqueColorGroups.map(g => g.name));
        
        // Debug: Log each aid with its type and colors
        console.log('All hearing aids with types and colors:');
        data.forEach(aid => {
          console.log(`${aid.name}: "${aid.type}", Colors: ${aid.colors.map(c => getColorName(c)).join(', ')}`);
        });
        
        setHearingAidTypes(types);
        setBrands(brandsList);
        // Store the unique color groups for display in the filter
        setAvailableColorGroups(uniqueColorGroups);
        // We no longer need to store raw hex codes
        // setColors(colorsList);
        
        // ONLY set all filters on first load AND if we haven't set filters from navigation
        if (!initialDataLoaded.current && !filtersSetFromNavigation.current) {
          console.log('First load - setting all types as selected');
          setSelectedTypes(types);
          setSelectedBrands(brandsList);
        }
        
        initialDataLoaded.current = true;
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch hearing aids:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHearingAids();
  }, [categoryFilter]);

  // Apply filtering when the category filter changes
  useEffect(() => {
    if (categoryFilter) {
      // Clear all filters when a category filter is applied
      setSelectedTypes([]);
      setSelectedBrands([]);
      setSelectedColors([]);
      setShowAllColors(true);
    }
  }, [categoryFilter]);

  useEffect(() => {
    // Clean up the body overflow style when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleTypeChange = (type: string) => {
    // Clear the category filter when user manually changes type selection
    setCategoryFilter(null);
    // Mark that we've manually set filters
    filtersSetFromNavigation.current = true;
    
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleBrandChange = (brand: string) => {
    // Mark that we've manually set filters
    filtersSetFromNavigation.current = true;
    
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleColorChange = (colorGroupName: string) => {
    if (showAllColors) return; // Don't change colors if "No Preference" is selected
    
    // Mark that we've manually set filters
    filtersSetFromNavigation.current = true;
    
    setSelectedColors(prev => {
      if (prev.includes(colorGroupName)) {
        return prev.filter(c => c !== colorGroupName);
      } else {
        return [...prev, colorGroupName];
      }
    });
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Mark that we've manually set filters
    filtersSetFromNavigation.current = true;
    
    const value = parseInt(event.target.value);
    const isMin = event.target.id === 'min-price';
    setPriceRange(prev => isMin ? [value, prev[1]] : [prev[0], value]);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    // Prevent body scroll when filter menu is open on mobile
    if (window.innerWidth <= 768) {
      document.body.style.overflow = !isFilterOpen ? 'hidden' : '';
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/shop/product/${productId}`);
  };

  const handleCompareClick = (event: React.MouseEvent, productId: string) => {
    event.stopPropagation(); // Prevent navigation to product page
    
    setSelectedForComparison(prev => {
      // Check if product is already selected for comparison
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        // Add product to comparison, limit to 3 products
        if (prev.length < 3) {
          return [...prev, productId];
        } else {
          alert('You can only compare up to 3 products at a time.');
          return prev;
        }
      }
    });
  };

  const navigateToCompare = () => {
    if (selectedForComparison.length > 0) {
      // Get the first selected product ID to use as the main product
      const mainProductId = selectedForComparison[0];
      
      // Navigate to the product page of the first product with comparison data
      navigate(`/shop/product/${mainProductId}`, { 
        state: { compareIds: selectedForComparison } 
      });
    }
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
    
    // Update colors - handle both hex codes and color names from quiz results
    if (results.colors && results.colors.length > 0) {
      // Convert any hex codes to color names if needed
      const colorNames = results.colors.map((color: string) => {
        // If it starts with #, it's a hex code, so convert it
        if (color.startsWith('#')) {
          return getColorName(color);
        }
        // Otherwise, assume it's already a color name
        return color;
      });
      
      setSelectedColors(colorNames);
      setShowAllColors(false);
    }
    
    // Update price range
    if (results.priceRange) {
      setPriceRange(results.priceRange);
    }
    
    // Clear category filter if quiz is completed
    setCategoryFilter(null);
  };

  const resetFilters = () => {
    // Mark that we've manually set filters
    filtersSetFromNavigation.current = true;
    
    // When resetting, select all filters
    setSelectedTypes(hearingAidTypes);
    setSelectedBrands(brands);
    setSelectedColors([]);
    setShowAllColors(true);
    setPriceRange([0, 5000]);
    setSortBy('featured');
    setCategoryFilter(null);
  };

  const toggleShowAllColors = () => {
    const newShowAllColors = !showAllColors;
    setShowAllColors(newShowAllColors);
    
    if (newShowAllColors) {
      // When switching to "No Preference", clear any selected colors
      setSelectedColors([]);
    } else if (selectedColors.length === 0) {
      // When disabling "No Preference" without any colors selected, 
      // show a warning to the user that no products will be displayed
      console.log('Warning: No colors selected with No Preference turned off');
    }
    
    // Mark that we've manually set filters
    filtersSetFromNavigation.current = true;
  };

  const getFilteredHearingAids = () => {
    if (selectedTypes.length > 0) {
      console.log('Filtering by types:', selectedTypes);
    }
    
    if (categoryFilter) {
      console.log('Using category filter:', categoryFilter);
    }
    
    if (selectedColors.length > 0) {
      console.log('Filtering by color groups:', selectedColors);
    } else if (!showAllColors) {
      // If No Preference is not checked AND no colors are selected, return no products
      console.log('No color preference disabled but no colors selected - showing no products');
    }
    
    return hearingAids.filter(aid => {
      // Filter by custom category if set (takes precedence)
      if (categoryFilter) {
        // Get all hearing aid types that match this category
        const matchingTypes = getMatchingHearingAidTypes(categoryFilter, hearingAidTypes);
        // Check if the current aid's type is in the matching types
        if (matchingTypes.length > 0) {
          return matchingTypes.includes(aid.type);
        }
        // Fallback to simple string matching if no matches found
        return aid.type.toLowerCase().includes(categoryFilter.toLowerCase());
      }
      
      // Filter by selected types (if none are selected, show all)
      if (selectedTypes.length > 0 && !selectedTypes.includes(aid.type)) {
        return false;
      }

      // Filter by brand (if none are selected, show all)
      if (selectedBrands.length > 0 && !selectedBrands.includes(aid.brand)) {
        return false;
      }

      // Filter by color
      if (!showAllColors) {
        if (selectedColors.length === 0) {
          // If "No Preference" is unchecked but no colors are selected, show no products
          return false;
        } else if (!hearingAidHasSelectedColor(aid.colors, selectedColors)) {
          // Check if the hearing aid has ANY of the selected colors
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

        {/* Show comparison bar when products are selected */}
        {selectedForComparison.length > 0 && (
          <div className="comparison-bar">
            <div className="comparison-info">
              <span>{selectedForComparison.length} product{selectedForComparison.length > 1 ? 's' : ''} selected</span>
            </div>
            <div className="comparison-actions">
              <button 
                className="clear-selection"
                onClick={() => setSelectedForComparison([])}
              >
                Clear Selection
              </button>
              <button 
                className="compare-products-btn"
                onClick={navigateToCompare}
              >
                Compare Products
              </button>
            </div>
          </div>
        )}

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
              <button className="close-filters" onClick={toggleFilter} aria-label="Close filters">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Reset Filters Button */}
            <button className="reset-filters" onClick={resetFilters}>
              Reset All Filters
            </button>

            {/* Show active category filter if present */}
            {categoryFilter && (
              <div className="filter-section">
                <h3>Active Filter</h3>
                <div className="active-category-filter">
                  <span>Category: {categoryToTypeMap[categoryFilter] || categoryFilter}</span>
                  <button 
                    className="clear-filter"
                    onClick={() => setCategoryFilter(null)}
                    aria-label="Clear category filter"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="filter-section">
              <h3>Type</h3>
              {hearingAidTypes.map(type => (
                <label 
                  key={type} 
                  className={`filter-option ${categoryFilter ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeChange(type)}
                    disabled={!!categoryFilter}
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
                  onChange={toggleShowAllColors}
                />
                No Preference
              </label>
              {!showAllColors && selectedColors.length === 0 && (
                <p className="filter-hint">Please select at least one color</p>
              )}
              {availableColorGroups.map(colorGroup => (
                <label 
                  key={colorGroup.name} 
                  className={`filter-option ${showAllColors ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColors.includes(colorGroup.name)}
                    onChange={() => handleColorChange(colorGroup.name)}
                    disabled={showAllColors}
                  />
                  <span 
                    className="color-sample" 
                    style={{ backgroundColor: colorGroup.displayColor.toLowerCase() }}
                  />
                  {colorGroup.name}
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
              {isLoading ? (
                <div className="loading-message">
                  <p>Loading products...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>{error}</p>
                  <button 
                    className="retry-button"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              ) : getFilteredHearingAids().length > 0 ? (
                getFilteredHearingAids().map(product => (
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
                      {selectedForComparison.includes(product.id) && (
                        <div className="comparison-badge">
                          Selected for comparison
                        </div>
                      )}
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
                            title={getColorName(color)}
                          />
                        ))}
                      </div>
                      <div className="product-actions">
                        <button className="primary-button">Add to Cart</button>
                        <button 
                          className={`secondary-button ${selectedForComparison.includes(product.id) ? 'active' : ''}`}
                          onClick={(e) => handleCompareClick(e, product.id)}
                        >
                          {selectedForComparison.includes(product.id) ? 'Selected' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No products match your current filters.</p>
                  <button className="reset-filters" onClick={resetFilters}>
                    Reset All Filters
                  </button>
                </div>
              )}
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