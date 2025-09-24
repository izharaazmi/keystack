import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import {Op} from 'sequelize';
import {auth} from '../middleware/auth.js';
import {User, Project, Credential, ProjectUser, CredentialUser, ProjectGroup, CredentialGroup, UserGroup, Group} from '../models/index.js';
import {sendVerificationEmail} from '../utils/email.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	role: Joi.string().valid('admin', 'user').optional()
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required()
});

// Register new user
router.post('/register', async (req, res) => {
	try {
		const {error, value} = registerSchema.validate(req.body);
		if (error) {
			return res.status(400).json({message: error.details[0].message});
		}

		const {email, password, first_name, last_name, role} = value;

		// Check if user already exists
		const existingUser = await User.findOne({where: {email}});
		if (existingUser) {
			return res.status(400).json({message: 'User already exists'});
		}

		// Check if this is the first user
		const userCount = await User.count();
		const isFirstUser = userCount === 0;

		// Determine the role to assign
		let assignedRole = 'user'; // Default role
		if (isFirstUser) {
			// First user is always admin, regardless of what's passed
			assignedRole = 'admin';
		} else if (role) {
			// Use the provided role (admin or user)
			assignedRole = role;
		}

		// Create new user
		const user = await User.create({
			email,
			password,
			first_name,
			last_name,
			role: assignedRole === 'admin' ? 1 : 0,
			is_email_verified: isFirstUser, // Skip email verification for first user
			state: isFirstUser ? 1 : 0 // First user is automatically active, others need approval
		});

		// Generate email verification token
		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		// Send verification email (fails silently if email not configured)
		try {
			await sendVerificationEmail(email, verificationToken);
		} catch (error) {
			// Email sending failed, but don't fail the registration
			console.warn('Email sending failed during registration:', error.message);
		}

		// Check if email is configured to provide appropriate message
		const emailConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

		res.status(201).json({
			message: isFirstUser
				? 'Admin user created successfully! You can now log in.'
				: assignedRole === 'admin'
					? emailConfigured
						? 'Admin user registered successfully. Please check your email for verification and wait for approval.'
						: 'Admin user registered successfully. Please wait for approval.'
					: emailConfigured
						? 'User registered successfully. Please check your email for verification and wait for admin approval.'
						: 'User registered successfully. Please wait for admin approval.',
			userId: user.id,
			isFirstUser,
			requiresApproval: !isFirstUser,
			emailConfigured
		});
	} catch (error) {
		res.status(500).json({message: 'Server error during registration'});
	}
});

// Login user
router.post('/login', async (req, res) => {
	try {
		const {error, value} = loginSchema.validate(req.body);
		if (error) {
			return res.status(400).json({message: error.details[0].message});
		}

		const {email, password} = value;

		// Find user
		const user = await User.findOne({where: {email}});
		if (!user) {
			return res.status(400).json({message: 'Invalid credentials'});
		}

		// Check if email is verified
		if (!user.is_email_verified) {
			return res.status(400).json({message: 'Please verify your email before logging in'});
		}

		// Check if account is active
		if (user.state !== 1) {
			return res.status(400).json({message: 'Account is not active'});
		}

		// Only allow admin users to login to backend
		if (user.role !== 1) {
			return res.status(403).json({message: 'Access denied. Only administrators can access the admin dashboard. Please use the Chrome extension to access your credentials.'});
		}

		// Compare password
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(400).json({message: 'Invalid credentials'});
		}

		// Update last login
		user.last_login = new Date();
		await user.save();

		// Generate JWT token
		const token = jwt.sign(
			{userId: user.id},
			process.env.JWT_SECRET,
			{expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
		);

		res.json({
			message: 'Login successful',
			token,
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role: user.role
			}
		});
	} catch (error) {
		res.status(500).json({message: 'Server error during login'});
	}
});

