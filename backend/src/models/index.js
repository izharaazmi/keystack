const User = require('./User');
const Credential = require('./Credential');
const Group = require('./Group');
const UserGroup = require('./UserGroup');
const CredentialUser = require('./CredentialUser');
const CredentialGroup = require('./CredentialGroup');

// Define associations
User.belongsToMany(Group, { through: UserGroup, foreignKey: 'userId', otherKey: 'groupId' });
Group.belongsToMany(User, { through: UserGroup, foreignKey: 'groupId', otherKey: 'userId' });

Credential.belongsToMany(User, { through: CredentialUser, foreignKey: 'credentialId', otherKey: 'userId' });
User.belongsToMany(Credential, { through: CredentialUser, foreignKey: 'userId', otherKey: 'credentialId' });

Credential.belongsToMany(Group, { through: CredentialGroup, foreignKey: 'credentialId', otherKey: 'groupId' });
Group.belongsToMany(Credential, { through: CredentialGroup, foreignKey: 'groupId', otherKey: 'credentialId' });

// Creator relationships
User.hasMany(Credential, { foreignKey: 'createdById', as: 'createdCredentials' });
Credential.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(Group, { foreignKey: 'createdById', as: 'createdGroups' });
Group.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = {
  User,
  Credential,
  Group,
  UserGroup,
  CredentialUser,
  CredentialGroup
};
