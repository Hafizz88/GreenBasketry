import React from 'react'; 
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './components/login.js';
import Signup from './components/Signup.js';
import CustomerHome from './components/CustomerHome.js';
import Product from './components/Product.js';
import CartPage from './components/CartPage.js';
import CustomerProfile from './components/CustomerProfile.js';
import AdminDashboard from './components/AdminDashboard';
import ManageProducts from './components/ManageProducts';
import AddProduct from './components/AddProduct';
import ManageCoupons from './components/ManageCoupons';
import SetDiscount from './components/SetDiscount';          
import RiderHome from './components/RiderHome';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<CustomerHome />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<CustomerProfile />} />
        {/* Add other routes as needed */}
        <Route path="/product" element={<Product />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />}>
          <Route path="products" element={<ManageProducts />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="coupons" element={<ManageCoupons />} />
          <Route path="set-discount" element={<SetDiscount />} />
        </Route>
        <Route path="/rider/home" element={<RiderHome />} />
      </Routes>
    </Router>
  );
}

export default App;
