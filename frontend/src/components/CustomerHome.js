import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CustomerHome.css';
import { useNavigate} from 'react-router-dom';

function CustomerHome() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

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

  // Fetch products by name (search)
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

  // ADD TO CART FUNCTION - ADD THIS
  const handleAddToCart = async (productId) => {
    console.log("=== ADD TO CART DEBUG START ===");
    console.log("ProductId received:", productId, typeof productId);
    
    try {
      const storedCustomerId = localStorage.getItem('userId');
      console.log("StoredCustomerId:", storedCustomerId, typeof storedCustomerId);
      
      if (!storedCustomerId) {
        console.log("❌ No customer_id in localStorage");
        alert("Please log in first!");
        return;
      }

      const customerId = parseInt(storedCustomerId, 10);
      console.log("ParsedCustomerId:", customerId, typeof customerId);
      
      if (!customerId || isNaN(customerId)) {
        console.log("❌ Invalid customer ID after parsing");
        alert("Customer ID is invalid or missing!");
        return;
      }

      const payload = {
        customer_id: customerId,
        product_id: productId,
        quantity: 1
      };
      console.log("Payload to send:", payload);

      const response = await axios.post('http://localhost:5000/api/cart', payload);
      console.log("Response received:", response.data);
      alert('Added to cart!');
      
    } catch (err) {
      console.error('❌ Full error object:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error message:', err.message);
      alert('Failed to add to cart: ' + (err.response?.data?.error || err.message));
    }
    
    console.log("=== ADD TO CART DEBUG END ===");
  };

  // ADD TO WISHLIST FUNCTION - ADD THIS
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

  // You already have useNavigate imported, so add this function:
const handleProfileClick = () => {
  // Optional: Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please log in first!');
    navigate('/login');
    return;
  }
  
  // Navigate to profile
  navigate('/profile');
};
  // Decide what products to show
  const displayedProducts = searchTerm ? searchResults : products;

  return (
    <div className="homepage">
      <header className="header">
        <h1>Welcome to GreenBasketry</h1>
        <input
          type="text"
          placeholder="Search for products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link to="/profile">
          <button className="profile-btn" onClick={handleProfileClick}>
  My Profile
</button>
        </Link>
      </header>

      <aside className="sidebar">
        <h2>Categories</h2>
        <ul>
          {categories.map((category) => (
            <li key={category} onClick={() => {
              setSelectedCategory(category);
              setSearchTerm('');
              setSearchResults([]);
            }}>
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
                src={product.image?.url || product.image_url || product.thumbnail || 'default-image-url.jpg'}
                alt={product.name || product.title || 'No Title'}
              />
              <h3>{product.name || product.title || 'No Title'}</h3>
              <p>৳{product.price || 'N/A'}</p>
              
              {/* UPDATED BUTTONS WITH FUNCTIONALITY */}
              <button 
                onClick={(e) => {
                  console.log("🔥 ADD TO CART CLICKED!");
                  console.log("Product:", product);
                  e.preventDefault();
                  handleAddToCart(product.product_id || product.id);
                }}
                style={{ backgroundColor: 'green', color: 'white', margin: '5px' }}
              >
                Add to Cart
              </button>
              
              <button 
                onClick={(e) => {
                  console.log("💖 WISHLIST CLICKED!");
                  e.preventDefault();
                  handleAddToWishlist(product.product_id || product.id);
                }}
                style={{ backgroundColor: 'red', color: 'white', margin: '5px' }}
              >
                ❤️ Wishlist
              </button>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>Help | File a Complaint</p>
      </footer>
    </div>
  );
}

export default CustomerHome;