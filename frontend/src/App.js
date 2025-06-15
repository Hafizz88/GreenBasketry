import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login.js' ;

import Signup from './components/Signup.js';
import CustomerHome from './components/CustomerHome.js';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<CustomerHome />} />
      </Routes>
    </Router>
  );
}

export default App;
