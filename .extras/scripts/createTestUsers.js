import dotenv from 'dotenv';
import {connectDB, sequelize} from '../config/database.js';
import {User} from '../models/index.js';

dotenv.config();

const testUsers = [
	{
		email: 'john.doe@company.com',
		password: 'password123',
		firstName: 'John',
		lastName: 'Doe',
		role: 'user'
	},
	{
		email: 'jane.smith@company.com',
		password: 'password123',
		firstName: 'Jane',
		lastName: 'Smith',
		role: 'user'
	},
	{
		email: 'mike.johnson@company.com',
		password: 'password123',
		firstName: 'Mike',
		lastName: 'Johnson',
		role: 'user'
	},
	{
		email: 'sarah.wilson@company.com',
		password: 'password123',
		firstName: 'Sarah',
		lastName: 'Wilson',
		role: 'user'
	},
	{
		email: 'david.brown@company.com',
		password: 'password123',
		firstName: 'David',
		lastName: 'Brown',
		role: 'user'
	}
];

const createTestUsers = async () => {
	try {
		await connectDB();
		console.log('Connected to database');

		for (const userData of testUsers) {
			const [user, created] = await User.findOrCreate({
				where: {email: userData.email},
				defaults: {
					...userData,
					isEmailVerified: true, // Skip email verification for test users
					isActive: true
				}
			});

			if (created) {
				console.log(`✅ Created user: ${user.email}`);
			} else {
				console.log(`⚠️  User already exists: ${user.email}`);
			}
		}

		console.log('\n🎉 Test users creation completed!');
		console.log('You can now:');
		console.log('1. Login to admin panel with admin@chromepass.com / admin123');
		console.log('2. View users at http://localhost:3000/users');
		console.log('3. Assign users to teams using the batch assignment feature');

	} catch (error) {
		console.error('Error creating test users:', error);
	} finally {
		await sequelize.close();
	}
};

createTestUsers();
