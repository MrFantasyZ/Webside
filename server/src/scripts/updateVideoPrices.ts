import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';

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

const updateVideoPrices = async () => {
  try {
    console.log('🔍 Updating video prices in database...');

    // Update all videos to price: 1
    const result = await Video.updateMany({}, { $set: { price: 1 } });

    console.log(`✅ Updated ${result.modifiedCount} videos to price: ¥1`);

    // Display updated results
    const videos = await Video.find({});
    console.log('\n📋 Current video prices:');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}: ¥${video.price}`);
    });

  } catch (error) {
    console.error('❌ Failed to update video prices:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await updateVideoPrices();
    console.log('\n✨ All done! Video prices have been updated to ¥1.');
  } catch (error) {
    console.error('💥 Operation failed:', error);
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

export { updateVideoPrices };
