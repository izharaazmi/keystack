import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const ProjectUser = sequelize.define('ProjectUser', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	projectId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'project_id',
		references: {
			model: 'cp_projects',
			key: 'id'
		}
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
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW
	}
}, {
	tableName: 'cp_project_users',
	timestamps: false,
	indexes: [
		{
			unique: true,
			fields: ['project_id', 'user_id']
		},
		{
			fields: ['project_id']
		},
		{
			fields: ['user_id']
		}
	]
});

export default ProjectUser;
