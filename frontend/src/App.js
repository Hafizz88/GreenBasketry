import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
<<<<<<< HEAD
import Login from './components/Login.js' ;

import Signup from './components/Signup.js';
import CustomerHome from './components/CustomerHome.js';
import './App.css';
=======
import Login from './components/login.js';
import Signup from './components/Signup.js';
import './App.css';
import Product from './components/Product.js';
>>>>>>> 38c3e904d5dfbac825137f0998a8b5367d3c727a

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
<<<<<<< HEAD
        <Route path="/home" element={<CustomerHome />} />
=======
        <Route path="/product" element={<Product />} />
>>>>>>> 38c3e904d5dfbac825137f0998a8b5367d3c727a
      </Routes>
    </Router>
  );
}

export default App;
