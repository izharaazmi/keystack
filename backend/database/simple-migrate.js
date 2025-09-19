import {sequelize} from '../src/config/database.js';

async function simpleMigrate() {
	try {
		console.log('🔄 Running simple migration...');

		// Test database connection
		await sequelize.authenticate();
		console.log('✅ Database connection established');

		// Create projects table
		console.log('📝 Creating projects table...');
		await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cp_projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        created_by_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_name (name),
        INDEX idx_created_by_id (created_by_id),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at)
      )
    `);
		console.log('✅ Projects table created');

		// Add project_id column to credentials
		console.log('📝 Adding project_id column to credentials...');
		try {
			await sequelize.query(`
        ALTER TABLE cp_credentials 
        ADD COLUMN project_id INT NULL AFTER description
      `);
			console.log('✅ project_id column added');
		} catch (error) {
			if (error.message.includes('Duplicate column name')) {
				console.log('ℹ️ project_id column already exists');
			} else {
				throw error;
			}
		}

		// Add index for project_id
		console.log('📝 Adding index for project_id...');
		try {
			await sequelize.query(`
        ALTER TABLE cp_credentials 
        ADD INDEX idx_project_id (project_id)
      `);
			console.log('✅ Index added');
		} catch (error) {
			if (error.message.includes('Duplicate key name')) {
				console.log('ℹ️ Index already exists');
			} else {
				throw error;
			}
		}

		// Add foreign key for project_id
		console.log('📝 Adding foreign key for project_id...');
		try {
			await sequelize.query(`
        ALTER TABLE cp_credentials 
        ADD FOREIGN KEY (project_id) REFERENCES cp_projects(id) ON DELETE SET NULL
      `);
			console.log('✅ Foreign key added');
		} catch (error) {
			if (error.message.includes('Duplicate key name')) {
				console.log('ℹ️ Foreign key already exists');
			} else {
				throw error;
			}
		}

		// Create schema version table
		console.log('📝 Creating schema version table...');
		await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cp_schema_version (
        version VARCHAR(20) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);
		console.log('✅ Schema version table created');

		// Record migration
		console.log('📝 Recording migration...');
		await sequelize.query(`
      INSERT IGNORE INTO cp_schema_version (version, description) 
      VALUES ('1.0.1', 'Add projects table and migrate credentials to use project_id foreign key')
    `);
		console.log('✅ Migration recorded');

		console.log('🎉 Simple migration completed successfully!');

	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

simpleMigrate();
