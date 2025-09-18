import { connectDB, sequelize } from './src/config/database.js';
import { User } from './src/models/index.js';
import bcrypt from 'bcryptjs';

const resetAdminPassword = async () => {
  try {
    await connectDB();
    
    // Find the admin user
    const admin = await User.findOne({ where: { email: 'admin@chromepass.com' } });
    if (!admin) {
      console.log('Admin user not found!');
      return;
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password
    await admin.update({ password: hashedPassword });
    
    console.log('✅ Admin password reset successfully!');
    console.log('Email: admin@chromepass.com');
    console.log('Password: admin123');
    
    // Verify the password works
    const isPasswordValid = await bcrypt.compare('admin123', admin.password);
    console.log('Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

resetAdminPassword();
