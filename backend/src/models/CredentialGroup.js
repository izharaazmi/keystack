const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CredentialGroup = sequelize.define('CredentialGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  credentialId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'credential_id',
    references: {
      model: 'credentials',
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
  tableName: 'credential_groups',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['credential_id', 'group_id']
    }
  ]
});

module.exports = CredentialGroup;
