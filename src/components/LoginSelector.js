import React, { useState } from "react";
import "./Login.css";

const LoginSelector = ({ onSelect }) => {
  const [selected, setSelected] = useState("");

  return (
    <div className="login-selector">
      <h2>Welcome! Please select your login type:</h2>
      <div className="login-selector-buttons">
        <button
          className={selected === "employee" ? "selected" : ""}
          onClick={() => { setSelected("employee"); onSelect("employee"); }}
        >
          Employee Login
        </button>
        <button
          className={selected === "admin" ? "selected" : ""}
          onClick={() => { setSelected("admin"); onSelect("admin"); }}
        >
          Admin Login
        </button>
      </div>
    </div>
  );
};

export default LoginSelector;
