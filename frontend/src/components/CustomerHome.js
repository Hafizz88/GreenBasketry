import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CustomerHome.css';

function CustomerHome() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'top-selling'
  const navigate = useNavigate();
  const placeholderRef = useRef(null);
  const brandRef = useRef(null);
  const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

  // Animated search placeholder effect
  useEffect(() => {
    const text = "Search for products...";
    let i = 0;
    let forward = true;
    let timeout;
    function type() {
      if (placeholderRef.current) {
        placeholderRef.current.textContent = text.slice(0, i);
      }
      if (forward) {
        if (i < text.length) {
          i++;
          timeout = setTimeout(type, 80);
        } else {
          forward = false;
          timeout = setTimeout(type, 1200);
        }
      } else {
        if (i > 0) {
          i--;
          timeout = setTimeout(type, 30);
        } else {
          forward = true;
          timeout = setTimeout(type, 400);
        }
      }
    }
    type();
    return () => clearTimeout(timeout);
  }, []);

  // Animated brand name effect
  useEffect(() => {
    const text = "GreenBasketry";
    let i = 0;
    let timeout;
    function type() {
      if (brandRef.current) {
        brandRef.current.textContent = text.slice(0, i);
      }
      if (i < text.length) {
        i++;
        timeout = setTimeout(type, 120);
      } else {
        setTimeout(() => {
          i = 0;
          type();
        }, 1200);
      }
    }
    type();
    return () => clearTimeout(timeout);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/products/categories', getAuthHeader());
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch top selling products
  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/products/top-selling?limit=8', getAuthHeader());
        setTopSellingProducts(response.data);
      } catch (error) {
        console.error('Error fetching top selling products:', error);
      }
    };

    fetchTopSellingProducts();
  }, []);

  // Fetch products by category
  useEffect(() => {
    if (selectedCategory) {
      const fetchProducts = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/products/category/${selectedCategory}`, getAuthHeader());
          setProducts(response.data);
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };

      fetchProducts();
    }
  }, [selectedCategory]);

  // Fetch products by search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const fetchSearchResults = async () => {
        if (searchTerm.trim() === '') {
          setSearchResults([]);
          return;
        }

        try {
          const response = await axios.get(`http://localhost:5001/api/products/search?name=${searchTerm}`, getAuthHeader());
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error fetching search results:', error);
        }
      };

      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleAddToCart = async (productId) => {
    try {
      const storedCustomerId = localStorage.getItem('userId');
      const customerId = parseInt(storedCustomerId, 10);

      if (!customerId || isNaN(customerId)) {
        alert("Please log in first!");
        return;
      }

      const payload = {
        customer_id: customerId,
        product_id: productId,
        quantity: 1,
      };

      await axios.post('http://localhost:5001/api/cart', payload, getAuthHeader());
      alert('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddToWishlist = async (productId) => {
    try {
      const storedCustomerId = localStorage.getItem('userId');
      const customerId = parseInt(storedCustomerId, 10);

      if (!customerId || isNaN(customerId)) {
        alert("Please log in first!");
        return;
      }

      await axios.post('http://localhost:5001/api/wishlist', {
        customer_id: customerId,
        product_id: productId
      }, getAuthHeader());

      alert('Added to wishlist!');
    } catch (err) {
      console.error('Add to wishlist failed', err);
      alert('Failed to add to wishlist: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleProfileClick = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please log in first!');
      navigate('/login');
      return;
    }

    navigate('/profile');
  };

  const handleCartClick = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please log in first!');
      navigate('/login');
      return;
    }

    navigate('/cart');
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchTerm('');
    setSearchResults([]);
    setActiveTab('categories');
  };

  const handleTopSellingClick = () => {
    setActiveTab('top-selling');
    setSelectedCategory('');
    setSearchTerm('');
    setSearchResults([]);
  };

  const getDisplayedProducts = () => {
    if (searchTerm) {
      return searchResults;
    }
    if (activeTab === 'top-selling') {
      return topSellingProducts;
    }
    return products;
  };

  const getMainTitle = () => {
    if (searchTerm) {
      return `Search Results for "${searchTerm}"`;
    }
    if (activeTab === 'top-selling') {
      return 'Top Selling Products 🔥';
    }
    return selectedCategory || 'Select a Category';
  };

const displayedProducts = getDisplayedProducts();
return (
  <div className="homepage">
  <header className="header">
    <div className="welcome-section">
      <div className="welcome-left">
        <h1 className="dynamic-title">
          <span>Welcome to</span>
          <span className="brand-gradient" ref={brandRef}></span>
        </h1>
        <div className="search-bar-animated">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            autoComplete="off"
            id="animated-search"
            placeholder="Search for products"
          />
          {(!searchTerm && !inputFocused) && (
            <span className="search-placeholder" ref={placeholderRef}></span>
          )}
          <button className="search-btn">Search</button>
        </div>
      </div>
    </div>
  </header>

  <div className="main-area">
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeTab === 'top-selling' ? 'active' : ''}`}
          onClick={handleTopSellingClick}
        >
          🔥 Top Selling
        </button>
        <button 
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📂 Categories
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="categories-section">
          <h2>Categories</h2>
          <ul>
            {categories.map((category) => (
              <li
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'top-selling' && (
        <div className="top-selling-info">
          <h2>Top Selling Products</h2>
          <p>Discover our most popular items based on customer purchases!</p>
        </div>
      )}
    </aside>

    <main className="main-content">
      <h2>{getMainTitle()}</h2>
      <div className="product-grid">
        {displayedProducts.map((product) => (
          <div key={product.product_id || product.id} className="product-card">
            {activeTab === 'top-selling' && (
              <div className="top-selling-badge">
                <span className="fire-icon">🔥</span>
                <span className="sold-count">{product.total_times_purchased} sold</span>
              </div>
            )}

            <img
              src={product.image?.url || product.image_url || product.thumbnail || 'default-image.jpg'}
              alt={product.name || product.title || 'No Title'}
            />

            <div className="product-info">
              <h3>{product.name || product.title || 'No Title'}</h3>
              <p className="price">৳{product.price || 'N/A'}</p>
            </div>

            <div className="product-actions">
              <button 
                onClick={() => handleAddToCart(product.product_id || product.id)}
                className="add-to-cart-btn"
              >
                Add to Cart
              </button>

              <button
                onClick={() => handleAddToWishlist(product.product_id || product.id)}
                className="wishlist-btn"
              >
                ❤️
              </button>
            </div>
          </div>
        ))}
      </div>

      {displayedProducts.length === 0 && (
        <div className="no-products">
          <p>
            {searchTerm
              ? 'No products found matching your search.'
              : activeTab === 'top-selling'
              ? 'No top selling products available yet.'
              : 'No products available in this category.'}
          </p>
        </div>
      )}
    </main>
  </div>

  <footer className="footer">
    <p>Help | <button className="complaint-link" onClick={() => navigate('/complaints')}>File a Complaint</button></p>
  </footer>
</div>

  );
}

export default CustomerHome;