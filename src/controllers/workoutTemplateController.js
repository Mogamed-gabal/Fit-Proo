/**
 * Workout Template Controller
 * Handles workout plan templates for doctors
 */

const WorkoutTemplate = require('../models/WorkoutTemplate');
const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');

class WorkoutTemplateController {
  /**
   * Create a new workout template
   */
  async createTemplate(req, res, next) {
    try {
      const { name, description, difficulty, durationWeeks, exercises, isPublic } = req.body;
      const doctorId = req.user.userId;

      // Validate doctor role
      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can create workout templates'
        });
      }

      // Create new template
      const template = new WorkoutTemplate({
        doctorId,
        name,
        description,
        difficulty,
        durationWeeks,
        exercises,
        isPublic: isPublic || false
      });

      await template.save();

      res.status(201).json({
        success: true,
        message: 'Workout template created successfully',
        data: { template }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all templates for a doctor
   */
  async getDoctorTemplates(req, res, next) {
    try {
      const doctorId = req.user.userId;
      const { page = 1, limit = 10, search } = req.query;

      // Build query
      const query = { doctorId };
      
      // Add search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Get templates with pagination
      const templates = await WorkoutTemplate.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      const total = await WorkoutTemplate.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          templates,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTemplates: total,
            hasNext: page * limit < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific template
   */
  async getTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const doctorId = req.user.userId;

      // Find template
      const template = await WorkoutTemplate.findOne({ _id: templateId, doctorId });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { template }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a workout template
   */
  async updateTemplate(req, res, next) {
    try {
      const { templateId, name, description, difficulty, durationWeeks, exercises, isPublic } = req.body;
      const doctorId = req.user.userId;

      // Find template
      const template = await WorkoutTemplate.findOne({ _id: templateId, doctorId });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Update fields
      if (name) template.name = name;
      if (description) template.description = description;
      if (difficulty) template.difficulty = difficulty;
      if (durationWeeks) template.durationWeeks = durationWeeks;
      if (exercises) template.exercises = exercises;
      if (isPublic !== undefined) template.isPublic = isPublic;

      template.updatedAt = new Date();
      await template.save();

      res.status(200).json({
        success: true,
        message: 'Workout template updated successfully',
        data: { template }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a workout template
   */
  async deleteTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const doctorId = req.user.userId;

      // Find template
      const template = await WorkoutTemplate.findOne({ _id: templateId, doctorId });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      await WorkoutTemplate.findByIdAndDelete(templateId);

      res.status(200).json({
        success: true,
        message: 'Workout template deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign template to client
   */
  async assignTemplateToClient(req, res, next) {
    try {
      const { templateId, clientId, startDate, endDate } = req.body;
      const doctorId = req.user.userId;

      // Validate doctor role
      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can assign templates to clients'
        });
      }

      // Find template
      const template = await WorkoutTemplate.findOne({ _id: templateId, doctorId });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Check if client exists and is approved
      const client = await User.findById(clientId);
      if (!client || client.role !== 'client' || client.status !== 'approved') {
        return res.status(404).json({
          success: false,
          error: 'Client not found or not approved'
        });
      }

      // Check if client already has an active plan
      const existingActivePlan = await WorkoutPlan.findOne({
        clientId,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (existingActivePlan) {
        // Deactivate existing plan
        existingActivePlan.isActive = false;
        existingActivePlan.updatedAt = new Date();
        await existingActivePlan.save();
      }

      // Create new workout plan from template
      const workoutPlan = new WorkoutPlan({
        clientId,
        doctorId,
        name: template.name,
        description: template.description,
        difficulty: template.difficulty,
        durationWeeks: template.durationWeeks,
        exercises: template.exercises,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        clonedFrom: templateId
      });

      await workoutPlan.save();

      // Update template usage count
      template.usageCount = (template.usageCount || 0) + 1;
      template.updatedAt = new Date();
      await template.save();

      res.status(201).json({
        success: true,
        message: 'Template assigned to client successfully',
        data: { workoutPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public templates (for all doctors)
   */
  async getPublicTemplates(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;

      // Build query
      const query = { isPublic: true };
      
      // Add search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Get templates with pagination
      const templates = await WorkoutTemplate.find(query)
        .sort({ usageCount: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('doctorId', 'name email')
        .lean();

      // Get total count for pagination
      const total = await WorkoutTemplate.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          templates,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTemplates: total,
            hasNext: page * limit < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(req, res, next) {
    try {
      const { templateId, name } = req.body;
      const doctorId = req.user.userId;

      // Find original template
      const originalTemplate = await WorkoutTemplate.findOne({ _id: templateId, doctorId });
      
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Create duplicate template
      const duplicateTemplate = new WorkoutTemplate({
        doctorId,
        name: name || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        difficulty: originalTemplate.difficulty,
        durationWeeks: originalTemplate.durationWeeks,
        exercises: originalTemplate.exercises,
        isPublic: false
      });

      await duplicateTemplate.save();

      res.status(201).json({
        success: true,
        message: 'Template duplicated successfully',
        data: { template: duplicateTemplate }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkoutTemplateController();
