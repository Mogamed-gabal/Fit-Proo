/**
 * Workout Template Controller
 * Handles workout plan templates for doctors
 */

const WorkoutTemplate = require('../models/WorkoutTemplate');
const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');
const Notification = require('../models/Notification');

class WorkoutTemplateController {
  /**
   * Create a new workout template
   */
  async createTemplate(req, res, next) {
    try {
      const { name, description, difficulty, weeklyPlan, isPublic } = req.body;
      const doctorId = req.user.userId;

      // Validate doctor role
      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can create workout templates'
        });
      }

      // Get doctor information
      const doctor = await User.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      // Create new template with doctor name and fixed duration
      const template = new WorkoutTemplate({
        doctorId,
        doctorName: doctor.name,
        name,
        description,
        difficulty,
        durationWeeks: 7, // Fixed 7 days per week
        weeklyPlan,
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
      const userId = req.user.userId;
      const userRole = req.user.role;

      let template;

      if (userRole === 'doctor') {
        // Doctor can get their own templates (public or private)
        template = await WorkoutTemplate.findOne({ _id: templateId, doctorId: userId });
      } else if (userRole === 'client') {
        // Client can only get public templates
        template = await WorkoutTemplate.findOne({ _id: templateId, isPublic: true })
          .populate('doctorId', 'name email');
      }

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
      const { templateId, name, description, difficulty, weeklyPlan, isPublic } = req.body;
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
      if (weeklyPlan) template.weeklyPlan = weeklyPlan;
      if (isPublic !== undefined) template.isPublic = isPublic;
      
      // Duration is fixed to 7 days per week, don't update it
      // template.durationWeeks stays as default (7)

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
        return res.status(400).json({
          success: false,
          error: 'Client already has an active workout plan'
        });
      }

      // Get doctor information
      const doctor = await User.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      // Create new workout plan from template
      const workoutPlan = new WorkoutPlan({
        clientId,
        doctorId,
        doctorName: doctor.name,
        name: template.name,
        description: template.description,
        notes: `Created from template: ${template.name}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        difficulty: template.difficulty,
        durationWeeks: 7, // Fixed 7 days per week
        weeklyPlan: template.weeklyPlan
      });

      await workoutPlan.save();

      // Increment template usage count
      template.usageCount += 1;
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
   * Get published templates (for doctor's own published templates)
   * Returns all workouts that have been assigned to clients (from templates or direct plans)
   */
  async getPublishedTemplates(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const doctorId = req.user.userId;

      // Get all workout plans assigned to clients by this doctor
      const workoutPlans = await WorkoutPlan.find({ doctorId })
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get all published templates by this doctor
      const templateQuery = { 
        doctorId,
        isPublic: true 
      };
      
      // Add search filter
      if (search) {
        templateQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const templates = await WorkoutTemplate.find(templateQuery)
        .sort({ usageCount: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Combine and format the results
      const allWorkouts = [
        // Workout plans assigned directly to clients
        ...workoutPlans.map(plan => ({
          _id: plan._id,
          name: plan.name,
          description: plan.description || '',
          difficulty: plan.difficulty,
          type: 'workout_plan',
          clientId: plan.clientId ? plan.clientId._id : null,
          clientName: plan.clientId ? plan.clientId.name : null,
          clientEmail: plan.clientId ? plan.clientId.email : null,
          startDate: plan.startDate,
          endDate: plan.endDate,
          isActive: plan.isActive,
          durationWeeks: plan.durationWeeks,
          weeklyPlan: plan.weeklyPlan,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
          usageCount: 1 // Each assigned plan counts as usage
        })),
        // Published templates
        ...templates.map(template => ({
          _id: template._id,
          name: template.name,
          description: template.description || '',
          difficulty: template.difficulty,
          type: 'template',
          clientId: null,
          clientName: null,
          clientEmail: null,
          startDate: null,
          endDate: null,
          isActive: template.isPublic,
          durationWeeks: template.durationWeeks,
          weeklyPlan: template.weeklyPlan,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          usageCount: template.usageCount
        }))
      ];

      // Sort by creation date (newest first)
      allWorkouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Get total counts
      const totalWorkoutPlans = await WorkoutPlan.countDocuments({ doctorId });
      const totalTemplates = await WorkoutTemplate.countDocuments(templateQuery);
      const total = totalWorkoutPlans + totalTemplates;

      res.status(200).json({
        success: true,
        data: {
          templates: allWorkouts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTemplates: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          },
          summary: {
            totalWorkoutPlans: totalWorkoutPlans,
            totalTemplates: totalTemplates,
            grandTotal: total
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

      // Create duplicate template with new structure
      const duplicateTemplate = new WorkoutTemplate({
        doctorId,
        doctorName: originalTemplate.doctorName,
        name: name || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        difficulty: originalTemplate.difficulty,
        durationWeeks: 7, // Fixed 7 days per week
        weeklyPlan: originalTemplate.weeklyPlan, // ✅ Use weeklyPlan instead of exercises
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
