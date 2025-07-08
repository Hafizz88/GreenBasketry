import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CustomerHome.css';

function CustomerHome() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);
  const navigate = useNavigate();
  const placeholderRef = useRef(null);
  const brandRef = useRef(null);

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
        const response = await axios.get('http://localhost:5000/api/products/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products by category
  useEffect(() => {
    if (selectedCategory) {
      const fetchProducts = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/products/category/${selectedCategory}`);
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
          const response = await axios.get(`http://localhost:5000/api/products/search?name=${searchTerm}`);
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

      await axios.post('http://localhost:5000/api/cart', payload);
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

      await axios.post('http://localhost:5000/api/wishlist', {
        customer_id: customerId,
        product_id: productId
      });

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

  const displayedProducts = searchTerm ? searchResults : products;

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
              />
              {(!searchTerm && !inputFocused) && (
                <span className="search-placeholder" ref={placeholderRef}></span>
              )}
              <button className="search-btn">Search</button>
            </div>
          </div>
          <div className="welcome-right">
            <div className="profile-cart-card">
              <button className="profile-btn" onClick={handleProfileClick}>
                <span role="img" aria-label="profile">👤</span> My Profile
              </button>
              <button className="cart-btn" onClick={handleCartClick}>
                <span role="img" aria-label="cart">🛒</span> Cart
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="main-area">
        <aside className="sidebar">
          <h2>Categories</h2>
          <ul>
            {categories.map((category) => (
              <li
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
              >
                {category}
              </li>
            ))}
          </ul>
        </aside>
        <main className="main-content">
          <h2>{searchTerm ? `Search Results for "${searchTerm}"` : selectedCategory || 'Select a Category'}</h2>
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <div key={product.product_id || product.id} className="product-card">
                <img
                  src={product.image?.url || product.image_url || product.thumbnail || 'default-image.jpg'}
                  alt={product.name || product.title || 'No Title'}
                />
                <h3>{product.name || product.title || 'No Title'}</h3>
                <p>৳{product.price || 'N/A'}</p>

                <button 
                  onClick={() => handleAddToCart(product.product_id || product.id)}
                  style={{ backgroundColor: 'green', color: 'white', margin: '5px' }}
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => handleAddToWishlist(product.product_id || product.id)}
                  style={{ backgroundColor: 'red', color: 'white', margin: '5px' }}
                >
                  ❤️ Wishlist
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
      <footer className="footer">
        <p>Help | File a Complaint</p>
      </footer>
    </div>
  );
}

export default CustomerHome;