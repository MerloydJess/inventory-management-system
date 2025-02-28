import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import EmployeePanel from "./components/EmployeePanel";
import Login from "./components/Login";
import ReturnsPanel from "./components/returnsPanel";
import "./App.css";
import EmployeeReceipts from "./components/EmployeeReceipts";

function App() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState(""); // Store logged-in user's name

  // ✅ Restore login state from localStorage on page refresh
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedUser = localStorage.getItem("userName");
    if (storedRole) setUserRole(storedRole);
    if (storedUser) setUserName(storedUser);
  }, []);

  const handleLogin = (role, user) => {
    setUserRole(role);
    setUserName(user);
    localStorage.setItem("userRole", role); // ✅ Store in localStorage
    localStorage.setItem("userName", user);
  };

  const handleLogout = () => {
    setUserRole("");
    setUserName("");
    localStorage.removeItem("userRole"); // ✅ Clear storage on logout
    localStorage.removeItem("userName");
    window.location.reload();
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Inventory Management System</h1>

          {/* ✅ Logout Button when logged in */}
          {userRole && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}

          <Routes>
            {/* ✅ Show Login if no userRole is set */}
            <Route path="/" element={
              userRole === "admin" ? <AdminPanel /> :
              userRole === "employee" || userRole === "supervisor" ? <EmployeePanel userName={userName} /> :
              <Login onLogin={handleLogin} />
            } />
            
            <Route path="/employee-receipts" element={<EmployeeReceipts userName={userName} />} />
            <Route path="/returns-panel" element={<ReturnsPanel />} />

            {/* ✅ Protect Employee & Admin Routes */}
            <Route path="/admin" element={userRole === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/employee" element={userRole === "employee" || userRole === "supervisor" ? <EmployeePanel userName={userName} /> : <Navigate to="/" />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
