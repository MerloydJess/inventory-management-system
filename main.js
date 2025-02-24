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
  const { name, unit_price, date_acquired, responsible_user } = req.body;
  const query = `INSERT INTO products (name, unit_price, date_acquired, responsible_user) VALUES (?, ?, ?, ?)`;

  db.query(query, [name, unit_price, date_acquired, responsible_user], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Database error');
    } else {
      res.status(200).send('Product added');
    }
  });
});

// Start Express Server FIRST
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

// Ensure Tables Exist or Create Them

// Create users table if not exists
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'employee', 'supervisor') NOT NULL
  );
`;

db.query(createUsersTable, (err) => {
  if (err) console.error('Error creating users table:', err);
  else console.log('Users table checked/created successfully.');
});

// Insert default users (if not exists)
const insertDefaultUsers = `
  INSERT IGNORE INTO users (id, name, role) VALUES
    (1, 'John Doe', 'admin'),
    (2, 'Jane Smith', 'employee'),
    (3, 'Mark Lee', 'supervisor');
`;

db.query(insertDefaultUsers, (err) => {
  if (err) console.error('Error inserting default users:', err);
  else console.log('Default users checked/added.');
});

// Create products table if not exists
const createProductsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    date_acquired DATE NOT NULL,
    responsible_user VARCHAR(100) NOT NULL
  );
`;

db.query(createProductsTable, (err) => {
  if (err) console.error('Error creating products table:', err);
  else console.log('Products table checked/created successfully.');
});

// API Endpoint: Add User with Password Hashing
server.post('/add-user', (req, res) => {
  const { name, role, password } = req.body;
  // Hash the password before saving
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error hashing password');
    } else {
      const query = `INSERT INTO users (name, role, password) VALUES (?, ?, ?)`;

      db.query(query, [name, role, hashedPassword], (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send('Database error');
        } else {
          res.status(200).send('User added');
        }
      });
    }
  });
});

// Login and Verify Role with Password
server.post('/login', (req, res) => {
  const { name, password } = req.body;
  console.log('Login Attempt:', name, password); // Debug: Check inputs
  
  const query = 'SELECT role, password FROM users WHERE name = ?';

  db.query(query, [name], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).send('Database error');
    } else if (results.length > 0) {
      const user = results[0];
      console.log('User Found:', user); // Debug: Check if user is found
      
      // Compare password with bcrypt
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error checking password:', err);
          res.status(500).send('Error checking password');
        } else if (isMatch) {
          console.log('Password Matched!'); // Debug: Check password match
          res.status(200).json({ role: user.role });
        } else {
          console.log('Password Did Not Match'); // Debug: Check password mismatch
          res.status(200).json({ role: null });
        }
      });
    } else {
      console.log('No User Found'); // Debug: Check if user not found
      res.status(200).json({ role: null });
    }
  });
});

// Get Products for Logged-In User
server.get('/get-products/:responsible_user', (req, res) => {
  const { responsible_user } = req.params;
  const query = `SELECT * FROM products WHERE responsible_user = ?`;

  db.query(query, [responsible_user], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Database error');
    } else {
      res.status(200).json(results);
    }
  });
});
