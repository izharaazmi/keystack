import User from './User.js';
import Credential from './Credential.js';
import Group from './Group.js';
import Project from './Project.js';
import UserGroup from './UserGroup.js';
import CredentialUser from './CredentialUser.js';
import CredentialGroup from './CredentialGroup.js';
import ProjectUser from './ProjectUser.js';
import ProjectGroup from './ProjectGroup.js';

// Define associations
User.belongsToMany(Group, {through: UserGroup, foreignKey: 'userId', otherKey: 'groupId', as: 'Groups'});
Group.belongsToMany(User, {through: UserGroup, foreignKey: 'groupId', otherKey: 'userId', as: 'Users'});

Credential.belongsToMany(User, {through: CredentialUser, foreignKey: 'credentialId', otherKey: 'userId'});
User.belongsToMany(Credential, {through: CredentialUser, foreignKey: 'userId', otherKey: 'credentialId'});

Credential.belongsToMany(Group, {through: CredentialGroup, foreignKey: 'credentialId', otherKey: 'groupId'});
Group.belongsToMany(Credential, {through: CredentialGroup, foreignKey: 'groupId', otherKey: 'credentialId'});

// Creator relationships
User.hasMany(Credential, {foreignKey: 'created_by_id', as: 'createdCredentials'});
Credential.belongsTo(User, {foreignKey: 'created_by_id', as: 'createdBy'});

User.hasMany(Group, {foreignKey: 'created_by_id', as: 'createdGroups'});
Group.belongsTo(User, {foreignKey: 'created_by_id', as: 'createdBy'});

User.hasMany(Project, {foreignKey: 'created_by_id', as: 'createdProjects'});
Project.belongsTo(User, {foreignKey: 'created_by_id', as: 'createdBy'});

// Project relationships
Project.hasMany(Credential, {foreignKey: 'project_id', as: 'credentials'});
Credential.belongsTo(Project, {foreignKey: 'project_id', as: 'project'});

// Project-User associations
Project.belongsToMany(User, {through: ProjectUser, foreignKey: 'project_id', otherKey: 'user_id', as: 'Users'});
User.belongsToMany(Project, {through: ProjectUser, foreignKey: 'user_id', otherKey: 'project_id', as: 'Projects'});

// Project-Group associations
Project.belongsToMany(Group, {through: ProjectGroup, foreignKey: 'project_id', otherKey: 'group_id', as: 'Groups'});
Group.belongsToMany(Project, {through: ProjectGroup, foreignKey: 'group_id', otherKey: 'project_id', as: 'Projects'});

export {
	User,
	Credential,
	Group,
	Project,
	UserGroup,
	CredentialUser,
	CredentialGroup,
	ProjectUser,
	ProjectGroup
};
