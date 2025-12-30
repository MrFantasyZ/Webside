import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-video-store';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    console.log('🔄 Creating super admin account...');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ username: 'god' });
    if (existingSuperAdmin) {
      console.log('⚠️ Super admin account "god" already exists');
      return;
    }

    // Create super admin account
    const superAdmin = new User({
      username: 'god',
      password: 'HDZWyxzdbhz369@',
      email: 'god@aiVideoStore.com',
      role: 'superadmin'
    });

    await superAdmin.save();
    console.log('✅ Super admin account "god" created successfully');
    console.log('📝 Login credentials:');
    console.log('Username: god');
    console.log('Password: HDZWyxzdbhz369@');
    console.log('Role: superadmin');

  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await createSuperAdmin();
    console.log('\n✨ Super admin creation completed!');
  } catch (error) {
    console.error('💥 Super admin creation failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { createSuperAdmin };