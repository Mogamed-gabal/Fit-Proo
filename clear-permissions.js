/**
 * Clear all permissions from database
 * This will remove all permission assignments and start fresh
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function clearPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myApp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const permissionsCollection = db.collection('permissions');

    // Drop all indexes
    try {
      await permissionsCollection.dropIndexes();
      console.log('✅ Dropped all indexes');
    } catch (error) {
      console.log('⚠️ Error dropping indexes:', error.message);
    }

    // Delete all documents
    const result = await permissionsCollection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} permission documents`);

    // Create the correct unique index
    await permissionsCollection.createIndex(
      { name: 1, assignedTo: 1 },
      { 
        name: 'name_1_assignedTo_1',
        unique: true,
        background: true
      }
    );
    console.log('✅ Created new unique index on name + assignedTo');

    // List all indexes
    const indexes = await permissionsCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Permissions cleared successfully!');
    console.log('⚠️ Please restart the server and try granting permissions again');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

clearPermissions();
