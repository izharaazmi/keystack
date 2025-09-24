import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const UserGroup = sequelize.define('UserGroup', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'user_id',
		references: {
			model: 'cp_users',
			key: 'id'
		}
	},
	groupId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'group_id',
		references: {
			model: 'cp_groups',
			key: 'id'
		}
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW
	}
}, {
	tableName: 'cp_user_groups',
	timestamps: false,
	indexes: [
		{
			unique: true,
			fields: ['user_id', 'group_id']
		}
	]
});

export default UserGroup;
