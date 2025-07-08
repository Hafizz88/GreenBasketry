import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    vehicle_info: '',
    address_line: '',
    thana_name: '',
    postal_code: ''
  });
  const [thanas, setThanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch thanas on mount
    const fetchThanas = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔄 Fetching thanas...");
        
        const res = await fetch('http://localhost:5000/api/thanas');
        console.log("📡 Response status:", res.status);
        console.log("📡 Response ok:", res.ok);
        
        const data = await res.json();
        console.log("📦 Raw response data:", data);
        
        if (res.ok) {
          // Handle different possible response structures
          let thanasArray = [];
          if (Array.isArray(data)) {
            thanasArray = data;
          } else if (data.thanas && Array.isArray(data.thanas)) {
            thanasArray = data.thanas;
          } else if (data.data && Array.isArray(data.data)) {
            thanasArray = data.data;
          }
          
          console.log("📦 Processed thanas array:", thanasArray);
          setThanas(thanasArray);
        } else {
          throw new Error(data.error || 'Failed to fetch thanas');
        }
      } catch (err) {
        console.error('❌ Failed to fetch thanas', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchThanas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async () => {
    const {
      name, email, password, phone, role,
      vehicle_info, address_line, thana_name, postal_code
    } = formData;

    // Build request body depending on role
    let body = { name, email, password, phone, role };

    if (role === 'rider') {
      body.vehicle_info = vehicle_info;
    } else if (role === 'customer') {
      // Add address info
      body.address_line = address_line;
      body.thana_name = thana_name;
      if (postal_code) body.postal_code = postal_code;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        // Note: localStorage not available in this demo
        console.log('Would navigate to /product');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Signup failed. Server might be down.');
      console.error(err);
    }
  };

  return (
    <div className="signup-container">
      <h2>Signup</h2>
      
      {/* Debug info */}

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

      <select 
        name="role" 
        value={formData.role} 
        onChange={handleChange}
      >
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

      {formData.role === 'customer' && (
        <>
          <input
            name="address_line"
            placeholder="Address Line"
            value={formData.address_line}
            onChange={handleChange}
          />
          
          <select
            name="thana_name"
            value={formData.thana_name}
            onChange={handleChange}
            required
          >
            <option value="">Select a Thana</option>
            {loading ? (
              <option value="">Loading thanas...</option>
            ) : error ? (
              <option value="">Error loading thanas</option>
            ) : thanas.length === 0 ? (
              <option value="">No thanas available</option>
            ) : (
              thanas.map((thana, index) => {
                // Handle different possible thana object structures
                const thanaName = thana.thana_name || thana.name || thana.title || thana;
                const thanaId = thana.id || thana._id || index;
                
                return (
                  <option key={thanaId} value={thanaName}>
                    {thanaName}
                  </option>
                );
              })
            )}
          </select>

          <input
            name="postal_code"
            placeholder="Postal Code (optional)"
            value={formData.postal_code}
            onChange={handleChange}
          />
        </>
      )}

      <button onClick={handleSignup}>Signup</button>
      
      <p>Already have an account? <a href="/">Login</a></p>
    </div>
  );
}

export default Signup;