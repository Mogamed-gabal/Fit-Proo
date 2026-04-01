/**
 * Workout Templates Routes
 * Handles all workout template related endpoints
 */

const express = require('express');
const router = express.Router();
const workoutTemplateController = require('../controllers/workoutTemplateController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { sanitizeInputs } = require('../middlewares/validators/authValidator');
const { 
  createTemplate,
  updateTemplate,
  assignTemplateToClient,
  duplicateTemplate,
  searchTemplates,
  templateId
} = require('../middlewares/validators/workoutTemplateValidator');

// Apply authentication to all routes
router.use(authenticate);

// Apply global sanitization
router.use(sanitizeInputs);

// DOCTOR TEMPLATE ROUTES

/**
 * Create a new workout template
 */
router.post('/templates', 
  requirePermission('manage_client_workout_plans'),
  createTemplate,
  workoutTemplateController.createTemplate.bind(workoutTemplateController)
);

/**
 * Get all templates for the doctor
 */
router.get('/templates', 
  requirePermission('manage_client_workout_plans'),
  searchTemplates,
  workoutTemplateController.getDoctorTemplates.bind(workoutTemplateController)
);

/**
 * Get published templates (for doctor's own published templates)
 */
router.get('/templates/published', 
  requirePermission('manage_client_workout_plans'),
  searchTemplates,
  workoutTemplateController.getPublishedTemplates.bind(workoutTemplateController)
);

/**
 * Get a specific template
 */
router.get('/templates/:templateId', 
  requirePermission('view_client_workout_plans'),
  templateId,
  workoutTemplateController.getTemplate.bind(workoutTemplateController)
);

/**
 * Update a workout template
 */
router.put('/templates/:templateId', 
  requirePermission('manage_client_workout_plans'),
  updateTemplate,
  workoutTemplateController.updateTemplate.bind(workoutTemplateController)
);

/**
 * Delete a workout template
 */
router.delete('/templates/:templateId', 
  requirePermission('manage_client_workout_plans'),
  templateId,
  workoutTemplateController.deleteTemplate.bind(workoutTemplateController)
);

/**
 * Assign template to client
 */
router.post('/templates/assign', 
  requirePermission('manage_client_workout_plans'),
  assignTemplateToClient,
  workoutTemplateController.assignTemplateToClient.bind(workoutTemplateController)
);

/**
 * Duplicate a template
 */
router.post('/templates/duplicate', 
  requirePermission('manage_client_workout_plans'),
  duplicateTemplate,
  workoutTemplateController.duplicateTemplate.bind(workoutTemplateController)
);

module.exports = router;
