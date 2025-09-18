const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const { User, Group, UserGroup } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('admin', 'user').optional(),
  isActive: Joi.boolean().optional()
});

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { search, role, isActive } = req.query;
    
    let whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password', 'emailVerificationToken'] },
      include: [
        { model: Group, as: 'groups', through: { attributes: [] } }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile unless they're admin
    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'emailVerificationToken'] },
      include: [
        { model: Group, as: 'groups', through: { attributes: [] } }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Users can only update their own profile unless they're admin
    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Non-admin users cannot change their role or active status
    if (req.user.role !== 'admin') {
      delete value.role;
      delete value.isActive;
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If email is being changed, reset email verification
    if (value.email && value.email !== user.email) {
      value.isEmailVerified = false;
      value.emailVerificationToken = user.generateEmailVerificationToken();
    }

    await user.update(value);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password', 'emailVerificationToken'] },
      include: [
        { model: Group, as: 'groups', through: { attributes: [] } }
      ]
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate user (admin only)
router.patch('/:id/activate', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: true });

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const verifiedUsers = await User.count({ where: { isEmailVerified: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });

    const recentUsers = await User.findAll({
      where: { isActive: true },
      attributes: ['firstName', 'lastName', 'email', 'createdAt', 'lastLogin'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
      recentUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;