const WorkoutPlan = require('../models/WorkoutPlan');
const ClientProgress = require('../models/ClientProgress');

class ExerciseProgressController {
  /**
   * Mark a specific exercise as complete
   */
  async markExerciseComplete(req, res, next) {
    try {
      const { workoutPlanId, dayIndex, exerciseIndex } = req.body;
      const clientId = req.user.userId;

      // Find the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ 
        _id: workoutPlanId, 
        clientId 
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      // Validate indices
      if (!workoutPlan.weeklyPlan || !workoutPlan.weeklyPlan[dayIndex]) {
        return res.status(404).json({
          success: false,
          error: 'Day not found'
        });
      }

      const dayPlan = workoutPlan.weeklyPlan[dayIndex];
      
      if (!dayPlan.exercises || !dayPlan.exercises[exerciseIndex]) {
        return res.status(404).json({
          success: false,
          error: 'Exercise not found'
        });
      }

      const exercise = dayPlan.exercises[exerciseIndex];

      // Mark exercise as complete
      exercise.status = 'complete';
      exercise.completedAt = new Date();

      // Check if all exercises in the day are complete
      const allExercisesComplete = dayPlan.exercises.every(ex => ex.status === 'complete');
      
      if (allExercisesComplete) {
        dayPlan.status = 'complete';
        dayPlan.completedAt = new Date();
      }

      // Save the workout plan
      await workoutPlan.save();

      // Create progress record
      try {
        await ClientProgress.create({
          clientId,
          workoutPlanId,
          date: new Date(),
          exercisesCompleted: dayPlan.exercises.filter(ex => ex.status === 'complete').length,
          totalExercises: dayPlan.exercises.length,
          dayName: dayPlan.dayName,
          notes: `Completed exercise: ${exercise.name}`
        });
      } catch (progressError) {
        console.error('Failed to create progress record:', progressError);
        // Don't fail the request if progress creation fails
      }

      res.status(200).json({
        success: true,
        message: 'Exercise marked as complete',
        data: {
          exercise: {
            name: exercise.name,
            status: exercise.status,
            completedAt: exercise.completedAt
          },
          dayStatus: dayPlan.status,
          allExercisesComplete
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a specific day as complete
   */
  async markDayComplete(req, res, next) {
    try {
      const { workoutPlanId, dayIndex } = req.body;
      const clientId = req.user.userId;

      // Find the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ 
        _id: workoutPlanId, 
        clientId 
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      // Validate day index
      if (!workoutPlan.weeklyPlan || !workoutPlan.weeklyPlan[dayIndex]) {
        return res.status(404).json({
          success: false,
          error: 'Day not found'
        });
      }

      const dayPlan = workoutPlan.weeklyPlan[dayIndex];

      // Mark all exercises in the day as complete
      dayPlan.exercises.forEach(exercise => {
        if (exercise.status === 'incomplete') {
          exercise.status = 'complete';
          exercise.completedAt = new Date();
        }
      });

      // Mark the day as complete
      dayPlan.status = 'complete';
      dayPlan.completedAt = new Date();

      // Save the workout plan
      await workoutPlan.save();

      // Create progress record
      try {
        await ClientProgress.create({
          clientId,
          workoutPlanId,
          date: new Date(),
          exercisesCompleted: dayPlan.exercises.length,
          totalExercises: dayPlan.exercises.length,
          dayName: dayPlan.dayName,
          notes: `Completed all exercises for ${dayPlan.dayName}`
        });
      } catch (progressError) {
        console.error('Failed to create progress record:', progressError);
        // Don't fail the request if progress creation fails
      }

      res.status(200).json({
        success: true,
        message: 'Day marked as complete',
        data: {
          dayName: dayPlan.dayName,
          status: dayPlan.status,
          completedAt: dayPlan.completedAt,
          exercisesCompleted: dayPlan.exercises.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exercise progress for a workout plan
   */
  async getExerciseProgress(req, res, next) {
    try {
      const { workoutPlanId } = req.params;
      const clientId = req.user.userId;

      // Find the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ 
        _id: workoutPlanId, 
        clientId 
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      // Calculate progress statistics
      let totalExercises = 0;
      let completedExercises = 0;
      let totalDays = workoutPlan.weeklyPlan.length;
      let completedDays = 0;

      const progressData = workoutPlan.weeklyPlan.map((dayPlan, dayIndex) => {
        const dayExercises = dayPlan.exercises || [];
        const completedDayExercises = dayExercises.filter(ex => ex.status === 'complete');
        
        totalExercises += dayExercises.length;
        completedExercises += completedDayExercises.length;

        if (dayPlan.status === 'complete') {
          completedDays++;
        }

        return {
          dayIndex,
          dayName: dayPlan.dayName,
          dailyPlanName: dayPlan.dailyPlanName,
          status: dayPlan.status,
          completedAt: dayPlan.completedAt,
          totalExercises: dayExercises.length,
          completedExercises: completedDayExercises.length,
          exercises: dayExercises.map(exercise => ({
            name: exercise.name,
            status: exercise.status,
            completedAt: exercise.completedAt,
            sets: exercise.sets,
            reps: exercise.reps
          }))
        };
      });

      const overallProgress = {
        totalExercises,
        completedExercises,
        totalDays,
        completedDays,
        exerciseProgressPercentage: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
        dayProgressPercentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
      };

      res.status(200).json({
        success: true,
        data: {
          workoutPlanId,
          overallProgress,
          dailyProgress: progressData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset exercise progress (for testing or admin purposes)
   */
  async resetExerciseProgress(req, res, next) {
    try {
      const { workoutPlanId } = req.body;
      const clientId = req.user.userId;

      // Find the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ 
        _id: workoutPlanId, 
        clientId 
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      // Reset all exercises and days to incomplete
      workoutPlan.weeklyPlan.forEach(dayPlan => {
        dayPlan.status = 'incomplete';
        dayPlan.completedAt = null;
        
        dayPlan.exercises.forEach(exercise => {
          exercise.status = 'incomplete';
          exercise.completedAt = null;
        });
      });

      // Save the workout plan
      await workoutPlan.save();

      res.status(200).json({
        success: true,
        message: 'Exercise progress reset successfully',
        data: {
          workoutPlanId,
          resetAt: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExerciseProgressController();
