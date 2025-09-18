const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CredentialUser = sequelize.define('CredentialUser', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'credential_users',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['credential_id', 'user_id']
    }
  ]
});

module.exports = CredentialUser;
