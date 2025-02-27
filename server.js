const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const json2csv = require('json2csv').parse;
const fs = require('fs');

const server = express();
server.use(bodyParser.json());
server.use(cors({ origin: 'http://localhost:3000' })); // Allow frontend requests

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Wdsawd123', // Use .env in production
  database: 'inventory_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL database.');
});

// 🚀 Create Tables if Not Exists
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'employee', 'supervisor') NOT NULL,
    password VARCHAR(255) NOT NULL
  );
`);

db.query(`
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
`);

db.query(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user VARCHAR(100),
    action TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// 🚀 Log User Actions
const logActivity = (user, action) => {
  db.query(`INSERT INTO activity_logs (user, action) VALUES (?, ?)`, [user, action]);
};

// 🚀 Register User (Hashed Passwords)
server.post('/add-user', async (req, res) => {
  const { name, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(`INSERT INTO users (name, role, password) VALUES (?, ?, ?)`, [name, role, hashedPassword], (err) => {
    if (err) res.status(500).send('Database error');
    else res.status(200).send('User added successfully');
  });
});

// 🚀 Login User
server.post('/login', (req, res) => {
  const { name, password } = req.body;
  
  db.query('SELECT role, password FROM users WHERE LOWER(name) = LOWER(?)', [name], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(401).json({ role: null });

    bcrypt.compare(password, results[0].password, (err, isMatch) => {
      if (err) return res.status(500).send('Error checking password');
      res.status(200).json({ role: isMatch ? results[0].role : null });
    });
  });
});

// 🚀 Add Product
server.post('/add-product', (req, res) => {
  const { article, description, date_acquired, property_number, unit, unit_value, balance_per_card, on_hand_per_count, total_amount, actual_user, remarks } = req.body;
  
  const query = `
    INSERT INTO products (article, description, date_acquired, property_number, unit, unit_value, balance_per_card, on_hand_per_count, total_amount, actual_user, remarks) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [article, description, date_acquired || null, property_number, unit, unit_value, balance_per_card, on_hand_per_count, total_amount, actual_user, remarks], 
    (err) => {
      if (err) return res.status(500).send('Database error');
      logActivity(actual_user, `Added product: ${article}`);
      res.status(200).send('Product added successfully');
    }
  );
});

// 🚀 Update Product
server.put('/update-product/:id', (req, res) => {
  const productId = req.params.id;
  const { article, description, date_acquired, property_number, unit, unit_value, balance_per_card, on_hand_per_count, total_amount, actual_user, remarks } = req.body;

  const query = `
    UPDATE products SET
      article = ?, description = ?, date_acquired = ?, property_number = ?, unit = ?, 
      unit_value = ?, balance_per_card = ?, on_hand_per_count = ?, total_amount = ?, 
      actual_user = ?, remarks = ?
    WHERE id = ?
  `;

  db.query(query, [article, description, date_acquired, property_number, unit, unit_value, balance_per_card, on_hand_per_count, total_amount, actual_user, remarks, productId], 
    (err) => {
      if (err) return res.status(500).send('Database error');
      logActivity(actual_user, `Updated product: ${article}`);
      res.status(200).send('Product updated successfully');
    }
  );
});

// 🚀 Delete Product
server.delete('/delete-product/:id', (req, res) => {
  const productId = req.params.id;

  db.query('SELECT article, actual_user FROM products WHERE id = ?', [productId], (err, results) => {
    if (err || results.length === 0) return res.status(500).send('Database error');

    const { article, actual_user } = results[0];
    db.query('DELETE FROM products WHERE id = ?', [productId], (err) => {
      if (err) return res.status(500).send('Database error');
      logActivity(actual_user, `Deleted product: ${article}`);
      res.status(200).send('Product deleted successfully');
    });
  });
});

// 🚀 Get Products (All)
server.get('/get-products/all', (req, res) => {
  db.query(`SELECT * FROM products`, (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.status(200).json(results);
  });
});

// 🚀 Get Products by User
server.get('/get-products/:actual_user', (req, res) => {
  const actual_user = decodeURIComponent(req.params.actual_user).toLowerCase();
  
  db.query(`SELECT * FROM products WHERE LOWER(actual_user) = ?`, [actual_user], (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.status(200).json(results);
  });
});

// 🚀 Get Users for Dropdown
server.get('/get-users', (req, res) => {
  db.query('SELECT id, name FROM users', (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.status(200).json(results);
  });
});

// 🚀 Get Activity Logs
server.get('/get-logs', (req, res) => {
  db.query(`SELECT * FROM activity_logs ORDER BY timestamp DESC`, (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.status(200).json(results);
  });
});

// 🚀 Export CSV
server.get('/export-csv', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).send('Database error');

    const csv = json2csv(results);
    fs.writeFileSync('inventory.csv', csv);
    res.download('inventory.csv');
  });
});

// 🚀 Start Express Server
server.listen(5000, () => {
  console.log('🚀 Express server running on port 5000');
});
