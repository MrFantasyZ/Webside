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

const newRealVideos = [
  {
    title: '真实视频素材 - cam0',
    description: '高质量真实视频素材，适合各种商业用途和项目展示。',
    category: '其他',
    price: 2.90,
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
    videoUrl: '/uploads/videos/cam0.mp4',
    duration: 10, // 估计时长
    fileSize: 510347, // 实际文件大小
    tags: ['真实', '素材', 'cam0', '商业']
  },
  {
    title: '真实视频素材 - cam1',
    description: '高质量真实视频素材，专业拍摄，画质清晰，适合专业项目使用。',
    category: '其他',
    price: 2.90,
    thumbnailUrl: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=400',
    videoUrl: '/uploads/videos/cam1.mp4',
    duration: 12, // 估计时长
    fileSize: 622320, // 实际文件大小
    tags: ['真实', '素材', 'cam1', '专业']
  },
  {
    title: '真实视频素材 - cam2',
    description: '高质量真实视频素材，多场景拍摄，内容丰富，适合各种创意项目。',
    category: '其他',
    price: 2.90,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    videoUrl: '/uploads/videos/cam2.mp4',
    duration: 15, // 估计时长
    fileSize: 758196, // 实际文件大小
    tags: ['真实', '素材', 'cam2', '创意']
  }
];

const addRealVideos = async () => {
  try {
    console.log('🎬 Adding real videos to database...');

    // Add new real videos
    const createdVideos = await Video.insertMany(newRealVideos);
    console.log(`✅ Added ${createdVideos.length} real videos`);

    console.log('\n🎬 New Real Videos Added:');
    createdVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.category} - ¥${video.price}`);
      console.log(`   File: ${video.videoUrl} (${(video.fileSize / 1024 / 1024).toFixed(2)} MB)`);
    });

    console.log('\n🎉 Real videos added successfully!');

  } catch (error) {
    console.error('❌ Failed to add real videos:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await addRealVideos();
    console.log('\n✨ All done! Real videos are now available.');
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

export { addRealVideos };