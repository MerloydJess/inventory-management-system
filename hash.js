const bcrypt = require('bcryptjs');

const password = 'password123';  // Password we want to hash

bcrypt.hash(password, 10, (err, hashedPassword) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('New Hash:', hashedPassword);
  }
});
