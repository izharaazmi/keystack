import {sequelize} from './src/config/database.js';

async function checkTables() {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connected');

		const [tables] = await sequelize.query('SHOW TABLES');
		console.log('📊 Tables in database:');
		tables.forEach(table => {
			console.log(`- ${Object.values(table)[0]}`);
		});

		// Check if cp_user_groups exists
		const [userGroupsTable] = await sequelize.query("SHOW TABLES LIKE 'cp_user_groups'");
		console.log('\n📊 cp_user_groups table exists:', userGroupsTable.length > 0);

		if (userGroupsTable.length > 0) {
			const [userGroups] = await sequelize.query('SELECT COUNT(*) as count FROM cp_user_groups');
			console.log('📊 Records in cp_user_groups:', userGroups[0].count);
		}

	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

checkTables();
