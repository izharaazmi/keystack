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
	firstName: {
		type: DataTypes.STRING,
		allowNull: false,
		field: 'first_name'
	},
	lastName: {
		type: DataTypes.STRING,
		allowNull: false,
		field: 'last_name'
	},
	isEmailVerified: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
		field: 'is_email_verified'
	},
	emailVerificationToken: {
		type: DataTypes.STRING,
		allowNull: true,
		field: 'email_verification_token'
	},
	role: {
		type: DataTypes.ENUM('admin', 'user'),
		defaultValue: 'user'
	},
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
		field: 'is_active'
	},
	lastLogin: {
		type: DataTypes.DATE,
		allowNull: true,
		field: 'last_login'
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
