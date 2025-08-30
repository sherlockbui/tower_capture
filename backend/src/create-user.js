const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createUser(username, password, role = 'user') {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      console.log(`User '${username}' already exists`);
      process.exit(0);
    }

    // Create new user
    const newUser = new User({
      username,
      passwordHash: password,
      role
    });

    await newUser.save();
    console.log(`User '${username}' created successfully with role '${role}'`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node create-user.js <username> <password> [role]');
  console.log('Example: node create-user.js john password123 user');
  console.log('Example: node create-user.js admin admin123 admin');
  process.exit(1);
}

const username = args[0];
const password = args[1];
const role = args[2] || 'user';

if (!['user', 'admin'].includes(role)) {
  console.log('Role must be either "user" or "admin"');
  process.exit(1);
}

createUser(username, password, role);
