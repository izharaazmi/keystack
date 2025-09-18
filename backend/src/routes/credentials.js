const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const { Credential, User, Group, CredentialUser, CredentialGroup, UserGroup } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const credentialSchema = Joi.object({
  label: Joi.string().required(),
  url: Joi.string().uri().required(),
  urlPattern: Joi.string().optional().allow(''),
  username: Joi.string().required(),
  password: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  project: Joi.string().optional().allow(''),
  accessType: Joi.string().valid('individual', 'group', 'all').default('individual'),
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
      include: [{ model: Group, as: 'Group' }]
    });
    const groupIds = userGroups.map(ug => ug.groupId);

    let whereClause = {
      isActive: true,
      [Op.or]: [
        { accessType: 'all' },
        { createdById: userId }
      ]
    };

    // Add individual user access
    if (groupIds.length > 0) {
      whereClause[Op.or].push({
        [Op.and]: [
          { accessType: 'individual' },
          {
            id: {
              [Op.in]: await CredentialUser.findAll({
                where: { userId },
                attributes: ['credentialId']
              }).then(rows => rows.map(row => row.credentialId))
            }
          }
        ]
      });
    }

    // Add group access
    if (groupIds.length > 0) {
      whereClause[Op.or].push({
        [Op.and]: [
          { accessType: 'group' },
          {
            id: {
              [Op.in]: await CredentialGroup.findAll({
                where: { groupId: { [Op.in]: groupIds } },
                attributes: ['credentialId']
              }).then(rows => rows.map(row => row.credentialId))
            }
          }
        ]
      });
    }

    if (project) {
      whereClause.project = project;
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
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ credentials });
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
      include: [{ model: Group, as: 'Group' }]
    });
    const groupIds = userGroups.map(ug => ug.groupId);

    let whereClause = {
      isActive: true,
      [Op.or]: [
        { accessType: 'all' },
        { createdById: userId }
      ]
    };

    // Add individual user access
    const userCredentialIds = await CredentialUser.findAll({
      where: { userId },
      attributes: ['credentialId']
    }).then(rows => rows.map(row => row.credentialId));

    if (userCredentialIds.length > 0) {
      whereClause[Op.or].push({
        [Op.and]: [
          { accessType: 'individual' },
          { id: { [Op.in]: userCredentialIds } }
        ]
      });
    }

    // Add group access
    if (groupIds.length > 0) {
      const groupCredentialIds = await CredentialGroup.findAll({
        where: { groupId: { [Op.in]: groupIds } },
        attributes: ['credentialId']
      }).then(rows => rows.map(row => row.credentialId));

      if (groupCredentialIds.length > 0) {
        whereClause[Op.or].push({
          [Op.and]: [
            { accessType: 'group' },
            { id: { [Op.in]: groupCredentialIds } }
          ]
        });
      }
    }

    const credentials = await Credential.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName'] }
      ]
    });

    // Filter credentials that match the URL
    const matchingCredentials = credentials.filter(cred => {
      if (cred.url === url) return true;
      if (cred.urlPattern) {
        const pattern = cred.urlPattern.replace(/\*/g, '.*');
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

    const { allowedUsers, allowedGroups, ...credentialData } = value;

    const credential = await Credential.create({
      ...credentialData,
      createdById: req.user.id
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
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
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
    if (credential.createdById !== req.user.id && req.user.role !== 'admin') {
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
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName', 'email'] }
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
    if (credential.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this credential' });
    }

    await credential.update({ isActive: false });

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
    const hasAccess = credential.accessType === 'all' || credential.createdById === userId;

    if (!hasAccess) {
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
      lastUsed: new Date(),
      useCount: credential.useCount + 1
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
    const projects = await Credential.findAll({
      where: { isActive: true },
      attributes: ['project'],
      group: ['project']
    });
    
    const projectList = projects.map(p => p.project);
    res.json({ projects: projectList });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;