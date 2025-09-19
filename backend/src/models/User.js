import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {DataTypes} from 'sequelize';
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
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
		validate: {
			min: 0,
			max: 10
		}
	},
	state: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		validate: {
			min: -2,
			max: 10
		}
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
User.prototype.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateEmailVerificationToken = function () {
	this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
	return this.emailVerificationToken;
};

// User state constants
User.STATES = {
	TRASHED: -2,    // User is trashed/deleted
	BLOCKED: -1,    // User is blocked/banned
	PENDING: 0,     // User is pending approval
	ACTIVE: 1,      // User is active and approved
	// Future states can be added here (2, 3, 4, etc.)
};

// User role constants
User.ROLES = {
	USER: 0,        // Regular user
	ADMIN: 1,       // Administrator
	// Future roles can be added here (2, 3, 4, etc.)
};

// Helper methods for state checking
User.prototype.isTrashed = function () {
	return this.state === User.STATES.TRASHED;
};

User.prototype.isBlocked = function () {
	return this.state === User.STATES.BLOCKED;
};

User.prototype.isPending = function () {
	return this.state === User.STATES.PENDING;
};

User.prototype.isActive = function () {
	return this.state === User.STATES.ACTIVE;
};

User.prototype.canLogin = function () {
	return this.state === User.STATES.ACTIVE;
};

// Helper methods for role checking
User.prototype.isUser = function () {
	return this.role === User.ROLES.USER;
};

User.prototype.isAdmin = function () {
	return this.role === User.ROLES.ADMIN;
};

// Keep role as integer for frontend
User.prototype.toJSON = function () {
	return {...this.dataValues};
};

export default User;
