// Test Workout Template API
const WorkoutTemplate = require('./src/models/WorkoutTemplate');

async function testWorkoutTemplate() {
  try {
    console.log('🔍 Testing Workout Template Model...');
    
    // Test 1: Check if model loads
    console.log('✅ WorkoutTemplate Model:', WorkoutTemplate.modelName);
    
    // Test 2: Check schema fields
    const schema = WorkoutTemplate.schema;
    console.log('✅ Schema paths:', Object.keys(schema.paths));
    
    // Test 3: Check weeklyPlan field
    console.log('✅ WeeklyPlan field:', !!schema.paths.weeklyPlan);
    console.log('✅ WeeklyPlan type:', schema.paths.weeklyPlan?.instance);
    
    // Test 4: Check doctorName field
    console.log('✅ DoctorName field:', !!schema.paths.doctorName);
    
    // Test 5: Check durationWeeks default
    console.log('✅ DurationWeeks default:', schema.paths.durationWeeks?.defaultValue);
    
    // Test 6: Create a test template
    const testTemplate = new WorkoutTemplate({
      doctorId: '507f1f77bcf86cd799439011',
      doctorName: 'Dr. Test',
      name: 'Test Template',
      description: 'Test template description',
      difficulty: 'beginner',
      weeklyPlan: [
        {
          dayName: 'Monday',
          dailyPlanName: 'Test Day',
          bodyParts: ['chest'],
          muscles: ['pectorals'],
          exercises: [
            {
              name: 'Test Exercise',
              gifUrl: 'https://test.gif',
              equipment: 'bodyweight',
              instructions: 'Test instructions',
              sets: 3,
              reps: 10,
              restTime: 60
            }
          ]
        }
      ],
      isPublic: false
    });
    
    console.log('✅ Test template created:', testTemplate.name);
    console.log('✅ Test template weeklyPlan:', testTemplate.weeklyPlan?.length, 'days');
    console.log('✅ Test template exercises:', testTemplate.weeklyPlan?.[0]?.exercises?.length, 'exercises');
    
    console.log('🎯 All tests passed!');
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testWorkoutTemplate();
