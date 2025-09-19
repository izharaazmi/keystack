import express from 'express';
import Joi from 'joi';
import {Op} from 'sequelize';
import {auth} from '../middleware/auth.js';
import {Group, User, UserGroup} from '../models/index.js';
import {findDuplicates} from '../utils/nameNormalizer.js';

const router = express.Router();

// Validation schemas
const groupSchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow(''),
	members: Joi.array().items(Joi.number().integer().positive()).optional()
});

// Get all groups
router.get('/', auth, async (req, res) => {
	try {
		const groups = await Group.findAll({
			where: {is_active: true},
			order: [['created_at', 'DESC']]
		});

		// Get creator information and user count for each group
		for (let group of groups) {
			const creator = await User.findByPk(group.created_by_id, {
				attributes: ['first_name', 'last_name', 'email']
			});
			group.dataValues.createdBy = creator;

			// Get user count for this group
			const userCount = await UserGroup.count({
				where: {groupId: group.id}
			});
			group.dataValues.userCount = userCount;
		}

		res.json({groups});
	} catch (error) {
		console.error('Get groups error:', error);
		res.status(500).json({message: 'Server error'});
	}
});

// Create new group
router.post('/', auth, async (req, res) => {
	try {
		const {error, value} = groupSchema.validate(req.body);
		if (error) {
			return res.status(400).json({message: error.details[0].message});
		}

		// Check for duplicate team names (including similar variations)
		const existingGroups = await Group.findAll({
			where: {is_active: true},
			attributes: ['name']
		});

		const existingNames = existingGroups.map(group => group.name);
		const duplicates = findDuplicates(value.name, existingNames);

		if (duplicates.length > 0) {
			return res.status(400).json({
				message: 'A team with a similar name already exists',
				duplicate: duplicates[0],
				suggestion: `Consider using a different name. Similar team: "${duplicates[0]}"`
			});
		}

		const group = await Group.create({
			...value,
			created_by_id: req.user.id
		});

		// Get creator information
		const creator = await User.findByPk(group.created_by_id, {
			attributes: ['first_name', 'last_name', 'email']
		});
		group.dataValues.createdBy = creator;

		res.status(201).json({group});
	} catch (error) {
		console.error('Create group error:', error);
		if (error.name === 'SequelizeUniqueConstraintError') {
			res.status(400).json({message: 'Group name already exists'});
		} else {
			res.status(500).json({message: 'Server error'});
		}
	}
});

// Update group
router.put('/:id', auth, async (req, res) => {
	try {
		const {id} = req.params;
		const {error, value} = groupSchema.validate(req.body);

		if (error) {
			return res.status(400).json({message: error.details[0].message});
		}

		const {members, ...groupData} = value;

		const group = await Group.findByPk(id);
		if (!group) {
			return res.status(404).json({message: 'Group not found'});
		}

		// Check if user can update this group
		if (group.created_by_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({message: 'Not authorized to update this group'});
		}

		// Check for duplicate team names (excluding current team)
		if (groupData.name && groupData.name !== group.name) {
			const existingGroups = await Group.findAll({
				where: {
					is_active: true,
					id: {[Op.ne]: id} // Exclude current team
				},
				attributes: ['name']
			});

			const existingNames = existingGroups.map(g => g.name);
			const duplicates = findDuplicates(groupData.name, existingNames);

			if (duplicates.length > 0) {
				return res.status(400).json({
					message: 'A team with a similar name already exists',
					duplicate: duplicates[0],
					suggestion: `Consider using a different name. Similar team: "${duplicates[0]}"`
				});
			}
		}

		await group.update(groupData);

		// Update members
		if (members !== undefined) {
			await UserGroup.destroy({where: {groupId: id}});
			if (members.length > 0) {
				await UserGroup.bulkCreate(
					members.map(userId => ({
						groupId: id,
						userId
					}))
				);
			}
		}

		const updatedGroup = await Group.findByPk(id, {
			include: [
				{model: User, as: 'Users', through: {attributes: []}}
			]
		});

		// Get creator information
		const creator = await User.findByPk(updatedGroup.created_by_id, {
			attributes: ['first_name', 'last_name', 'email']
		});
		updatedGroup.dataValues.createdBy = creator;

		res.json({group: updatedGroup});
	} catch (error) {
		console.error('Update group error:', error);
		if (error.name === 'SequelizeUniqueConstraintError') {
			res.status(400).json({message: 'Group name already exists'});
		} else {
			res.status(500).json({message: 'Server error'});
		}
	}
});

