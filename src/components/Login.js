import axios from "axios";
import "./Login.css";
import React, { useState, useEffect, useRef } from "react";
import LoginSelector from "./LoginSelector";
import EmployeeLogin from "./EmployeeLogin";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Login = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState("");
  const nameInputRef = useRef(null);

  useEffect(() => {
    setName("");
    setPassword("");
    setError("");
    if (nameInputRef.current) nameInputRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { name, password });

      if (res.data.role) {
        onLogin(res.data.role, name);
      } else {
        setError("❌ Invalid name or password.");
        if (nameInputRef.current) nameInputRef.current.focus();
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "❌ Error connecting to the server.");
    }
  };

  if (!loginType) {
    return <LoginSelector onSelect={setLoginType} />;
  }
  if (loginType === "employee") {
    return <EmployeeLogin onLogin={onLogin} onBack={() => setLoginType("")} />;
  }

  return (
    <div className="login">
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Enter your admin name"
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
          <button type="button" className="back-button" onClick={() => setLoginType("")}>Go Back</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
