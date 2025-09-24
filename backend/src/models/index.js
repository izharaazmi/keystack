import Credential from './Credential.js';
import CredentialGroup from './CredentialGroup.js';
import CredentialUser from './CredentialUser.js';
import Group from './Group.js';
import Project from './Project.js';
import ProjectGroup from './ProjectGroup.js';
import ProjectUser from './ProjectUser.js';
import User from './User.js';
import UserGroup from './UserGroup.js';

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
Project.belongsToMany(User, {through: ProjectUser, foreignKey: 'projectId', otherKey: 'userId', as: 'Users'});
User.belongsToMany(Project, {through: ProjectUser, foreignKey: 'userId', otherKey: 'projectId', as: 'Projects'});

// Project-Group associations
Project.belongsToMany(Group, {through: ProjectGroup, foreignKey: 'projectId', otherKey: 'groupId', as: 'Groups'});
Group.belongsToMany(Project, {through: ProjectGroup, foreignKey: 'groupId', otherKey: 'projectId', as: 'Projects'});

// Add associations for junction tables
ProjectUser.belongsTo(User, {foreignKey: 'userId', as: 'User'});
ProjectUser.belongsTo(Project, {foreignKey: 'projectId', as: 'Project'});

ProjectGroup.belongsTo(Group, {foreignKey: 'groupId', as: 'Group'});
ProjectGroup.belongsTo(Project, {foreignKey: 'projectId', as: 'Project'});

CredentialUser.belongsTo(User, {foreignKey: 'userId', as: 'User'});
CredentialUser.belongsTo(Credential, {foreignKey: 'credentialId', as: 'Credential'});

CredentialGroup.belongsTo(Group, {foreignKey: 'groupId', as: 'Group'});
CredentialGroup.belongsTo(Credential, {foreignKey: 'credentialId', as: 'Credential'});

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
