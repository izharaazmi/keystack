#!/usr/bin/env node

// Database setup script for Chrome Pass
// This script initializes the MySQL database with all tables and sample data

import dotenv from 'dotenv';
import fs from 'fs';
import mysql from 'mysql2/promise';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend directory
dotenv.config({path: path.join(__dirname, '../.env')});

const DB_CONFIG = {
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 3306,
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'chrome_pass'
};

// Debug: Show which credentials are being used
console.log('🔧 Database Configuration:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Port: ${DB_CONFIG.port}`);
console.log(`   User: ${DB_CONFIG.user}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log(`   Password: ${DB_CONFIG.password ? '***' : '(empty)'}`);
console.log('');

async function setupDatabase() {
	let connection;

	try {
		console.log('🚀 Starting Chrome Pass database setup...');

		// Connect to MySQL server (without database)
		const serverConnection = await mysql.createConnection({
			host: DB_CONFIG.host,
			port: DB_CONFIG.port,
			user: DB_CONFIG.user,
			password: DB_CONFIG.password
		});

		console.log('✅ Connected to MySQL server');

		// Create database if it doesn't exist
		await serverConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
		console.log(`✅ Database '${DB_CONFIG.database}' created/verified`);

		await serverConnection.end();

		// Connect to the specific database
		connection = await mysql.createConnection(DB_CONFIG);
		console.log(`✅ Connected to database '${DB_CONFIG.database}'`);

		// Read and execute the init.sql file
		const initSqlPath = path.join(__dirname, 'init.sql');
		const initSql = fs.readFileSync(initSqlPath, 'utf8');

		// Execute the entire SQL file at once
		console.log('📝 Executing SQL initialization script...');

		try {
			// Split by semicolon but handle multi-line statements better
			const statements = initSql
				.split(';')
				.map(stmt => stmt.trim())
				.filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

			console.log(`📝 Found ${statements.length} SQL statements...`);

			for (let i = 0; i < statements.length; i++) {
				const statement = statements[i];
				if (statement.trim()) {
					try {
						await connection.execute(statement);
						console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
					} catch (error) {
						console.error(`❌ Error in statement ${i + 1}:`, error.message);
						console.error('Statement:', statement.substring(0, 200) + '...');
						// Continue with other statements even if one fails
					}
				}
			}
		} catch (error) {
			console.error('❌ Error executing SQL:', error.message);
		}

		// Verify setup
		const [tables] = await connection.execute('SHOW TABLES');
		console.log(`\n📊 Database setup complete! Created ${tables.length} tables:`);
		tables.forEach(table => {
			console.log(`   - ${Object.values(table)[0]}`);
		});

		// Show sample data counts
		const [users] = await connection.execute('SELECT COUNT(*) as count FROM `cp_users`');
		const [groups] = await connection.execute('SELECT COUNT(*) as count FROM `cp_groups`');
		const [credentials] = await connection.execute('SELECT COUNT(*) as count FROM `cp_credentials`');

		console.log(`\n📈 Sample data loaded:`);
		console.log(`   - ${users[0].count} users`);
		console.log(`   - ${groups[0].count} groups`);
		console.log(`   - ${credentials[0].count} credentials`);

		console.log('\n🎉 Chrome Pass database setup completed successfully!');
		console.log('\n📋 Next steps:');
		console.log('1. Update your .env file with the correct MySQL credentials');
		console.log('2. Run: npm install (to install mysql2 dependency)');
		console.log('3. Run: npm run dev (to start the backend server)');
		console.log('4. Access admin panel at: http://localhost:3000');
		console.log('5. Login with: admin@chromepass.com / admin123');

	} catch (error) {
		console.error('❌ Database setup failed:', error.message);
		console.error('\n🔧 Troubleshooting:');
		console.error('1. Make sure MySQL is running');
		console.error('2. Check your database credentials in .env file');
		console.error('3. Ensure the database user has CREATE privileges');
		console.error('4. Verify MySQL version is 8.0 or higher');
		process.exit(1);
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}

// Run the setup
setupDatabase();
