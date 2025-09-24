import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
	try {
		
		// Read the migration file
		const migrationPath = path.join(__dirname, 'database/migrations/003_remove_updated_at_from_project_assignments.sql');
		const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
		
		// Execute the migration
		await sequelize.query(migrationSQL);
		
		
	} catch (error) {
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

runMigration();
