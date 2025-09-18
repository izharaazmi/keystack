import express from 'express';
import Joi from 'joi';
import {Op} from 'sequelize';
import {User, Group, UserGroup} from '../models/index.js';
import {auth, adminAuth} from '../middleware/auth.js';

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
      order: [['created_at', 'DESC']]
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
        { model: Group, as: 'Groups', through: { attributes: [] } }
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

    // Prevent deactivating the last remaining admin
    if (value.isActive === false && user.role === 'admin') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          isActive: true
        }
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate the last remaining admin account. At least one admin must remain active.' 
        });
      }
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
        { model: Group, as: 'Groups', through: { attributes: [] } }
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

    // Prevent deactivating the last remaining admin
    if (user.role === 'admin') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          isActive: true
        }
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate the last remaining admin account. At least one admin must remain active.' 
        });
      }
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
      attributes: ['firstName', 'lastName', 'email', 'created_at', 'lastLogin'],
      order: [['created_at', 'DESC']],
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

// Update user role (admin only)
router.patch('/:id/role', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "admin" or "user"' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if this would leave no admins
    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot change role: At least one admin must remain' });
      }
    }

    // Update the user's role
    await user.update({ role });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending users for approval (admin only)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { 
        isActive: false,
        isEmailVerified: true // Only show users who have verified their email
      },
      attributes: { exclude: ['password', 'emailVerificationToken'] },
      order: [['created_at', 'ASC']]
    });

    res.json({ users: pendingUsers });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve user (admin only)
router.patch('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'User must verify their email before approval' });
    }

    await user.update({ isActive: true });

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;