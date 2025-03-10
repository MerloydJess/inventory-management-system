const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const json2csv = require("json2csv").parse;
const fs = require("fs");

const server = express();
server.use(bodyParser.json());
server.use(cors({ origin: "http://localhost:3000" })); // Allow frontend requests

// 🚀 MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Wdsawd123", // 🔒 Use .env in production
  database: "inventory_db",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
    return;
  }
  console.log("✅ Connected to MySQL database.");
  createTables(); // ✅ Auto-create tables on startup
});

// 🚀 Auto-Create Tables
const createTables = () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE,
      role ENUM('admin', 'employee', 'supervisor') NOT NULL,
      password VARCHAR(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      article VARCHAR(100) NOT NULL,
      description TEXT,
      date_acquired DATE NULL,
      property_number VARCHAR(50),
      unit VARCHAR(50),
      unit_value DECIMAL(10,2) NOT NULL,
      balance_per_card INT,
      on_hand_per_count INT,
      total_amount DECIMAL(10,2),
      actual_user VARCHAR(100),
      remarks TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS returns (
      id INT PRIMARY KEY AUTO_INCREMENT,
      rrsp_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      description VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      ics_no VARCHAR(100) NOT NULL,
      date_acquired DATE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      end_user VARCHAR(100) NOT NULL,
      remarks VARCHAR(255),
      returned_by VARCHAR(100) NOT NULL,
      returned_by_position VARCHAR(100) NOT NULL,
      returned_by_date DATE NOT NULL,
      received_by VARCHAR(100) NOT NULL,
      received_by_position VARCHAR(100) NOT NULL,
      received_by_date DATE NOT NULL,
      second_received_by VARCHAR(100) NULL,
      second_received_by_position VARCHAR(100) NULL,
      second_received_by_date DATE NULL
    )`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user VARCHAR(100),
      action TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  queries.forEach((query) => {
    db.query(query, (err) => {
      if (err) console.error("❌ Table creation error:", err);
    });
  });

  console.log("✅ All necessary tables checked/created.");
  insertSampleData();
};

// 🚀 Insert Sample Users if None Exist
const insertSampleData = async () => {
  db.query("SELECT COUNT(*) AS count FROM users", async (err, results) => {
    if (err) return console.error("❌ Error checking users table:", err);

    if (results[0].count === 0) {
      console.log("ℹ️ No users found, adding sample users...");
      const adminPassword = await bcrypt.hash("admin123", 10);
      const employeePassword = await bcrypt.hash("employee123", 10);

      db.query(
        `INSERT INTO users (name, role, password) VALUES 
        ('Admin', 'admin', ?), 
        ('John Doe', 'employee', ?)`,
        [adminPassword, employeePassword]
      );

      console.log("✅ Sample users added: Admin (admin123), Employee (employee123)");
    }
  });
};

// 🚀 Log User Actions
const logActivity = (user, action) => {
  db.query("INSERT INTO activity_logs (user, action) VALUES (?, ?)", [user, action]);
};

// 🚀 Register User
server.post("/add-user", async (req, res) => {
  console.log("Received Data:", req.body);
  const { name, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, role, password) VALUES (?, ?, ?)",
    [name, role, hashedPassword],
    (err) => {
      if (err) {
        console.error("❌ Error adding user:", err);
        return res.status(500).send("Database error");
      }
      res.status(200).send("✅ User added successfully");
    }
  );
});

// 🚀 Login User
server.post("/login", (req, res) => {
  const { name, password } = req.body;

  db.query("SELECT role, password FROM users WHERE LOWER(name) = LOWER(?)", [name], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.status(401).json({ role: null });

    bcrypt.compare(password, results[0].password, (err, isMatch) => {
      if (err) return res.status(500).send("Error checking password");
      res.status(200).json({ role: isMatch ? results[0].role : null });
    });
  });
});

// 🚀 Get Users for Dropdown
server.get("/get-users", (req, res) => {
  db.query("SELECT id, name FROM users", (err, results) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).send("Database error");
    }
    res.status(200).json(results);
  });
});

server.post("/add-receipt", (req, res) => {
  console.log("🔍 Incoming Data:", req.body); // ✅ Debugging

  const {
    rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks,
    returnedBy, receivedBy, secondReceivedBy
  } = req.body;

  if (
    !rrspNo || !date || !description || !quantity || !icsNo || !dateAcquired || !amount || !endUser ||
    !returnedBy.name || !returnedBy.position || !returnedBy.returnDate ||
    !receivedBy.name || !receivedBy.position || !receivedBy.receiveDate
  ) {
    console.error("❌ Missing Fields:", req.body);
    return res.status(400).json({ error: "Missing required fields", details: req.body });
  }

  const sql = `INSERT INTO returns (
      rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks, 
      returned_by, returned_by_position, returned_by_date, 
      received_by, received_by_position, received_by_date,
      second_received_by, second_received_by_position, second_received_by_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks || null,
    returnedBy.name, returnedBy.position, returnedBy.returnDate,
    receivedBy.name, receivedBy.position, receivedBy.receiveDate,
    secondReceivedBy?.name || null, secondReceivedBy?.position || null, secondReceivedBy?.receiveDate || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ SQL Error:", err.sqlMessage || err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }
    console.log("✅ Receipt added successfully!", result);
    res.status(200).json({ message: "✅ Receipt added successfully", result });
  });
});


