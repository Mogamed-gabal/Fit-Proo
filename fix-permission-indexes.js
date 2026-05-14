/**
 * Migration: Fix Permission Model Indexes
 * 
 * This script fixes the permission model indexes to allow the same permission
 * to be granted to different users, but prevent duplicate permissions for the same user.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixPermissionIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myApp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get the permissions collection
    const db = mongoose.connection.db;
    const permissionsCollection = db.collection('permissions');

    // Drop the old unique index on name
    try {
      await permissionsCollection.dropIndex('name_1');
      console.log('✅ Dropped old unique index on name');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Old index on name does not exist, skipping...');
      } else {
        console.log('⚠️ Error dropping old index:', error.message);
      }
    }

    // Create the new unique index on name + assignedTo
    try {
      await permissionsCollection.createIndex(
        { name: 1, assignedTo: 1 },
        { 
          name: 'name_1_assignedTo_1',
          unique: true,
          background: true
        }
      );
      console.log('✅ Created new unique index on name + assignedTo');
    } catch (error) {
      console.log('⚠️ Error creating new index:', error.message);
    }

    // Check for duplicate permissions (same permission for same user)
    const duplicates = await permissionsCollection.aggregate([
      {
        $group: {
          _id: { name: '$name', assignedTo: '$assignedTo' },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`⚠️ Found ${duplicates.length} duplicate permission assignments`);
      
      // Remove duplicates (keep the first one)
      for (const duplicate of duplicates) {
        const docsToDelete = duplicate.docs.slice(1); // Keep the first, delete the rest
        await permissionsCollection.deleteMany({ _id: { $in: docsToDelete } });
        console.log(`✅ Removed ${docsToDelete.length} duplicates for permission: ${duplicate._id.name}`);
      }
    } else {
      console.log('✅ No duplicate permissions found');
    }

    // List all indexes
    const indexes = await permissionsCollection.indexes();
    console.log('\n📋 Current indexes on permissions collection:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
fixPermissionIndexes();