// Login for Chrome extension (allows both admin and user roles)
router.post('/extension-login', async (req, res) => {
	try {
		const {error, value} = loginSchema.validate(req.body);
		if (error) {
			return res.status(400).json({message: error.details[0].message});
		}

		const {email, password} = value;

		// Find user
		const user = await User.findOne({where: {email}});
		if (!user) {
			return res.status(400).json({message: 'Invalid credentials'});
		}

		// Check if email is verified
		if (!user.is_email_verified) {
			return res.status(400).json({message: 'Please verify your email before logging in'});
		}

		// Check if account is active
		if (user.state !== 1) {
			return res.status(400).json({message: 'Account is pending admin approval'});
		}

		// Compare password
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(400).json({message: 'Invalid credentials'});
		}

		// Update last login
		user.last_login = new Date();
		await user.save();

		// Generate JWT token
		const token = jwt.sign(
			{userId: user.id, email: user.email, role: user.role},
			process.env.JWT_SECRET,
			{expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
		);

		res.json({
			message: 'Login successful',
			token,
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role: user.role,
				state: user.state
			}
		});
	} catch (error) {
		res.status(500).json({message: 'Server error during login'});
	}
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
	try {
		const {token} = req.params;

		const user = await User.findOne({where: {emailVerificationToken: token}});
		if (!user) {
			return res.status(400).json({message: 'Invalid or expired verification token'});
		}

		user.is_email_verified = true;
		user.emailVerificationToken = null;
		await user.save();

		res.json({message: 'Email verified successfully'});
	} catch (error) {
		res.status(500).json({message: 'Server error during email verification'});
	}
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
	try {
		const {email} = req.body;

		if (!email) {
			return res.status(400).json({message: 'Email is required'});
		}

		const user = await User.findOne({where: {email}});
		if (!user) {
			return res.status(400).json({message: 'User not found'});
		}

		if (user.is_email_verified) {
			return res.status(400).json({message: 'Email already verified'});
		}

		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		await sendVerificationEmail(email, verificationToken);

		res.json({message: 'Verification email sent successfully'});
	} catch (error) {
		res.status(500).json({message: 'Server error during resend verification'});
	}
});

// Get current user
router.get('/me', auth, async (req, res) => {
	try {
		res.json({
			user: {
				id: req.user.id,
				email: req.user.email,
				first_name: req.user.first_name,
				last_name: req.user.last_name,
				role: req.user.role,
				is_email_verified: req.user.is_email_verified,
				created_at: req.user.created_at,
				last_login: req.user.last_login
			}
		});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
	try {
		const updateProfileSchema = Joi.object({
			first_name: Joi.string().optional(),
			last_name: Joi.string().optional(),
			email: Joi.string().email().optional(),
			current_password: Joi.string().optional(),
			new_password: Joi.string().min(6).optional(),
			confirm_password: Joi.string().valid(Joi.ref('new_password')).optional()
		});

		const {error, value} = updateProfileSchema.validate(req.body);
		if (error) {
			return res.status(400).json({message: error.details[0].message});
		}

		const {first_name, last_name, email, current_password, new_password, confirm_password} = value;

		// Get the current user with password for verification
		const user = await User.findByPk(req.user.id);
		if (!user) {
			return res.status(404).json({message: 'User not found'});
		}

		// If changing password, verify current password
		if (new_password) {
			if (!current_password) {
				return res.status(400).json({message: 'Current password is required to change password'});
			}

			const isCurrentPasswordValid = await user.comparePassword(current_password);
			if (!isCurrentPasswordValid) {
				return res.status(400).json({message: 'Current password is incorrect'});
			}
		}

		// Prepare update data
		const updateData = {};
		if (first_name !== undefined) updateData.first_name = first_name;
		if (last_name !== undefined) updateData.last_name = last_name;
		if (email !== undefined) updateData.email = email;
		if (new_password !== undefined) updateData.password = new_password;

		// If email is being changed, reset email verification
		if (email && email !== user.email) {
			updateData.is_email_verified = false;
			updateData.emailVerificationToken = user.generateEmailVerificationToken();
		}

		// Update the user
		await user.update(updateData);

		// Get updated user without password
		const updatedUser = await User.findByPk(req.user.id, {
			attributes: {exclude: ['password', 'emailVerificationToken']}
		});

		res.json({
			message: 'Profile updated successfully',
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				first_name: updatedUser.first_name,
				last_name: updatedUser.last_name,
				role: updatedUser.role,
				is_email_verified: updatedUser.is_email_verified
			}
		});
	} catch (error) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			res.status(400).json({message: 'Email already exists'});
		} else {
			res.status(500).json({message: 'Server error'});
		}
	}
});

