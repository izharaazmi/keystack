import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

const ProjectGroup = sequelize.define('ProjectGroup', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	project_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'cp_projects',
			key: 'id'
		}
	},
	group_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'cp_groups',
			key: 'id'
		}
	}
}, {
	tableName: 'cp_project_groups',
	timestamps: true,
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
