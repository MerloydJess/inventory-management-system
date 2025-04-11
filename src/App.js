import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminPanel from "./components/AdminPanel";
import EmployeePanel from "./components/EmployeePanel";
import SupervisorPanel from "./components/SupervisorPanel";
import Login from "./components/Login";
import ReturnsPanel from "./components/returnsPanel";
import "./App.css";
import EmployeeReceipts from "./components/EmployeeReceipts";
import EmployeeAddArticle from "./components/EmployeeAddArticle";
import EmployeeAddReturn from "./components/EmployeeAddReturn";


function App() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedUser = localStorage.getItem("userName");
    if (storedRole) setUserRole(storedRole);
    if (storedUser) setUserName(storedUser);
  }, []);

  const handleLogin = (role, user) => {
    setUserRole(role);
    setUserName(user);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", user);
  };

  const handleLogout = () => {
    setUserRole("");
    setUserName("");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/");
  };

  return (
    <>
      <div className="App">
        <header className="App-header">
          <h1 className="title">BTS Inventory</h1>
          {userRole && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </header>
      </div>
      <div className="content">
        <Routes>
          <Route
            path="/supervisor"
            element={userRole === "supervisor" ? <SupervisorPanel /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={
              userRole === "admin" ? (
                <AdminPanel />
              ) : userRole === "employee" ? (
                <EmployeePanel userName={userName} />
              ) : userRole === "supervisor" ? (
                <Navigate to="/supervisor" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route path="/employee-receipts" element={<EmployeeReceipts userName={userName} />} />
          <Route path="/returns-panel" element={<ReturnsPanel />} />
          <Route path="/add-article" element={<EmployeeAddArticle userName={userName} />} />
          <Route
            path="/admin"
            element={userRole === "admin" ? <AdminPanel /> : <Navigate to="/" />}
          />
          <Route
            path="/employee"
            element={userRole === "employee" ? <EmployeePanel userName={userName} /> : <Navigate to="/" />}
          />
          <Route
            path="/add-return"
            element={userRole === "employee" ? <EmployeeAddReturn userName={userName} /> : <Navigate to="/" />}
          />

        </Routes>
      </div>
    </>
  );
}

export default App;