// Delete group
router.delete('/:id', auth, async (req, res) => {
	try {
		const {id} = req.params;

		const group = await Group.findByPk(id);
		if (!group) {
			return res.status(404).json({message: 'Group not found'});
		}

		// Check if user can delete this group
		if (group.created_by_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({message: 'Not authorized to delete this group'});
		}

		await group.update({is_active: false});

		res.json({message: 'Group deleted successfully'});
	} catch (error) {
		console.error('Delete group error:', error);
		res.status(500).json({message: 'Server error'});
	}
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
	try {
		const {id} = req.params;
		const {userId} = req.body;

		if (!userId) {
			return res.status(400).json({message: 'User ID is required'});
		}

		const group = await Group.findByPk(id);
		if (!group) {
			return res.status(404).json({message: 'Group not found'});
		}

		// Check if user can modify this group
		if (group.created_by_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({message: 'Not authorized to modify this group'});
		}

		const user = await User.findByPk(userId);
		if (!user) {
			return res.status(404).json({message: 'User not found'});
		}

		// Check if user is already in group
		const existingMembership = await UserGroup.findOne({
			where: {groupId: id, userId}
		});

		if (!existingMembership) {
			await UserGroup.create({
				groupId: id,
				userId
			});
		}

		const groupWithAssociations = await Group.findByPk(id, {
			include: [
				{model: User, as: 'Users', through: {attributes: []}}
			]
		});

		// Get creator information
		const creator = await User.findByPk(groupWithAssociations.created_by_id, {
			attributes: ['first_name', 'last_name', 'email']
		});
		groupWithAssociations.dataValues.createdBy = creator;

		res.json({group: groupWithAssociations});
	} catch (error) {
		console.error('Add member error:', error);
		res.status(500).json({message: 'Server error'});
	}
});

// Remove member from group
router.delete('/:id/members/:userId', auth, async (req, res) => {
	try {
		const {id, userId} = req.params;

		const group = await Group.findByPk(id);
		if (!group) {
			return res.status(404).json({message: 'Group not found'});
		}

		// Check if user can modify this group
		if (group.created_by_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({message: 'Not authorized to modify this group'});
		}

		await UserGroup.destroy({
			where: {groupId: id, userId}
		});

		const groupWithAssociations = await Group.findByPk(id, {
			include: [
				{model: User, as: 'Users', through: {attributes: []}}
			]
		});

		// Get creator information
		const creator = await User.findByPk(groupWithAssociations.created_by_id, {
			attributes: ['first_name', 'last_name', 'email']
		});
		groupWithAssociations.dataValues.createdBy = creator;

		res.json({group: groupWithAssociations});
	} catch (error) {
		console.error('Remove member error:', error);
		res.status(500).json({message: 'Server error'});
	}
});

// Batch add users to team
router.post('/:id/batch-add-members', auth, async (req, res) => {
	try {
		const {id} = req.params;
		const {userIds} = req.body;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({message: 'userIds array is required'});
		}

		const group = await Group.findByPk(id);
		if (!group) {
			return res.status(404).json({message: 'Group not found'});
		}

		// Check if user can modify this group
		if (group.created_by_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({message: 'Not authorized to modify this group'});
		}

		// Verify all users exist
		const users = await User.findAll({
			where: {id: userIds},
			attributes: ['id']
		});

		if (users.length !== userIds.length) {
			return res.status(400).json({message: 'Some users not found'});
		}

		// Add users to group (skip if already exists)
		const existingMemberships = await UserGroup.findAll({
			where: {
				groupId: id,
				userId: userIds
			}
		});

		const existingUserIds = existingMemberships.map(em => em.userId);
		const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

		if (newUserIds.length > 0) {
			await UserGroup.bulkCreate(
				newUserIds.map(userId => ({
					groupId: id,
					userId
				}))
			);
		}

		const groupWithAssociations = await Group.findByPk(id, {
			include: [
				{model: User, as: 'Users', through: {attributes: []}}
			]
		});

		// Get creator information
		const creator = await User.findByPk(groupWithAssociations.created_by_id, {
			attributes: ['first_name', 'last_name', 'email']
		});
		groupWithAssociations.dataValues.createdBy = creator;

		res.json({
			group: groupWithAssociations,
			added: newUserIds.length,
			skipped: existingUserIds.length
		});
	} catch (error) {
		console.error('Batch add members error:', error);
		res.status(500).json({message: 'Server error'});
	}
});

// Batch remove users from team
router.post('/:id/remove-members', auth, async (req, res) => {
	try {
		const {id} = req.params;
		const {userIds} = req.body;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({message: 'userIds array is required'});
		}

		const group = await Group.findByPk(id);
		if (!group) {
			return res.status(404).json({message: 'Group not found'});
		}

		// Check if user can modify this group
		if (group.created_by_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({message: 'Not authorized to modify this group'});
		}

		// Remove users from group
		const removedCount = await UserGroup.destroy({
			where: {
				groupId: id,
				userId: userIds
			}
		});

		const groupWithAssociations = await Group.findByPk(id, {
			include: [
				{model: User, as: 'Users', through: {attributes: []}}
			]
		});

		// Get creator information
		const creator = await User.findByPk(groupWithAssociations.created_by_id, {
			attributes: ['first_name', 'last_name', 'email']
		});
		groupWithAssociations.dataValues.createdBy = creator;

		res.json({
			group: groupWithAssociations,
			removed: removedCount
		});
	} catch (error) {
		console.error('Batch remove members error:', error);
		res.status(500).json({message: 'Server error'});
	}
});

export default router;
