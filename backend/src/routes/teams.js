const express = require('express');
const Joi = require('joi');
const { Group, User, UserGroup } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

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
      where: { isActive: true },
      include: [
        { model: User, as: 'members', through: { attributes: [] } },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new group
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = groupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { members, ...groupData } = value;

    const group = await Group.create({
      ...groupData,
      createdById: req.user.id
    });

    // Add members to group
    if (members && members.length > 0) {
      await UserGroup.bulkCreate(
        members.map(userId => ({
          groupId: group.id,
          userId
        }))
      );
    }

    const groupWithAssociations = await Group.findByPk(group.id, {
      include: [
        { model: User, as: 'members', through: { attributes: [] } },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    res.status(201).json({ group: groupWithAssociations });
  } catch (error) {
    console.error('Create group error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Group name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update group
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = groupSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { members, ...groupData } = value;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can update this group
    if (group.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this group' });
    }

    await group.update(groupData);

    // Update members
    if (members !== undefined) {
      await UserGroup.destroy({ where: { groupId: id } });
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
        { model: User, as: 'members', through: { attributes: [] } },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    res.json({ group: updatedGroup });
  } catch (error) {
    console.error('Update group error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Group name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can delete this group
    if (group.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    await group.update({ isActive: false });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can modify this group
    if (group.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this group' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in group
    const existingMembership = await UserGroup.findOne({
      where: { groupId: id, userId }
    });

    if (!existingMembership) {
      await UserGroup.create({
        groupId: id,
        userId
      });
    }

    const groupWithAssociations = await Group.findByPk(id, {
      include: [
        { model: User, as: 'members', through: { attributes: [] } },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    res.json({ group: groupWithAssociations });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from group
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can modify this group
    if (group.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this group' });
    }

    await UserGroup.destroy({
      where: { groupId: id, userId }
    });

    const groupWithAssociations = await Group.findByPk(id, {
      include: [
        { model: User, as: 'members', through: { attributes: [] } },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    res.json({ group: groupWithAssociations });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;