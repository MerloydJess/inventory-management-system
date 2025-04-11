import React, { useState } from "react";
import SupervisorArticles from "./SupervisorArticles";
import SupervisorReceipts from "./SupervisorReceipts";
import "./SupervisorPanel.css";

const SupervisorPanel = () => {
  const [view, setView] = useState("articles");

  return (
    <div className="supervisor-panel">
      <div className="switch-buttons">
        <button 
          className={view === "articles" ? "active" : ""} 
          onClick={() => setView("articles")}
        >
          View Articles
        </button>
        <button 
          className={view === "receipts" ? "active" : ""} 
          onClick={() => setView("receipts")}
        >
          View Receipts
        </button>
      </div>

      {view === "articles" ? <SupervisorArticles /> : <SupervisorReceipts />}
    </div>
  );
};

export default SupervisorPanel;