server.post("/add-product", (req, res) => {
  console.log("🔍 Received Product Data:", req.body); // ✅ Check what data is coming

  const { article, description, date_acquired, property_number, unit, unit_value, 
          balance_per_card, on_hand_per_count, total_amount, actual_user, remarks } = req.body;

  // ✅ Check if required fields are missing
  if (!article || !unit || !unit_value || !actual_user) { 
    console.error("❌ Missing required fields:", req.body);
    return res.status(400).json({ error: "❌ Missing required fields!", details: req.body });
  }

  const sql = `INSERT INTO products (article, description, date_acquired, property_number, unit, unit_value, 
                                      balance_per_card, on_hand_per_count, total_amount, actual_user, remarks) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    article, description, date_acquired || null, property_number, unit, unit_value, 
    balance_per_card, on_hand_per_count, total_amount, actual_user, remarks || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Database Error:", err.sqlMessage || err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }

    console.log("✅ Product Added to Database:", result);
    res.status(200).json({ message: "✅ Product added successfully!", productId: result.insertId });
  });
});

server.get("/get-products/:user", (req, res) => {
  const actualUser = decodeURIComponent(req.params.user);
  console.log("🔍 Fetching products for:", actualUser); // ✅ Debugging

  const sql = `SELECT * FROM products WHERE actual_user = ? ORDER BY date_acquired DESC`;
  
  db.query(sql, [actualUser], (err, results) => {
    if (err) {
      console.error("❌ Database Error:", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }

    console.log("✅ Products Fetched for:", actualUser, results); // ✅ Debugging
    res.status(200).json(results);
  });
});



// 🚀 Get Receipts for Employee
server.get("/get-receipts/:endUser", (req, res) => {
  const endUser = decodeURIComponent(req.params.endUser);
  
  // ✅ Ensure the query fetches `returned_by`
  const sql = `SELECT rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks,
                      returned_by, returned_by_position, returned_by_date,
                      received_by, received_by_position, received_by_date,
                      second_received_by, second_received_by_position, second_received_by_date 
               FROM returns WHERE end_user = ?`;

  db.query(sql, [endUser], (err, results) => {
    if (err) {
      console.error("❌ Error fetching receipts:", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }

    console.log("✅ Fetched Receipts:", results); // ✅ Debugging log
    res.status(200).json(results);
  });
});


// 🚀 Start Express Server
server.listen(5000, () => {
  console.log("🚀 Express server running on port 5000");
});
