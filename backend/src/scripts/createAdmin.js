import {connectDB} from '../config/database.js';
import {User} from '../models/index.js';
import bcrypt from 'bcryptjs';

const createAdminUser = async () => {
	try {
		await connectDB();
		
		// Check if admin already exists
		const existingAdmin = await User.findOne({where: {role: 'admin'}});
		if (existingAdmin) {
			console.log('Admin user already exists:', existingAdmin.email);
			process.exit(0);
		}
		
		// Create admin user
		const adminUser = await User.create({
			email: 'admin@chromepass.com',
			password: 'admin123',
			firstName: 'Admin',
			lastName: 'User',
			role: 'admin',
			isEmailVerified: true // Skip email verification for initial admin
		});
		
		console.log('✅ Admin user created successfully!');
		console.log('📧 Email: admin@chromepass.com');
		console.log('🔑 Password: admin123');
		console.log('⚠️  Please change the password after first login!');
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Error creating admin user:', error);
		process.exit(1);
	}
};

createAdminUser();
