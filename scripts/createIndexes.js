/**
 * Database Index Creation Script
 * Run this script to create all necessary indexes for optimal performance
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const createIndexes = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-platform';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');

    // Get database instance
    const db = mongoose.connection.db;

    // Create User collection indexes
    console.log('📊 Creating User indexes...');
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isDeleted: 1 });
    await db.collection('users').createIndex({ isBlocked: 1 });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ emailVerificationToken: 1 });
    await db.collection('users').createIndex({ passwordResetToken: 1 });
    
    // Compound indexes for User collection
    await db.collection('users').createIndex({ role: 1, status: 1 });
    await db.collection('users').createIndex({ role: 1, isDeleted: 1 });
    await db.collection('users').createIndex({ isDeleted: 1, createdAt: -1 });

    // Create Subscription collection indexes
    console.log('📊 Creating Subscription indexes...');
    
    await db.collection('subscriptions').createIndex({ clientId: 1, createdAt: -1 });
    await db.collection('subscriptions').createIndex({ doctorId: 1, createdAt: -1 });
    await db.collection('subscriptions').createIndex({ isActive: 1 });
    await db.collection('subscriptions').createIndex({ paymentStatus: 1 });
    await db.collection('subscriptions').createIndex({ status: 1 });
    await db.collection('subscriptions').createIndex({ createdAt: -1 });
    await db.collection('subscriptions').createIndex({ endDate: 1 });
    
    // Compound indexes for Subscription collection
    await db.collection('subscriptions').createIndex({ clientId: 1, isActive: 1 });
    await db.collection('subscriptions').createIndex({ doctorId: 1, isActive: 1 });
    await db.collection('subscriptions').createIndex({ clientId: 1, doctorId: 1 });
    await db.collection('subscriptions').createIndex({ isActive: 1, paymentStatus: 1 });

    // Create RefreshToken collection indexes
    console.log('📊 Creating RefreshToken indexes...');
    
    await db.collection('refreshtokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('refreshtokens').createIndex({ user: 1, createdAt: -1 });
    await db.collection('refreshtokens').createIndex({ token: 1 }, { unique: true });
    await db.collection('refreshtokens').createIndex({ isRevoked: 1 });
    await db.collection('refreshtokens').createIndex({ user: 1, isRevoked: 1 });

    console.log('✅ All indexes created successfully');
    
    // Show index statistics
    const userIndexes = await db.collection('users').listIndexes().toArray();
    const subscriptionIndexes = await db.collection('subscriptions').listIndexes().toArray();
    const refreshTokenIndexes = await db.collection('refreshtokens').listIndexes().toArray();
    
    console.log('\n📈 Index Statistics:');
    console.log(`Users collection: ${userIndexes.length} indexes`);
    console.log(`Subscriptions collection: ${subscriptionIndexes.length} indexes`);
    console.log(`RefreshTokens collection: ${refreshTokenIndexes.length} indexes`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;
