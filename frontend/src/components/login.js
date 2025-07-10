import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      let url = '';
      let body;

      if (role === 'admin') {
        url = 'http://localhost:5000/api/auth/admin/login';
        body = { email, password };
      } else {
        url = 'http://localhost:5000/api/auth/login';
        body = { email, password, role };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        let userId;
  if (role === 'admin') {
    userId = data.user?.admin_id;
  } else if (role === 'rider') {
    userId = data.user?.rider_id;
  } else {
    userId = data.user?.customer_id;
  }

        // Create user object with available data
        const userObject = {
          email: email,
          role: role
        };
        localStorage.setItem('token', data.token); // Store the token
        localStorage.setItem('user', JSON.stringify(userObject));
        localStorage.setItem('role', role);
        localStorage.setItem('userId', userId); // Use data.userId instead

        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'rider') {
          navigate('/rider/home');
        } else {
          navigate('/home');
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Login failed. Server might be down.');
      console.error(err);
    }
  }; // ← Make sure this closing brace is here

  return (
    <div className="container">
      <h2>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      
      <input 
        placeholder="E-mail" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="admin">Admin</option>
        <option value="customer">Customer</option>
        <option value="rider">Rider</option>
      </select>
      
      <button onClick={handleLogin}>Login</button>
      
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;