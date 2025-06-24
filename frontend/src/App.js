import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './components/login.js' ;

import Signup from './components/Signup.js';
import CustomerHome from './components/CustomerHome.js';
import './App.css';

//import Login from './components/login.js';
//import Signup from './components/Signup.js';
//import './App.css';
import Product from './components/Product.js';
import CartPage from './components/CartPage.js';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/home" element={<CustomerHome />} />
        <Route path="/cart" element={<CartPage />} />

        <Route path="/product" element={<Product />} />
      </Routes>
    </Router>
  );
}

export default App;