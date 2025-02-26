const { app, BrowserWindow } = require('electron');
const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

let mainWindow;

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',                // Your MySQL username
  password: '@Wdsawd123',   // Your MySQL password
  database: 'inventory_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});

// Express Server Setup
const server = express();
server.use(bodyParser.json());
server.use(cors({
  origin: 'http://localhost:3000'  // Allow React frontend
}));

// API Endpoint: Add Product
server.post('/add-product', (req, res) => {
  const { 
    article, 
    description, 
    date_acquired, 
    property_number, 
    unit, 
    unit_value, 
    balance_per_card, 
    on_hand_per_count, 
    total_amount, 
    actual_user, 
    remarks 
  } = req.body;
  
  const query = `
    INSERT INTO products (
      article, 
      description, 
      date_acquired, 
      property_number, 
      unit, 
      unit_value, 
      balance_per_card, 
      on_hand_per_count, 
      total_amount, 
      actual_user, 
      remarks
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Convert empty date to NULL
  const dateValue = date_acquired ? date_acquired : null;

  db.query(query, [
    article, 
    description, 
    dateValue, 
    property_number, 
    unit, 
    unit_value, 
    balance_per_card, 
    on_hand_per_count, 
    total_amount, 
    actual_user, 
    remarks
  ], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Database error');
    } else {
      res.status(200).send('Article added');
    }
  });
});

// Start Express Server FIRST


// Get Products for Logged-In User (Case-Insensitive Matching)
server.get('/get-products/:actual_user', (req, res) => {
  const actual_user = decodeURIComponent(req.params.actual_user).toLowerCase();
  console.log('Fetching Products for:', actual_user); // Debugging line
  
  const query = `SELECT * FROM products WHERE LOWER(actual_user) = ?`;

  db.query(query, [actual_user], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Database error');
    } else {
      console.log('Products Fetched:', results); // Debugging line
      res.status(200).json(results);
    }
  });
});


server.listen(5000, () => {
  console.log('Server running on port 5000');

  // Then Wait for Electron's app to be ready
  app.on('ready', createWindow);
});

// Create Electron BrowserWindow
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron App Events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Get Users for Dropdown
server.get('/get-users', (req, res) => {
  const query = 'SELECT id, name FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Database error');
    } else {
      res.status(200).json(results);
    }
  });
});

// API Endpoint: Add User (No Encryption for Testing)
server.post('/add-user', (req, res) => {
  const { name, role, password } = req.body;
  const query = `INSERT INTO users (name, role, password) VALUES (?, ?, ?)`;

  db.query(query, [name, role, password], (err, result) => {
    if (err) {
      console.error('Error adding user:', err);
      res.status(500).send('Database error');
    } else {
      res.status(200).send('User added');
    }
  });
});

// Ensure Tables Exist or Create Them

// Create users table if not exists
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'employee', 'supervisor') NOT NULL,
    password VARCHAR(255) NOT NULL
  );
`;

db.query(createUsersTable, (err) => {
  if (err) console.error('Error creating users table:', err);
  else console.log('Users table checked/created successfully.');
});

// Create products table if not exists
const createProductsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article VARCHAR(100) NOT NULL,
    description TEXT,
    date_acquired DATE NULL,
    property_number VARCHAR(50),
    unit VARCHAR(50),
    unit_value DECIMAL(10, 2) NOT NULL,
    balance_per_card INT,
    on_hand_per_count INT,
    total_amount DECIMAL(10, 2),
    actual_user VARCHAR(100),
    remarks TEXT
  );
`;

db.query(createProductsTable, (err) => {
  if (err) console.error('Error creating products table:', err);
  else console.log('Products table checked/created successfully.');
});

// Login and Verify Role with Plain Text Passwords
server.post('/login', (req, res) => {
  const name = req.body.name.trim();
  const password = req.body.password.trim();
  console.log('Login Attempt:', name, password); // Debug: Check inputs
  
  const query = 'SELECT role, password FROM users WHERE LOWER(name) = LOWER(?)';

  db.query(query, [name], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).send('Database error');
    } else if (results.length > 0) {
      const user = results[0];
      console.log('User Found:', user); // Debug: Check if user is found
      
      // Compare password as plain text or hash
if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
  // If it's a bcrypt hash, compare using bcrypt
  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) {
      console.error('Error checking password:', err);
      res.status(500).send('Error checking password');
    } else if (isMatch) {
      console.log('Password Matched (Hashed)!'); 
      res.status(200).json({ role: user.role });
    } else {
      console.log('Password Did Not Match (Hashed)');
      res.status(200).json({ role: null });
    }
  });
} else {
  // Compare as plain text
  if (password === user.password) {
    console.log('Password Matched (Plain Text)!');
    res.status(200).json({ role: user.role });
  } else {
    console.log('Password Did Not Match (Plain Text)');
    res.status(200).json({ role: null });
  }
}

    } else {
      console.log('No User Found');
      res.status(200).json({ role: null });
    }
  });
});

