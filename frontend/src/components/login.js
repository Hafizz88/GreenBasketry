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

        // Create user object with available data
        const userObject = {
          email: email,
          role: role
        };
        
        localStorage.setItem('user', JSON.stringify(userObject));
        localStorage.setItem('role', role);
        
        // Fix: Handle both userId and user object
        const userId = data.userId || data.user[`${role}_id`];
        localStorage.setItem('userId', userId);
        
        console.log('User ID saved:', userId);
        
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
  };

  return (
    <div className="container">
      <div className="login-form">
        <div className="role-indicator">{role}</div>
        <div className="form-content">
          <h2>Login</h2>
          
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
          
          <button onClick={handleLogin}>Sign In</button>
          
          <div className="link-container">
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;