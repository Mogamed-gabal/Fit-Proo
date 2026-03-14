const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

// Load environment variables
dotenv.config();

// Default admin accounts to create
const defaultAdmins = [
  {
    name: 'System Administrator',
    email: 'admin@fitness.com',
    password: 'Admin123!@#',
    phone: '+1234567890',
    address: 'System Administration Office',
    role: 'admin'
  },
  {
    name: 'System Supervisor',
    email: 'supervisor@fitness.com', 
    password: 'Supervisor123!@#',
    phone: '+1234567891',
    address: 'Supervisor Administration Office',
    role: 'supervisor'
  }
];

const seedAdmins = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-platform';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');

    let createdCount = 0;
    let skippedCount = 0;

    // Process each admin
    for (const adminData of defaultAdmins) {
      try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        
        if (existingAdmin) {
          console.log(`⏭️  Admin already exists: ${adminData.email}`);
          skippedCount++;
          continue;
        }

        // Create new admin
        const admin = new User({
          name: adminData.name,
          email: adminData.email,
          password: adminData.password, // Will be hashed by pre-save hook
          phone: adminData.phone,
          address: adminData.address,
          role: adminData.role,
          emailVerified: true,
          status: 'approved'
        });

        await admin.save();
        
        console.log(`✅ Created admin: ${adminData.email}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating admin ${adminData.email}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdCount} admin(s)`);
    console.log(`⏭️  Skipped: ${skippedCount} admin(s)`);
    console.log(`📝 Total processed: ${defaultAdmins.length} admin(s)`);

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Run the seeding script
console.log('🚀 Starting admin seeding...\n');
seedAdmins();
