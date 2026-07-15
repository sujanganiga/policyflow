require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const seed = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@policyflow.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email, role: 'admin' });
  if (existing) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }

  await User.create({
    name: 'System Admin',
    email,
    password,
    role: 'admin',
    isActive: true,
  });

  console.log('Admin user created successfully');
  console.log('Email:', email);
  console.log('Password:', password);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