// Get user's assigned projects and credentials
router.get('/me/assignments', auth, async (req, res) => {
	try {
		const userId = req.user.id;

		// Get user's groups
		let userGroups = [];
		let groupIds = [];
		try {
			userGroups = await UserGroup.findAll({
				where: {userId},
			});
			groupIds = userGroups.map(ug => ug.groupId);
		} catch (groupError) {
			// Continue without groups
		}

		// Get projects assigned to user directly
		const directProjectAssignments = await ProjectUser.findAll({
			where: {userId: userId},
			include: [
				{
					model: Project,
					as: 'Project',
					attributes: ['id', 'name', 'description', 'created_at'],
					include: [
						{
							model: User,
							as: 'createdBy',
							attributes: ['first_name', 'last_name', 'email']
						}
					]
				}
			]
		});

		// Get projects assigned to user via groups
		let groupProjectAssignments = [];
		if (groupIds.length > 0) {
			groupProjectAssignments = await ProjectGroup.findAll({
				where: {groupId: {[Op.in]: groupIds}},
				include: [
					{
						model: Project,
						as: 'Project',
						attributes: ['id', 'name', 'description', 'created_at'],
						include: [
							{
								model: User,
								as: 'createdBy',
								attributes: ['first_name', 'last_name', 'email']
							}
							]
					},
					{
						model: Group,
						as: 'Group',
						attributes: ['id', 'name']
					}
				]
			});
		}

		// Get credentials assigned to user directly
		const directCredentialAssignments = await CredentialUser.findAll({
			where: {userId},
			include: [
				{
					model: Credential,
					as: 'Credential',
					attributes: ['id', 'label', 'url', 'description', 'created_at', 'last_used', 'use_count'],
					include: [
						{
							model: User,
							as: 'createdBy',
							attributes: ['first_name', 'last_name', 'email']
						},
						{
							model: Project,
							as: 'project',
							attributes: ['id', 'name', 'description']
						}
					]
				}
			]
		});

		// Get credentials assigned to user via groups
		let groupCredentialAssignments = [];
		if (groupIds.length > 0) {
			groupCredentialAssignments = await CredentialGroup.findAll({
				where: {groupId: {[Op.in]: groupIds}},
				include: [
					{
						model: Credential,
						as: 'Credential',
						attributes: ['id', 'label', 'url', 'description', 'created_at', 'last_used', 'use_count'],
						include: [
							{
								model: User,
								as: 'createdBy',
								attributes: ['first_name', 'last_name', 'email']
							},
							{
								model: Project,
								as: 'project',
								attributes: ['id', 'name', 'description']
							}
						]
					},
					{
						model: Group,
						as: 'Group',
						attributes: ['id', 'name']
					}
				]
			});
		}

		// Format projects data
		const directProjects = directProjectAssignments.map(pa => ({
			...pa.Project.dataValues,
			assignmentType: 'direct',
			assignedAt: pa.created_at
		}));

		const groupProjects = groupProjectAssignments.map(pa => ({
			...pa.Project.dataValues,
			assignmentType: 'group',
			assignedVia: pa.Group.name,
			assignedAt: pa.created_at
		}));

		// Format credentials data
		const directCredentials = directCredentialAssignments.map(ca => ({
			...ca.Credential.dataValues,
			assignmentType: 'direct',
			assignedAt: ca.created_at
		}));

		const groupCredentials = groupCredentialAssignments.map(ca => ({
			...ca.Credential.dataValues,
			assignmentType: 'group',
			assignedVia: ca.Group.name,
			assignedAt: ca.created_at
		}));

		res.json({
			projects: [...directProjects, ...groupProjects],
			credentials: [...directCredentials, ...groupCredentials]
		});
	} catch (error) {
		res.status(500).json({message: 'Server error: ' + error.message});
	}
});

