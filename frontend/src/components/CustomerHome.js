import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerHome.css';

function CustomerHome() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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
    }, 300); // debounce delay

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

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
                alt={product.name || product.title || 'Product'}
              />
              <h3>{product.name || product.title || 'No Title'}</h3>
              <p>৳{product.price || 'N/A'}</p>
              <button>Add to Cart</button>
              <button>❤️ Wishlist</button>
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
