import { connectDB, sequelize } from './src/config/database.js';
import { User } from './src/models/index.js';

const checkAdmin = async () => {
  try {
    await connectDB();
    const admin = await User.findOne({ where: { email: 'admin@chromepass.com' } });
    if (admin) {
      console.log('Admin user found:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Is Active:', admin.isActive);
      console.log('Is Email Verified:', admin.isEmailVerified);
      console.log('Password Hash:', admin.password.substring(0, 20) + '...');
      
      // Test password comparison
      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.default.compare('admin123', admin.password);
      console.log('Password "admin123" is valid:', isPasswordValid);
    } else {
      console.log('Admin user not found!');
    }
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkAdmin();
