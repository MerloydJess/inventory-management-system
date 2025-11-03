import React, { useState } from "react";
import SupervisorArticles from "./SupervisorArticles";
import SupervisorReceipts from "./SupervisorReceipts";
import SupervisorReports from "./SupervisorReports";
import SupervisorDashboard from "./SupervisorDashboard";
import "./SupervisorPanel.css";

const SupervisorPanel = ({ userName }) => {
  const [view, setView] = useState("dashboard");

  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <div className="supervisor-panel">
      <div className="switch-buttons">
        <button 
          className={view === "dashboard" ? "active" : ""} 
          onClick={() => setView("dashboard")}
        >
          <i className="fas fa-tachometer-alt"></i>
          Dashboard
        </button>
        <button 
          className={view === "articles" ? "active" : ""} 
          onClick={() => setView("articles")}
        >
          <i className="fas fa-boxes"></i>
          View Articles
        </button>
        <button 
          className={view === "receipts" ? "active" : ""} 
          onClick={() => setView("receipts")}
        >
          <i className="fas fa-receipt"></i>
          View Returns
        </button>
        <button 
          className={view === "reports" ? "active" : ""} 
          onClick={() => setView("reports")}
        >
          <i className="fas fa-chart-bar"></i>
          Generate Reports
        </button>
      </div>

      <div className="panel-content">
        {view === "dashboard" ? (
          <SupervisorDashboard userName={userName} onNavigate={handleViewChange} />
        ) : view === "articles" ? (
          <SupervisorArticles />
        ) : view === "receipts" ? (
          <SupervisorReceipts />
        ) : view === "reports" ? (
          <SupervisorReports />
        ) : (
          <SupervisorDashboard userName={userName} onNavigate={handleViewChange} />
        )}
      </div>
    </div>
  );
};

export default SupervisorPanel;
