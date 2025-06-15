import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerHome.css';

function CustomerHome() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://dummyjson.com/products/categories'); // DummyJSON API
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
          const response = await axios.get(`https://dummyjson.com/products/category/${selectedCategory}`); // DummyJSON API
          setProducts(response.data.products); // Adjust based on API response structure
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };

      fetchProducts();
    }
  }, [selectedCategory]);

  // Generate CSV file
  const generateCSV = () => {
    if (products.length === 0) {
      alert('No products available to export.');
      return;
    }

    // Define CSV headers
    const headers = ['ID', 'Title', 'Price', 'Category', 'Thumbnail'];

    // Map products to CSV rows
    const rows = products.map((product) => [
      product.id,
      product.title,
      product.price,
      selectedCategory,
      product.thumbnail || 'N/A',
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.join(',')) // Convert each row to a comma-separated string
      .join('\n'); // Combine rows with newline characters

    // Create a Blob and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCategory || 'products'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  console.log(categories); // Check the structure of categories
  console.log(products);

  return (
    <div className="homepage">
      <header className="header">
        <h1>Welcome to GreenBasketry</h1>
        <input type="text" placeholder="Search for products..." />
      </header>
      <aside className="sidebar">
        <h2>Categories</h2>
        <ul>
          {categories.map((category) => (
            <li key={category.slug} onClick={() => setSelectedCategory(category.slug)}>
              {category.name} {/* Render the name property */}
            </li>
          ))}
        </ul>
      </aside>
      <main className="main-content">
        <h2>{selectedCategory || 'Select a Category'}</h2>
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {/* Check if the image and url exist before rendering */}
              <img src={product.image?.url || product.thumbnail || 'default-image-url.jpg'} alt={product.title || 'Product'} />
              <h3>{product.title || 'No Title Available'}</h3>
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