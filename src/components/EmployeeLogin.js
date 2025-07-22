import axios from "axios";
import "./Login.css";
import React, { useState, useRef } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const EmployeeLogin = ({ onLogin, onBack }) => {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const idInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/employee-login`, { employeeId });
      if (res.data.role === "employee") {
        onLogin(res.data.role, res.data.name);
      } else {
        setError("❌ Invalid ID or password.");
        if (idInputRef.current) idInputRef.current.focus();
      }
    } catch (err) {
      setError(err.response?.data?.error || "❌ Error connecting to the server.");
      if (idInputRef.current) idInputRef.current.focus();
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <h2>Employee Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={idInputRef}
            type="text"
            placeholder="Enter your Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
            required
          />
          <button type="submit">Login</button>
          <button type="button" className="back-button" onClick={onBack}>Go Back</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default EmployeeLogin;
