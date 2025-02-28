import React, { useState, useEffect } from "react";
import "./EmployeeReceipts.css"; // ✅ Import the CSS file



const EmployeeReceipts = ({ userName }) => {
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/get-receipts/${userName}`)
      .then(res => res.json())
      .then(data => setReceipts(data))
      .catch(err => console.error(err));
  }, [userName]);

  const filteredReceipts = receipts.filter(receipt =>
    receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    
    <div className="employee-receipts">
      <h2>My Assigned Receipts</h2>
      <input 
        type="text" 
        placeholder="Search receipts..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>ICS No.</th>
            <th>Date Acquired</th>
            <th>Amount</th>
            <th>Remarks</th>
            <th>Second Receiver (Optional)</th>
          </tr>
        </thead>
        <tbody>
  {filteredReceipts.map((receipt) => (
    <tr key={receipt.id}>
      <td>{receipt.description}</td>
      <td>{receipt.quantity}</td>
      <td>{receipt.ics_no}</td>
      <td>{receipt.date_acquired}</td>
      <td>{receipt.amount}</td>
      <td>{receipt.remarks}</td>
      <td>
        <u>{receipt.returned_by}</u>
        <br />
        {receipt.returned_by_position}
        <br />
        {receipt.returned_by_date}
      </td>
      <td>
        <u>{receipt.received_by}</u>
        <br />
        {receipt.received_by_position}
        <br />
        {receipt.received_by_date}
      </td>
      <td>
        {receipt.second_received_by ? ( // ✅ Only Show If Available
          <>
            <u>{receipt.second_received_by}</u>
            <br />
            {receipt.second_received_by_position}
            <br />
            {receipt.second_received_by_date}
          </>
        ) : (
          "N/A"
        )}
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
};

export default EmployeeReceipts;
