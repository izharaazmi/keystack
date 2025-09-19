import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {sequelize} from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationRunner {
	constructor() {
		this.migrationsDir = path.join(__dirname, 'migrations');
	}

	async runMigrations() {
		try {
			console.log('🔄 Starting database migrations...');

			// Ensure schema version table exists
			await this.ensureSchemaVersionTable();

			// Get current schema version
			const currentVersion = await this.getCurrentSchemaVersion();
			console.log(`📊 Current schema version: ${currentVersion || 'none'}`);

			// Get available migrations
			const migrations = await this.getAvailableMigrations();
			console.log(`📁 Found ${migrations.length} migration files`);

			// Filter migrations that need to be applied
			const pendingMigrations = migrations.filter(migration =>
				!currentVersion || migration.version > currentVersion
			);

			if (pendingMigrations.length === 0) {
				console.log('✅ Database is up to date!');
				return;
			}

			console.log(`🚀 Applying ${pendingMigrations.length} pending migrations...`);

			// Apply each migration
			for (const migration of pendingMigrations) {
				await this.applyMigration(migration);
			}

			console.log('✅ All migrations completed successfully!');

		} catch (error) {
			console.error('❌ Migration failed:', error);
			throw error;
		}
	}

	async ensureSchemaVersionTable() {
		const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cp_schema_version (
        version VARCHAR(20) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `;

		await sequelize.query(createTableSQL);
	}

	async getCurrentSchemaVersion() {
		try {
			const [results] = await sequelize.query(
				'SELECT version FROM cp_schema_version ORDER BY applied_at DESC LIMIT 1'
			);
			return results.length > 0 ? results[0].version : null;
		} catch (error) {
			return null;
		}
	}

	async getAvailableMigrations() {
		const files = fs.readdirSync(this.migrationsDir)
			.filter(file => file.endsWith('.sql'))
			.sort();

		return files.map(file => {
			const match = file.match(/^(\d+)_(.+)\.sql$/);
			if (!match) {
				throw new Error(`Invalid migration file name: ${file}`);
			}

			return {
				file,
				version: match[1],
				name: match[2],
				path: path.join(this.migrationsDir, file)
			};
		});
	}

	async applyMigration(migration) {
		console.log(`📝 Applying migration ${migration.file}...`);

		try {
			const sql = fs.readFileSync(migration.path, 'utf8');

			// Split SQL into individual statements
			const statements = sql
				.split(';')
				.map(stmt => stmt.trim())
				.filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

			// Execute each statement
			for (const statement of statements) {
				if (statement.trim()) {
					await sequelize.query(statement);
				}
			}

			console.log(`✅ Migration ${migration.file} applied successfully`);

		} catch (error) {
			console.error(`❌ Failed to apply migration ${migration.file}:`, error);
			throw error;
		}
	}

	async checkSchemaVersion() {
		try {
			const version = await this.getCurrentSchemaVersion();
			console.log(`📊 Current database schema version: ${version || 'none'}`);
			return version;
		} catch (error) {
			console.error('❌ Failed to check schema version:', error);
			throw error;
		}
	}
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
	const command = process.argv[2];
	const migrationRunner = new MigrationRunner();

	switch (command) {
		case 'migrate':
			migrationRunner.runMigrations()
				.then(() => process.exit(0))
				.catch(() => process.exit(1));
			break;

		case 'version':
			migrationRunner.checkSchemaVersion()
				.then(() => process.exit(0))
				.catch(() => process.exit(1));
			break;

		default:
			console.log('Usage: node migrate.js [migrate|version]');
			console.log('  migrate - Run pending migrations');
			console.log('  version - Check current schema version');
			process.exit(1);
	}
}

export default MigrationRunner;
