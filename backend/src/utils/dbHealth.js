import {sequelize} from '../config/database.js';

/**
 * Comprehensive database health check
 * Validates connection, table structure, and data integrity
 */
export const checkDatabaseHealth = async () => {
	const health = {
		status: 'healthy',
		checks: {
			connection: false,
			tables: false,
			schema: false,
			foreignKeys: false
		},
		errors: [],
		warnings: []
	};

	try {
		// 1. Test database connection
		await sequelize.authenticate();
		health.checks.connection = true;
	} catch (error) {
		health.status = 'unhealthy';
		health.errors.push(`Database connection failed: ${error.message}`);
		return health;
	}

	try {
		// 2. Check if all required tables exist
		const requiredTables = [
			'cp_schema_version',
			'cp_users',
			'cp_groups', 
			'cp_projects',
			'cp_credentials',
			'cp_user_groups',
			'cp_project_users',
			'cp_project_groups',
			'cp_credential_users',
			'cp_credential_groups'
		];

		const existingTables = await sequelize.getQueryInterface().showAllTables();
		const missingTables = requiredTables.filter(table => !existingTables.includes(table));

		if (missingTables.length > 0) {
			health.status = 'unhealthy';
			health.errors.push(`Missing required tables: ${missingTables.join(', ')}`);
		} else {
			health.checks.tables = true;
		}

		// 3. Check schema version
		try {
			const [schemaVersion] = await sequelize.query(
				'SELECT version FROM cp_schema_version ORDER BY applied_at DESC LIMIT 1'
			);
			
			if (schemaVersion.length === 0) {
				health.warnings.push('No schema version found - database may not be properly initialized');
			} else {
				health.checks.schema = true;
			}
		} catch (error) {
			health.warnings.push(`Schema version check failed: ${error.message}`);
		}

		// 4. Check foreign key constraints
		try {
			const [foreignKeys] = await sequelize.query(`
				SELECT 
					TABLE_NAME,
					COLUMN_NAME,
					CONSTRAINT_NAME,
					REFERENCED_TABLE_NAME,
					REFERENCED_COLUMN_NAME
				FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
				WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
				AND REFERENCED_TABLE_NAME IS NOT NULL
			`);

			if (foreignKeys.length === 0) {
				health.warnings.push('No foreign key constraints found - data integrity may be compromised');
			} else {
				health.checks.foreignKeys = true;
			}
		} catch (error) {
			health.warnings.push(`Foreign key check failed: ${error.message}`);
		}

		// 5. Check for admin user
		try {
			const [adminUsers] = await sequelize.query(
				'SELECT COUNT(*) as count FROM cp_users WHERE role = 1'
			);
			
			if (adminUsers[0].count === 0) {
				health.warnings.push('No admin users found - system may not be properly initialized');
			}
		} catch (error) {
			health.warnings.push(`Admin user check failed: ${error.message}`);
		}

	} catch (error) {
		health.status = 'unhealthy';
		health.errors.push(`Database health check failed: ${error.message}`);
	}

	return health;
};

/**
 * Quick database health check for health endpoint
 */
export const quickHealthCheck = async () => {
	try {
		await sequelize.authenticate();
		return {status: 'healthy', database: 'connected'};
	} catch (error) {
		return {status: 'unhealthy', database: 'disconnected', error: error.message};
	}
};
