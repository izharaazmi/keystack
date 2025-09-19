import express from 'express';
import Joi from 'joi';
import {Op} from 'sequelize';
import {sequelize} from '../config/database.js';
import {User, Group, UserGroup} from '../models/index.js';
import {auth, adminAuth} from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
	first_name: Joi.string().optional(),
	last_name: Joi.string().optional(),
	email: Joi.string().email().optional(),
	role: Joi.string().valid('admin', 'user').optional(),
	is_active: Joi.boolean().optional()
});

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { 
      search, 
      role, 
      is_active, 
      team_id, 
      sort_field = 'created_at', 
      sort_direction = 'desc',
      page = 1,
      limit = 50
    } = req.query;
    
    let whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    let includeClause = [];
    
    // If team_id is provided, filter users by team membership
    if (team_id) {
      includeClause.push({
        model: Group,
        as: 'Groups',
        through: { attributes: [] },
        where: { id: team_id },
        required: true
      });
    }

    // Define valid sort fields and their database column mappings
    const validSortFields = {
      'first_name': 'first_name',
      'last_name': 'last_name',
      'email': 'email',
      'role': 'role',
      'is_active': 'is_active',
      'created_at': 'created_at',
      'last_login': 'last_login',
      'team_count': 'team_count'
    };

    const dbSortField = validSortFields[sort_field] || 'created_at';
    const sortOrder = sort_direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let orderClause;
    if (sort_field === 'team_count') {
      // For team count, we need to order by the count of associated groups
      orderClause = [
        [sequelize.literal('(SELECT COUNT(*) FROM cp_user_groups WHERE user_id = User.id)'), sortOrder]
      ];
    } else {
      orderClause = [[dbSortField, sortOrder]];
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await User.count({
      where: whereClause,
      include: includeClause.length > 0 ? includeClause : undefined,
      distinct: true
    });

    // Get paginated users
    const users = await User.findAll({
      where: whereClause,
      include: [
        ...includeClause,
        {
          model: Group,
          as: 'Groups',
          through: { attributes: [] },
          attributes: ['id', 'name'],
          required: false
        }
      ],
      attributes: { exclude: ['password', 'emailVerificationToken'] },
      order: orderClause,
      limit: limitNum,
      offset: offset
    });

    // Add team count to each user
    const usersWithTeamCount = users.map(user => ({
      ...user.toJSON(),
      team_count: user.Groups ? user.Groups.length : 0
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({ 
      users: usersWithTeamCount,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      }
    });
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
      delete value.is_active;
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating the last remaining admin
    if (value.is_active === false && user.role === 'admin') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          is_active: true
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
      value.is_email_verified = false;
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
          is_active: true
        }
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate the last remaining admin account. At least one admin must remain active.' 
        });
      }
    }

    await user.update({ is_active: false });

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

    await user.update({ is_active: true });

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
    const activeUsers = await User.count({ where: { is_active: true } });
    const verifiedUsers = await User.count({ where: { is_email_verified: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });

    const recentUsers = await User.findAll({
      where: { is_active: true },
      attributes: ['first_name', 'last_name', 'email', 'created_at', 'last_login'],
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
        is_active: false,
        is_email_verified: true // Only show users who have verified their email
      },
      attributes: { exclude: ['password', 'email_verification_token'] },
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

    if (user.is_active) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    if (!user.is_email_verified) {
      return res.status(400).json({ message: 'User must verify their email before approval' });
    }

    await user.update({ is_active: true });

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;