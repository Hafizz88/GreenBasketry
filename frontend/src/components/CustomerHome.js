import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Remove this line if unused
import axios from 'axios';
import './CustomerHome.css'; // Add custom styles here

function CustomerHome() {
  const navigate = useNavigate();
  navigate('/home'); // Example usage
  const products = [
    { id: 1, name: 'Potato Regular', price: 24, image: 'potato.jpg', weight: '1 kg' },
    { id: 2, name: 'Red Tomato', price: 49, image: 'tomato.jpg', weight: '500 gm' },
    { id: 3, name: 'Coriander Leaves', price: 25, image: 'coriander.jpg', weight: '100 gm' },
    { id: 4, name: 'Green Chilli', price: 25, image: 'chilli.jpg', weight: '250 gm' },
    { id: 5, name: 'Red Potato', price: 25, image: 'red_potato.jpg', weight: '1 kg' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="homepage">
      <header className="header">
        <h1>Welcome to Chaldal</h1>
        <input type="text" placeholder="Search for products..." />
      </header>
      <aside className="sidebar">
        <ul>
          <li>Fruits & Vegetables</li>
          <li>Meat & Fish</li>
          <li>Cooking</li>
          <li>Dairy & Eggs</li>
          <li>Snacks</li>
        </ul>
      </aside>
      <main className="main-content">
        <h2>Fresh Vegetables</h2>
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <img src={`/images/${product.image}`} alt={product.name} />
              <h3>{product.name}</h3>
              <p>{product.weight}</p>
              <p>৳{product.price}</p>
              <button>Add to Bag</button>
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