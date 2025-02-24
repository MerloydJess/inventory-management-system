// src/components/Login.js
import axios from 'axios';
import './Login.css';
import React, { useState, useEffect } from 'react';


const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName('');
    setPassword('');
    setError('');
  }, []);
  

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/login', { name, password })
      .then(res => {
        if (res.data.role) {
          onLogin(res.data.role, name); // Pass name to App.js
        } else {
          setError('Invalid name or password.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Error connecting to the server.');
      });
  };

  return (
    <div className="login">
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
  );
};

export default Login;