// Get user's teams
router.get('/me/teams', auth, async (req, res) => {
	try {
		const userId = req.user.id;

		// Get user's team memberships
		const userGroups = await UserGroup.findAll({
			where: {userId: userId},
			include: [
				{
					model: Group,
					as: 'Group',
					attributes: ['id', 'name', 'description', 'is_active', 'created_at']
				}
			]
		});

		// Format the response
		const teams = userGroups.map(ug => ({
			...ug.Group.dataValues,
			joinedAt: ug.created_at
		}));

		res.json({teams});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Leave a team
router.delete('/me/teams/:teamId', auth, async (req, res) => {
	try {
		const {teamId} = req.params;
		const userId = req.user.id;

		// Check if user is a member of this team
		const userGroup = await UserGroup.findOne({
			where: {userId: userId, groupId: teamId}
		});

		if (!userGroup) {
			return res.status(404).json({message: 'You are not a member of this team'});
		}

		// Remove the user from the team
		await userGroup.destroy();

		res.json({message: 'Successfully left the team'});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Remove user access from project
router.delete('/me/projects/:projectId', auth, async (req, res) => {
	try {
		const {projectId} = req.params;
		const userId = req.user.id;

		// Check if user has direct access to this project
		const projectUser = await ProjectUser.findOne({
			where: {projectId: projectId, userId: userId}
		});

		if (!projectUser) {
			return res.status(404).json({message: 'Project access not found'});
		}

		// Remove the access
		await projectUser.destroy();

		res.json({message: 'Project access removed successfully'});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Remove user access from credential
router.delete('/me/credentials/:credentialId', auth, async (req, res) => {
	try {
		const {credentialId} = req.params;
		const userId = req.user.id;

		// Check if user has direct access to this credential
		const credentialUser = await CredentialUser.findOne({
			where: {credentialId, userId}
		});

		if (!credentialUser) {
			return res.status(404).json({message: 'Credential access not found'});
		}

		// Remove the access
		await credentialUser.destroy();

		res.json({message: 'Credential access removed successfully'});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Get any user's assigned projects and credentials (admin only)
router.get('/users/:userId/assignments', auth, async (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 1) { // 1 = admin role
			return res.status(403).json({message: 'Admin access required'});
		}

		const {userId} = req.params;

		// Verify the target user exists
		const targetUser = await User.findByPk(userId);
		if (!targetUser) {
			return res.status(404).json({message: 'User not found'});
		}

		// Get user's groups
		const userGroups = await UserGroup.findAll({
			where: {userId},
		});
		const groupIds = userGroups.map(ug => ug.groupId);

		// Get projects assigned to user directly
		const directProjectAssignments = await ProjectUser.findAll({
			where: {userId: userId},
			include: [
				{
					model: Project,
					as: 'Project',
					attributes: ['id', 'name', 'description', 'created_at'],
					include: [
						{
							model: User,
							as: 'createdBy',
							attributes: ['first_name', 'last_name', 'email']
						}
					]
				}
			]
		});

		// Get projects assigned to user via groups
		let groupProjectAssignments = [];
		if (groupIds.length > 0) {
			groupProjectAssignments = await ProjectGroup.findAll({
				where: {groupId: {[Op.in]: groupIds}},
				include: [
					{
						model: Project,
						as: 'Project',
						attributes: ['id', 'name', 'description', 'created_at'],
						include: [
							{
								model: User,
								as: 'createdBy',
								attributes: ['first_name', 'last_name', 'email']
							}
							]
					},
					{
						model: Group,
						as: 'Group',
						attributes: ['id', 'name']
					}
				]
			});
		}

		// Get credentials assigned to user directly
		const directCredentialAssignments = await CredentialUser.findAll({
			where: {userId},
			include: [
				{
					model: Credential,
					as: 'Credential',
					attributes: ['id', 'label', 'url', 'description', 'created_at', 'last_used', 'use_count'],
					include: [
						{
							model: User,
							as: 'createdBy',
							attributes: ['first_name', 'last_name', 'email']
						},
						{
							model: Project,
							as: 'project',
							attributes: ['id', 'name', 'description']
						}
					]
				}
			]
		});

		// Get credentials assigned to user via groups
		let groupCredentialAssignments = [];
		if (groupIds.length > 0) {
			groupCredentialAssignments = await CredentialGroup.findAll({
				where: {groupId: {[Op.in]: groupIds}},
				include: [
					{
						model: Credential,
						as: 'Credential',
						attributes: ['id', 'label', 'url', 'description', 'created_at', 'last_used', 'use_count'],
						include: [
							{
								model: User,
								as: 'createdBy',
								attributes: ['first_name', 'last_name', 'email']
							},
							{
								model: Project,
								as: 'project',
								attributes: ['id', 'name', 'description']
							}
						]
					},
					{
						model: Group,
						as: 'Group',
						attributes: ['id', 'name']
					}
				]
			});
		}

		// Format projects data
		const directProjects = directProjectAssignments.map(pa => ({
			...pa.Project.dataValues,
			assignmentType: 'direct',
			assignedAt: pa.created_at
		}));

		const groupProjects = groupProjectAssignments.map(pa => ({
			...pa.Project.dataValues,
			assignmentType: 'group',
			assignedVia: pa.Group.name,
			assignedAt: pa.created_at
		}));

		// Format credentials data
		const directCredentials = directCredentialAssignments.map(ca => ({
			...ca.Credential.dataValues,
			assignmentType: 'direct',
			assignedAt: ca.created_at
		}));

		const groupCredentials = groupCredentialAssignments.map(ca => ({
			...ca.Credential.dataValues,
			assignmentType: 'group',
			assignedVia: ca.Group.name,
			assignedAt: ca.created_at
		}));

		res.json({
			user: {
				id: targetUser.id,
				first_name: targetUser.first_name,
				last_name: targetUser.last_name,
				email: targetUser.email
			},
			projects: [...directProjects, ...groupProjects],
			credentials: [...directCredentials, ...groupCredentials]
		});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Remove user access from project (admin only)
router.delete('/users/:userId/projects/:projectId', auth, async (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 1) { // 1 = admin role
			return res.status(403).json({message: 'Admin access required'});
		}

		const {userId, projectId} = req.params;

		// Check if user has direct access to this project
		const projectUser = await ProjectUser.findOne({
			where: {projectId: projectId, userId: userId}
		});

		if (!projectUser) {
			return res.status(404).json({message: 'Project access not found'});
		}

		// Remove the access
		await projectUser.destroy();

		res.json({message: 'Project access removed successfully'});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

// Remove user access from credential (admin only)
router.delete('/users/:userId/credentials/:credentialId', auth, async (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 1) { // 1 = admin role
			return res.status(403).json({message: 'Admin access required'});
		}

		const {userId, credentialId} = req.params;

		// Check if user has direct access to this credential
		const credentialUser = await CredentialUser.findOne({
			where: {credentialId, userId}
		});

		if (!credentialUser) {
			return res.status(404).json({message: 'Credential access not found'});
		}

		// Remove the access
		await credentialUser.destroy();

		res.json({message: 'Credential access removed successfully'});
	} catch (error) {
		res.status(500).json({message: 'Server error'});
	}
});

export default router;
