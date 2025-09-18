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
	urlPattern: {
		type: DataTypes.STRING,
		allowNull: true,
		field: 'url_pattern'
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
	project: {
		type: DataTypes.STRING,
		defaultValue: 'default'
	},
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
		field: 'is_active'
	},
	createdById: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'created_by_id',
		references: {
			model: 'cp_users',
			key: 'id'
		}
	},
	accessType: {
		type: DataTypes.ENUM('individual', 'group', 'all'),
		defaultValue: 'individual',
		field: 'access_type'
	},
	lastUsed: {
		type: DataTypes.DATE,
		allowNull: true,
		field: 'last_used'
	},
	useCount: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		field: 'use_count'
	}
}, {
	tableName: 'cp_credentials'
});

export default Credential;
