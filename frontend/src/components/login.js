import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        navigate('/home'); // Redirect to the homepage after successful login
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
      <h2>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      <input
        placeholder="Username"
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
