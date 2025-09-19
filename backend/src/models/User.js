import {DataTypes} from 'sequelize';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {sequelize} from '../config/database.js';

const User = sequelize.define('User', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true
		}
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			len: [6, 255]
		}
	},
	first_name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	last_name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	is_email_verified: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	email_verification_token: {
		type: DataTypes.STRING,
		allowNull: true
	},
	role: {
		type: DataTypes.ENUM('admin', 'user'),
		defaultValue: 'user'
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	},
	last_login: {
		type: DataTypes.DATE,
		allowNull: true
	}
}, {
	tableName: 'cp_users',
	hooks: {
		beforeCreate: async (user) => {
			if (user.password) {
				const salt = await bcrypt.genSalt(12);
				user.password = await bcrypt.hash(user.password, salt);
			}
		},
		beforeUpdate: async (user) => {
			if (user.changed('password')) {
				const salt = await bcrypt.genSalt(12);
				user.password = await bcrypt.hash(user.password, salt);
			}
		}
	}
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateEmailVerificationToken = function() {
	this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
	return this.emailVerificationToken;
};

export default User;
