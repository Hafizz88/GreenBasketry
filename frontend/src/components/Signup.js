import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    vehicle_info: ''
  });

  const navigate = useNavigate();

  // ✅ Define handleChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async () => {
    const { name, email, password, phone, role, vehicle_info } = formData;
    const body = role === 'rider'
      ? { name, email, password, phone, role, vehicle_info }
      : { name, email, password, phone, role };

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
});

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        localStorage.setItem('userId', data.user[`${role}_id`]);
        localStorage.setItem('role', role);
        navigate('/product'); // Redirect to product page
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Signup failed. Server might be down.');
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h2>Signup</h2>
      <input
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
      />
      <input
        name="phone"
        placeholder="Phone"
        value={formData.phone}
        onChange={handleChange}
      />
      <select name="role" value={formData.role} onChange={handleChange}>
        <option value="admin">Admin</option>
        <option value="customer">Customer</option>
        <option value="rider">Rider</option>
      </select>
      {formData.role === 'rider' && (
        <input
          name="vehicle_info"
          placeholder="Vehicle Info"
          value={formData.vehicle_info}
          onChange={handleChange}
        />
      )}
      <button onClick={handleSignup}>Signup</button>
      <p>Already have an account? <Link to="/">Login</Link></p>
    </div>
  );
}

export default Signup;
