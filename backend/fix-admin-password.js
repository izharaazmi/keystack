import { connectDB, sequelize } from './src/config/database.js';
import { User } from './src/models/index.js';
import bcrypt from 'bcryptjs';

const fixAdminPassword = async () => {
  try {
    await connectDB();
    
    // Hash the password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password directly in the database to bypass hooks
    await sequelize.query(
      'UPDATE cp_users SET password = ? WHERE email = ?',
      {
        replacements: [hashedPassword, 'admin@chromepass.com']
      }
    );
    
    console.log('✅ Admin password fixed successfully!');
    console.log('Email: admin@chromepass.com');
    console.log('Password: admin123');
    
    // Verify the password works
    const admin = await User.findOne({ where: { email: 'admin@chromepass.com' } });
    const isPasswordValid = await bcrypt.compare('admin123', admin.password);
    console.log('Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

fixAdminPassword();
