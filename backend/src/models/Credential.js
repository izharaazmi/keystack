import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const Credential = sequelize.define('Credential', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	label: {
		type: DataTypes.STRING,
		allowNull: false
	},
	url: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			isUrl: true
		}
	},
	url_pattern: {
		type: DataTypes.STRING,
		allowNull: true
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	project_id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: {
			model: 'cp_projects',
			key: 'id'
		}
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	},
	created_by_id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: {
			model: 'cp_users',
			key: 'id'
		}
	},
	last_used: {
		type: DataTypes.DATE,
		allowNull: true
	},
	use_count: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	}
}, {
	tableName: 'cp_credentials'
});

export default Credential;
