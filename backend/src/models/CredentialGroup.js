import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

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
			model: 'cp_credentials',
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
	}
}, {
	tableName: 'cp_credential_groups',
	timestamps: false,
	indexes: [
		{
			unique: true,
			fields: ['credential_id', 'group_id']
		}
	]
});

export default CredentialGroup;
