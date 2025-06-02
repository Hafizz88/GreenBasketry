import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // This is a mock for now. Replace with real backend API later
    if (username && password) {
      localStorage.setItem("role", role);
      navigate("/dashboard");
    } else {
      alert("Please enter credentials");
    }
  };

  return (
    <div className="login-container">
      <h2>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="rider">Rider</option>
        </select><br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
