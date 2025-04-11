import axios from "axios";
import "./Login.css";
import React, { useState, useEffect } from "react";

const API_BASE_URL = process.env.NODE_ENV === "development" 
  ? "http://localhost:5000" 
  : "http://127.0.0.1:5000"; // ✅ Use dynamic URL

const Login = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName("");
    setPassword("");
    setError("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const res = await axios.post("http://localhost:5000/login", { name, password });

      if (res.data.role) {
        onLogin(res.data.role, name);
      } else {
        setError("❌ Invalid name or password.");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "❌ Error connecting to the server.");
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
