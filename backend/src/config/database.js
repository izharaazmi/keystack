import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();


const sequelize = new Sequelize({
	dialect: 'mysql',
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 3306,
	database: process.env.DB_NAME || 'chrome_pass',
	username: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	logging: process.env.NODE_ENV === 'development' ? console.log : false,
	define: {
		timestamps: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	},
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	},
	timezone: '+00:00'
});

const connectDB = async () => {
	try {
		await sequelize.authenticate();
		console.log('MySQL database connected successfully');
		
		// Only sync if database doesn't exist (first run)
		// This prevents data loss on subsequent runs
		const tableExists = await sequelize.getQueryInterface().showAllTables();
		if (tableExists.length === 0) {
			console.log('Database is empty, creating tables...');
			await sequelize.sync();
			console.log('Database tables created');
		} else {
			console.log('Database already exists, skipping table creation');
		}
	} catch (error) {
		console.error('Database connection error:', error);
		process.exit(1);
	}
};

export {sequelize, connectDB};
