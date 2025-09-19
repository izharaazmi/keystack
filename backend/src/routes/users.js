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
	role: Joi.number().integer().min(0).max(10).optional(),
	state: Joi.number().integer().min(-2).max(10).optional(),
	new_password: Joi.string().min(6).optional(),
	confirm_password: Joi.string().valid(Joi.ref('new_password')).optional()
});

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { 
      search, 
      role, 
      state, 
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
    
    if (role !== undefined) {
      whereClause.role = parseInt(role);
    }
    
    if (state !== undefined) {
      whereClause.state = parseInt(state);
    } else {
      // When no state filter is provided, exclude trashed users by default
      whereClause.state = { [Op.ne]: -2 }; // Exclude TRASHED state
    }

    let includeClause = [];
    
    // If team_id is provided, filter users by team membership
    if (team_id) {
      const teamId = parseInt(team_id, 10);
      console.log('Team filter in backend:', { team_id, teamId, isValid: !isNaN(teamId) });
      if (!isNaN(teamId)) {
        includeClause.push({
          model: Group,
          as: 'Groups',
          through: { attributes: [] },
          where: { id: teamId },
          required: true,
          attributes: ['id', 'name']
        });
        console.log('Added team filter to includeClause:', includeClause);
      }
    } else {
      // If no team filter, include Groups for team count
      includeClause.push({
        model: Group,
        as: 'Groups',
        through: { attributes: [] },
        attributes: ['id', 'name'],
        required: false
      });
    }

    // Define valid sort fields and their database column mappings
    const validSortFields = {
      'id': 'id',
      'first_name': 'first_name',
      'last_name': 'last_name',
      'email': 'email',
      'role': 'role',
      'state': 'state',
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
      include: includeClause,
      attributes: { exclude: ['password', 'emailVerificationToken'] },
      order: orderClause,
      limit: limitNum,
      offset: offset
    });

    // Add team count to each user
    const usersWithTeamCount = await Promise.all(users.map(async (user) => {
      // Get actual team count for each user (not just the filtered team)
      const teamCount = await UserGroup.count({
        where: { userId: user.id }
      });
      
      return {
        ...user.toJSON(),
        team_count: teamCount
      };
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
    if (parseInt(id) !== req.user.id && req.user.role !== 1) {
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
    if (parseInt(id) !== req.user.id && req.user.role !== 1) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Non-admin users cannot change their role or active status
    if (req.user.role !== 1) {
      delete value.role;
      delete value.state;
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating the last remaining admin
    if (value.state === -2 && user.role === 1) {
      const activeAdminCount = await User.count({
        where: {
          role: 1,
          state: 1
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

    // Handle password change
    if (value.new_password) {
      value.password = value.new_password;
      delete value.new_password;
      delete value.confirm_password;
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
    if (user.role === 1) {
      const activeAdminCount = await User.count({
        where: {
          role: 1,
          state: 1
        }
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate the last remaining admin account. At least one admin must remain active.' 
        });
      }
    }

    await user.update({ state: -2 }); // Set to TRASHED state

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

    await user.update({ state: 1 }); // Set to ACTIVE state

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
    const activeUsers = await User.count({ where: { state: 1 } });
    const verifiedUsers = await User.count({ where: { is_email_verified: true } });
    const adminUsers = await User.count({ where: { role: 1 } });
    const pendingUsers = await User.count({ where: { state: 0 } });

    const recentUsers = await User.findAll({
      where: { state: 1 },
      attributes: ['first_name', 'last_name', 'email', 'created_at', 'last_login'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
      pendingUsers,
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
    if (role === undefined || (role !== 0 && role !== 1)) {
      return res.status(400).json({ message: 'Invalid role. Must be 0 (user) or 1 (admin)' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if this would leave no admins
    if (user.role === 1 && role === 0) {
      const adminCount = await User.count({ where: { role: 1 } });
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
        state: 0
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

    if (user.state === 1) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    await user.update({ state: 1 });

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user state (admin only) - Common endpoint for state changes
router.patch('/:id/state', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate state value
    if (![User.STATES.TRASHED, User.STATES.BLOCKED, User.STATES.PENDING, User.STATES.ACTIVE].includes(state)) {
      return res.status(400).json({ message: 'Invalid state value' });
    }

    // Prevent deleting the last remaining admin
    if (state === User.STATES.TRASHED && user.role === User.ROLES.ADMIN) {
      const activeAdminCount = await User.count({
        where: {
          role: User.ROLES.ADMIN,
          state: User.STATES.ACTIVE
        }
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last remaining admin account. At least one admin must remain active.' 
        });
      }
    }

    await user.update({ state });

    // Return appropriate success message based on state
    let message = 'User state updated successfully';
    switch (state) {
      case User.STATES.ACTIVE:
        message = user.state === User.STATES.BLOCKED ? 'User unblocked successfully' : 
                  user.state === User.STATES.TRASHED ? 'User restored successfully' : 
                  'User activated successfully';
        break;
      case User.STATES.BLOCKED:
        message = 'User blocked successfully';
        break;
      case User.STATES.TRASHED:
        message = 'User deleted successfully';
        break;
      case User.STATES.PENDING:
        message = 'User state set to pending';
        break;
    }

    res.json({ message });
  } catch (error) {
    console.error('Update user state error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;