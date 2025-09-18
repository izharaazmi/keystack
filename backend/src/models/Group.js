import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const Group = sequelize.define('Group', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
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
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
		field: 'is_active'
	}
}, {
	tableName: 'cp_groups'
});

export default Group;
