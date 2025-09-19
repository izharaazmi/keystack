import {sequelize} from './src/config/database.js';

async function testMigration() {
	try {
		console.log('🔍 Testing migration results...');

		// Test if projects table exists
		const [projectsTable] = await sequelize.query(
			"SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cp_projects'"
		);
		console.log(`📊 Projects table exists: ${projectsTable[0].count > 0 ? '✅' : '❌'}`);

		// Test if project_id column exists in credentials
		const [projectIdColumn] = await sequelize.query(
			"SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cp_credentials' AND COLUMN_NAME = 'project_id'"
		);
		console.log(`📊 project_id column exists: ${projectIdColumn[0].count > 0 ? '✅' : '❌'}`);

		// Test if schema version table exists
		const [schemaVersionTable] = await sequelize.query(
			"SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cp_schema_version'"
		);
		console.log(`📊 Schema version table exists: ${schemaVersionTable[0].count > 0 ? '✅' : '❌'}`);

		// Check schema version
		try {
			const [version] = await sequelize.query('SELECT version FROM cp_schema_version ORDER BY applied_at DESC LIMIT 1');
			console.log(`📊 Current schema version: ${version.length > 0 ? version[0].version : 'none'}`);
		} catch (error) {
			console.log('📊 Schema version: Not recorded');
		}

		// Test if we can query projects
		try {
			const [projects] = await sequelize.query('SELECT COUNT(*) as count FROM cp_projects');
			console.log(`📊 Projects count: ${projects[0].count}`);
		} catch (error) {
			console.log('❌ Error querying projects:', error.message);
		}

		// Test if we can query credentials with project_id
		try {
			const [credentials] = await sequelize.query('SELECT COUNT(*) as count FROM cp_credentials WHERE project_id IS NOT NULL');
			console.log(`📊 Credentials with project_id: ${credentials[0].count}`);
		} catch (error) {
			console.log('❌ Error querying credentials:', error.message);
		}

		console.log('✅ Migration test completed!');

	} catch (error) {
		console.error('❌ Migration test failed:', error);
	} finally {
		await sequelize.close();
	}
}

testMigration();
