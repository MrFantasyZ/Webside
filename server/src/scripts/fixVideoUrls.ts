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

const fixVideoUrls = async () => {
  try {
    console.log('🔍 Checking video URLs in database...');

    // 获取所有视频
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos in database`);

    let updatedCount = 0;
    for (const video of videos) {
      console.log(`\n📹 Video: ${video.title}`);
      console.log(`   Current URL: ${video.videoUrl}`);
      
      // 检查URL是否需要修复
      if (video.videoUrl.startsWith('/uploads/videos/')) {
        // 从uploads/videos/路径改为video/路径
        const fileName = video.videoUrl.split('/').pop();
        const newUrl = `/video/${fileName}`;
        
        console.log(`   Updating to: ${newUrl}`);
        
        // 更新数据库
        await Video.findByIdAndUpdate(video._id, { videoUrl: newUrl });
        updatedCount++;
      } else if (video.videoUrl.startsWith('/video/')) {
        console.log(`   ✅ URL is already correct`);
      } else {
        console.log(`   ⚠️  Unknown URL format`);
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} video URLs`);
    
    // 显示修复后的结果
    const updatedVideos = await Video.find({});
    console.log('\n📋 Final video URLs:');
    updatedVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}: ${video.videoUrl}`);
    });

  } catch (error) {
    console.error('❌ Failed to fix video URLs:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await fixVideoUrls();
    console.log('\n✨ All done! Video URLs have been fixed.');
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

export { fixVideoUrls };
