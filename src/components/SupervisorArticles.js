import axios from "axios";
import React, { useState, useEffect } from "react";
import "./SupervisorArticles.css";

const SupervisorArticles = () => {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products/all") // ✅ Fetch all products
      .then((res) => {
        console.log("✅ Fetched Products:", res.data);
        setArticles(res.data);
      })
      .catch((err) => console.error("❌ Error fetching products:", err));
  }, []);

  const filteredArticles = articles.filter((article) =>
    Object.values(article).some((value) =>
      value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="supervisor-articles">
      <h2>All Articles (Supervisor View)</h2>
      <input
        type="text"
        placeholder="Search by Article, Username, Property No., Date..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Description</th>
            <th>Property No.</th>
            <th>Unit</th>
            <th>Unit Value</th>
            <th>On Hand</th> {/* ✅ Added column */}
            <th>Balance</th> {/* ✅ Added column */}
            <th>Total Amount</th>
            <th>Actual User</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {filteredArticles.map((article, index) => (
            <tr key={index}>
              <td>{article.article}</td>
              <td>{article.description}</td>
              <td>{article.property_number}</td>
              <td>{article.unit}</td>
              <td>₱{parseFloat(article.unit_value).toFixed(2)}</td>
              <td>{article.on_hand_per_count ?? "N/A"}</td> {/* ✅ Fixed variable */}
              <td>{article.balance_per_card ?? "N/A"}</td> {/* ✅ Fixed variable */}
              <td>₱{parseFloat(article.total_amount).toFixed(2)}</td>
              <td>{article.actual_user}</td>
              <td>{article.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupervisorArticles;
