const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
      model: 'users',
      key: 'id'
    }
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'group_id',
    references: {
      model: 'groups',
      key: 'id'
    }
  }
}, {
  tableName: 'user_groups',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'group_id']
    }
  ]
});

module.exports = UserGroup;
