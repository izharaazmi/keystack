import express from 'express';
import Joi from 'joi';
import {Op} from 'sequelize';
import {Project, User, Credential} from '../models/index.js';
import {auth, adminAuth} from '../middleware/auth.js';
import {normalizeName, areNamesSimilar, findDuplicates} from '../utils/nameNormalizer.js';

const router = express.Router();

// Validation schemas
const projectSchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow(''),
	is_active: Joi.boolean().optional()
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });

    // Get creator information and credential count for each project
    for (let project of projects) {
      const creator = await User.findByPk(project.created_by_id, {
        attributes: ['first_name', 'last_name', 'email']
      });
      project.dataValues.createdBy = creator;

      // Get credential count for this project
      const credentialCount = await Credential.count({
        where: { project_id: project.id }
      });
      project.dataValues.credentialsCount = credentialCount;
    }

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check for duplicate project names (including similar variations)
    const existingProjects = await Project.findAll({
      where: { is_active: true },
      attributes: ['name']
    });

    const existingNames = existingProjects.map(project => project.name);
    const duplicates = findDuplicates(value.name, existingNames);

    if (duplicates.length > 0) {
      return res.status(400).json({ 
        message: 'A project with a similar name already exists',
        duplicate: duplicates[0],
        suggestion: `Consider using a different name. Similar project: "${duplicates[0]}"`
      });
    }

    const project = await Project.create({
      ...value,
      created_by_id: req.user.id
    });

    // Get creator information
    const creator = await User.findByPk(project.created_by_id, {
      attributes: ['first_name', 'last_name', 'email']
    });
    project.dataValues.createdBy = creator;
    project.dataValues.credentialsCount = 0;

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Project name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = projectSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user can update this project
    if (project.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // Check for duplicate project names (excluding current project)
    if (value.name && value.name !== project.name) {
      const existingProjects = await Project.findAll({
        where: { 
          is_active: true,
          id: { [Op.ne]: id } // Exclude current project
        },
        attributes: ['name']
      });

      const existingNames = existingProjects.map(p => p.name);
      const duplicates = findDuplicates(value.name, existingNames);

      if (duplicates.length > 0) {
        return res.status(400).json({ 
          message: 'A project with a similar name already exists',
          duplicate: duplicates[0],
          suggestion: `Consider using a different name. Similar project: "${duplicates[0]}"`
        });
      }
    }

    await project.update(value);

    // Get creator information
    const creator = await User.findByPk(project.created_by_id, {
      attributes: ['first_name', 'last_name', 'email']
    });
    project.dataValues.createdBy = creator;

    // Get credential count
    const credentialCount = await Credential.count({
      where: { project_id: project.id }
    });
    project.dataValues.credentialsCount = credentialCount;

    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Project name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user can delete this project
    if (project.created_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await project.update({ is_active: false });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
