/**
 * Simple script to drop the old unique index on name
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const permissionsCollection = db.collection('permissions');

    // Drop the old unique index on name
    try {
      await permissionsCollection.dropIndex('name_1');
      console.log('✅ Dropped old unique index on name_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index name_1 does not exist');
      } else {
        console.log('⚠️ Error:', error.message);
      }
    }

    // List all indexes
    const indexes = await permissionsCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

dropOldIndex();
