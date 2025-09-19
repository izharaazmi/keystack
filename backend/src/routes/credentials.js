import express from 'express';
import Joi from 'joi';
import {Op} from 'sequelize';
import {Credential, User, Group, Project, CredentialUser, CredentialGroup, UserGroup} from '../models/index.js';
import {auth, adminAuth} from '../middleware/auth.js';
import {sequelize} from '../config/database.js';

const router = express.Router();

// Validation schemas
const credentialSchema = Joi.object({
	label: Joi.string().required(),
	url: Joi.string().uri().required(),
	url_pattern: Joi.string().optional().allow(''),
	username: Joi.string().required(),
	password: Joi.string().required(),
	description: Joi.string().optional().allow(''),
	project_id: Joi.number().integer().positive().optional().allow(null),
	allowedUsers: Joi.array().items(Joi.number().integer().positive()).optional(),
	allowedGroups: Joi.array().items(Joi.number().integer().positive()).optional()
});

// Get all credentials accessible to the user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { project, search } = req.query;

    // Get user's groups
    const userGroups = await UserGroup.findAll({
      where: { userId },
    });
    const groupIds = userGroups.map(ug => ug.groupId);

    // Get individual user access
    const userCredentialIds = await CredentialUser.findAll({
      where: { userId },
      attributes: ['credentialId']
    }).then(rows => rows.map(row => row.credentialId));

    // Get group access
    let groupCredentialIds = [];
    if (groupIds.length > 0) {
      groupCredentialIds = await CredentialGroup.findAll({
        where: { groupId: { [Op.in]: groupIds } },
        attributes: ['credentialId']
      }).then(rows => rows.map(row => row.credentialId));
    }

    // Combine all accessible credential IDs
    const accessibleCredentialIds = [
      ...userCredentialIds,
      ...groupCredentialIds
    ];

    let whereClause = {
      is_active: true,
      [Op.or]: [
        { created_by_id: userId },
        { id: { [Op.in]: accessibleCredentialIds } }
      ]
    };

    if (project) {
      // If project is provided, filter by project ID
      whereClause.project_id = project;
    }

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { label: { [Op.like]: `%${search}%` } },
            { url: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
          ]
        }
      ];
    }

    const credentials = await Credential.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'createdBy', attributes: ['first_name', 'last_name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'description'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Add user and team counts for each credential
    const credentialsWithCounts = await Promise.all(credentials.map(async (credential) => {
      const userCount = await CredentialUser.count({
        where: { credentialId: credential.id }
      });
      
      const teamCount = await CredentialGroup.count({
        where: { credentialId: credential.id }
      });

      return {
        ...credential.toJSON(),
        user_count: userCount,
        team_count: teamCount
      };
    }));

    res.json({ credentials: credentialsWithCounts });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get credentials for current URL (Chrome extension)
router.get('/for-url', auth, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const userId = req.user.id;
    
    // Get user's groups
    const userGroups = await UserGroup.findAll({
      where: { userId },
    });
    const groupIds = userGroups.map(ug => ug.groupId);

    // Get individual user access
    const userCredentialIds = await CredentialUser.findAll({
      where: { userId },
      attributes: ['credentialId']
    }).then(rows => rows.map(row => row.credentialId));

    // Get group access
    let groupCredentialIds = [];
    if (groupIds.length > 0) {
      groupCredentialIds = await CredentialGroup.findAll({
        where: { groupId: { [Op.in]: groupIds } },
        attributes: ['credentialId']
      }).then(rows => rows.map(row => row.credentialId));
    }

    // Combine all accessible credential IDs
    const accessibleCredentialIds = [
      ...userCredentialIds,
      ...groupCredentialIds
    ];

    let whereClause = {
      is_active: true,
      [Op.or]: [
        { created_by_id: userId },
        { id: { [Op.in]: accessibleCredentialIds } }
      ]
    };

    const credentials = await Credential.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'createdBy', attributes: ['first_name', 'last_name'] }
      ]
    });

    // Filter credentials that match the URL
    const matchingCredentials = credentials.filter(cred => {
      if (cred.url === url) return true;
      if (cred.url_pattern) {
        const pattern = cred.url_pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(url);
      }
      return false;
    });

    res.json({ credentials: matchingCredentials });
  } catch (error) {
    console.error('Get credentials for URL error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new credential
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = credentialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { allowedUsers, allowedGroups, project_id, ...credentialData } = value;

    // Validate project_id if provided
    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(400).json({ message: 'Project not found' });
      }
    }

    const credential = await Credential.create({
      ...credentialData,
      project_id: project_id || null,
      created_by_id: req.user.id
    });

    // Add individual user access
    if (allowedUsers && allowedUsers.length > 0) {
      await CredentialUser.bulkCreate(
        allowedUsers.map(userId => ({
          credentialId: credential.id,
          userId
        }))
      );
    }

    // Add group access
    if (allowedGroups && allowedGroups.length > 0) {
      await CredentialGroup.bulkCreate(
        allowedGroups.map(groupId => ({
          credentialId: credential.id,
          groupId
        }))
      );
    }

    const credentialWithAssociations = await Credential.findByPk(credential.id, {
      include: [
        { model: User, as: 'createdBy', attributes: ['first_name', 'last_name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'description'] }
      ]
    });

    res.status(201).json({ credential: credentialWithAssociations });
  } catch (error) {
    console.error('Create credential error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update credential
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = credentialSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { allowedUsers, allowedGroups, ...credentialData } = value;

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can update this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this credential' });
    }

    await credential.update(credentialData);

    // Update individual user access
    if (allowedUsers !== undefined) {
      await CredentialUser.destroy({ where: { credentialId: id } });
      if (allowedUsers.length > 0) {
        await CredentialUser.bulkCreate(
          allowedUsers.map(userId => ({
            credentialId: id,
            userId
          }))
        );
      }
    }

    // Update group access
    if (allowedGroups !== undefined) {
      await CredentialGroup.destroy({ where: { credentialId: id } });
      if (allowedGroups.length > 0) {
        await CredentialGroup.bulkCreate(
          allowedGroups.map(groupId => ({
            credentialId: id,
            groupId
          }))
        );
      }
    }

    const updatedCredential = await Credential.findByPk(id, {
      include: [
        { model: User, as: 'createdBy', attributes: ['first_name', 'last_name', 'email'] }
      ]
    });

    res.json({ credential: updatedCredential });
  } catch (error) {
    console.error('Update credential error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete credential
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can delete this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this credential' });
    }

    await credential.update({ is_active: false });

    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record credential usage
router.post('/:id/use', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user has access to this credential
    const userId = req.user.id;
    const isCreator = credential.created_by_id === userId;

    if (!isCreator) {
      // Check individual access
      const userAccess = await CredentialUser.findOne({
        where: { credentialId: id, userId }
      });

      if (!userAccess) {
        // Check group access
        const userGroups = await UserGroup.findAll({
          where: { userId },
          attributes: ['groupId']
        });
        const groupIds = userGroups.map(ug => ug.groupId);

        if (groupIds.length > 0) {
          const groupAccess = await CredentialGroup.findOne({
            where: { 
              credentialId: id, 
              groupId: { [Op.in]: groupIds } 
            }
          });
          if (!groupAccess) {
            return res.status(403).json({ message: 'Not authorized to use this credential' });
          }
        } else {
          return res.status(403).json({ message: 'Not authorized to use this credential' });
        }
      }
    }

    await credential.update({
      last_used: new Date(),
      use_count: credential.use_count + 1
    });

    res.json({ message: 'Usage recorded' });
  } catch (error) {
    console.error('Record usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all projects
router.get('/projects/list', auth, async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { is_active: true },
      attributes: ['name'],
      order: [['name', 'ASC']],
      raw: true
    });
    
    const projectList = projects.map(p => p.name);
    res.json({ projects: projectList });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get projects with credentials count
router.get('/projects', auth, async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { is_active: true },
      include: [
        {
          model: Credential,
          as: 'credentials',
          where: { is_active: true },
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id',
        'name',
        'description',
        [sequelize.fn('COUNT', sequelize.col('credentials.id')), 'credentialsCount']
      ],
      group: ['Project.id'],
      order: [['name', 'ASC']]
    });
    
    const projectList = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      credentialsCount: parseInt(p.dataValues.credentialsCount)
    }));
    
    res.json({ projects: projectList });
  } catch (error) {
    console.error('Get projects with count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users assigned to a credential (direct + via teams)
router.get('/:id/users', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can view this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this credential' });
    }

    // Get directly assigned users
    const credentialUsers = await CredentialUser.findAll({
      where: { credentialId: id },
      include: [
        { model: User, as: 'User', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    // Get teams assigned to this credential
    const credentialGroups = await CredentialGroup.findAll({
      where: { credentialId: id },
      include: [
        { 
          model: Group, 
          as: 'Group',
          include: [
            { 
              model: User, 
              as: 'Users',
              through: { attributes: [] },
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ]
    });

    // Combine direct users and team members
    const directUsers = credentialUsers.map(cu => ({
      ...cu.User.dataValues,
      assignmentType: 'direct'
    }));

    const teamMembers = [];
    credentialGroups.forEach(cg => {
      cg.Group.Users.forEach(user => {
        teamMembers.push({
          ...user.dataValues,
          assignmentType: 'team',
          teamName: cg.Group.name
        });
      });
    });

    // Remove duplicates (users who are both directly assigned and team members)
    const allUsers = [...directUsers];
    const directUserIds = new Set(directUsers.map(u => u.id));
    
    teamMembers.forEach(user => {
      if (!directUserIds.has(user.id)) {
        allUsers.push(user);
      }
    });

    res.json({ users: allUsers });
  } catch (error) {
    console.error('Get credential users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teams assigned to a credential
router.get('/:id/teams', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can view this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this credential' });
    }

    const credentialGroups = await CredentialGroup.findAll({
      where: { credentialId: id },
      include: [
        { model: Group, as: 'Group', attributes: ['id', 'name', 'description'] }
      ]
    });

    const teams = credentialGroups.map(cg => cg.Group);
    res.json({ teams });
  } catch (error) {
    console.error('Get credential teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign user to credential
router.post('/:id/users', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can modify this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this credential' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await CredentialUser.findOne({
      where: { credentialId: id, userId }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'User is already assigned to this credential' });
    }

    await CredentialUser.create({
      credentialId: id,
      userId
    });

    res.json({ message: 'User assigned successfully' });
  } catch (error) {
    console.error('Assign user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign team to credential
router.post('/:id/teams', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: 'Team ID is required' });
    }

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can modify this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this credential' });
    }

    // Check if team exists
    const team = await Group.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await CredentialGroup.findOne({
      where: { credentialId: id, groupId: teamId }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Team is already assigned to this credential' });
    }

    await CredentialGroup.create({
      credentialId: id,
      groupId: teamId
    });

    res.json({ message: 'Team assigned successfully' });
  } catch (error) {
    console.error('Assign team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove user from credential
router.delete('/:id/users/:userId', auth, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can modify this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this credential' });
    }

    const assignment = await CredentialUser.findOne({
      where: { credentialId: id, userId }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'User assignment not found' });
    }

    await assignment.destroy();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove team from credential
router.delete('/:id/teams/:teamId', auth, async (req, res) => {
  try {
    const { id, teamId } = req.params;

    const credential = await Credential.findByPk(id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if user can modify this credential
    if (credential.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this credential' });
    }

    const assignment = await CredentialGroup.findOne({
      where: { credentialId: id, groupId: teamId }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Team assignment not found' });
    }

    await assignment.destroy();
    res.json({ message: 'Team removed successfully' });
  } catch (error) {
    console.error('Remove team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;