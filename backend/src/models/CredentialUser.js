import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.js';

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
			model: 'cp_credentials',
			key: 'id'
		}
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'user_id',
		references: {
			model: 'cp_users',
			key: 'id'
		}
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW
	}
}, {
	tableName: 'cp_credential_users',
	timestamps: false,
	indexes: [
		{
			unique: true,
			fields: ['credential_id', 'user_id']
		}
	]
});

export default CredentialUser;
