const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
      model: 'users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'groups'
});

module.exports = Group;
