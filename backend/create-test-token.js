import { sequelize } from './src/config/database.js';
import { User } from './src/models/index.js';
import jwt from 'jsonwebtoken';

async function createTestToken() {
  try {
    await sequelize.authenticate();
    
    // Find an admin user
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (admin) {
      const token = jwt.sign(
        { userId: admin.id, email: admin.email, role: admin.role },
        'chrome-pass-super-secret-jwt-key-2024',
        { expiresIn: '24h' }
      );
      console.log('Test token:', token);
    } else {
      console.log('No admin user found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestToken();
