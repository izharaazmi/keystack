import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const Project = sequelize.define('Project', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	created_by_id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: {
			model: 'cp_users',
			key: 'id'
		}
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	}
}, {
	tableName: 'cp_projects'
});

export default Project;
