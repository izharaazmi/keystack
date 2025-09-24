import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const ProjectGroup = sequelize.define('ProjectGroup', {
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
	tableName: 'cp_project_groups',
	timestamps: false,
	indexes: [
		{
			unique: true,
			fields: ['project_id', 'group_id']
		},
		{
			fields: ['project_id']
		},
		{
			fields: ['group_id']
		}
	]
});

export default ProjectGroup;
