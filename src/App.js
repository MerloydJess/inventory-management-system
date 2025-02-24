// src/App.js
import React, { useState } from 'react';
import AdminPanel from './components/AdminPanel';
import EmployeePanel from './components/EmployeePanel';
import Login from './components/Login';
import './App.css';

function App() {
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');  // Store logged-in user's name

  const handleLogin = (role, user) => {
    setUserRole(role);
    setUserName(user);  // Store the name for later use
  };

  const handleLogout = () => {
    setUserRole('');
    setUserName('');
    window.location.reload();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Inventory Management System</h1>
        
        {!userRole && <Login onLogin={handleLogin} />}
        
        {userRole && (
          <div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        )}
        
        {userRole === 'admin' && <AdminPanel />}
        {userRole === 'employee' && <EmployeePanel userName={userName} />}
        {userRole === 'supervisor' && <EmployeePanel userName={userName} />}
      </header>
    </div>
  );
}

export default App;
