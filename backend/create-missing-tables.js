import {sequelize} from './src/config/database.js';

async function createMissingTables() {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connected');

		// Create cp_user_groups table
		console.log('📝 Creating cp_user_groups table...');
		await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cp_user_groups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        group_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES cp_users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES cp_groups(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_group (user_id, group_id),
        INDEX idx_user_id (user_id),
        INDEX idx_group_id (group_id)
      )
    `);
		console.log('✅ cp_user_groups table created');

		// Create cp_credential_users table
		console.log('📝 Creating cp_credential_users table...');
		await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cp_credential_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        credential_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (credential_id) REFERENCES cp_credentials(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES cp_users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_credential_user (credential_id, user_id),
        INDEX idx_credential_id (credential_id),
        INDEX idx_user_id (user_id)
      )
    `);
		console.log('✅ cp_credential_users table created');

		// Check tables
		const [tables] = await sequelize.query('SHOW TABLES');
		console.log('\n📊 All tables in database:');
		tables.forEach(table => {
			console.log(`- ${Object.values(table)[0]}`);
		});

	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

createMissingTables();
