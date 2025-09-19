import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ProjectUser = sequelize.define('ProjectUser', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cp_users',
      key: 'id'
    }
  }
}, {
  tableName: 'cp_project_users',
  timestamps: true,
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
