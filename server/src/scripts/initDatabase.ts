import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';
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

const sampleVideos = [
  {
    title: '城市夜景延时摄影',
    description: '高清城市夜景延时摄影，展现现代都市的繁华与美丽，适用于商业宣传、背景素材等用途。',
    category: '城市',
    price: 29.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    videoUrl: '/video/AF_1.mp4',
    duration: 120,
    fileSize: 50 * 1024 * 1024, // 50MB
    tags: ['城市', '夜景', '延时', '现代']
  },
  {
    title: '自然风光 - 山间流水',
    description: '清澈的山间小溪，水流潺潺，绿树环绕，完美的自然风光素材。',
    category: '自然',
    price: 24.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    videoUrl: '/video/AF_2.mp4',
    duration: 90,
    fileSize: 40 * 1024 * 1024,
    tags: ['自然', '山水', '流水', '绿色']
  },
  {
    title: '科技感粒子特效',
    description: '蓝色科技感粒子动画，适用于科技产品宣传、数字化转型等主题。',
    category: '科技',
    price: 39.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    videoUrl: '/video/AF_3.mp4',
    duration: 60,
    fileSize: 30 * 1024 * 1024,
    tags: ['科技', '粒子', '特效', '蓝色']
  },
  {
    title: '商务人士握手合作',
    description: '专业商务人士握手场景，象征合作共赢，适用于企业宣传、商务展示。',
    category: '商务',
    price: 34.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400',
    videoUrl: '/video/AF_4.mp4',
    duration: 45,
    fileSize: 25 * 1024 * 1024,
    tags: ['商务', '握手', '合作', '专业']
  },
  {
    title: '抽象几何动画',
    description: '现代抽象几何形状动画，色彩丰富，适用于创意设计、艺术项目。',
    category: '抽象',
    price: 27.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
    videoUrl: '/video/AF_5.mp4',
    duration: 80,
    fileSize: 35 * 1024 * 1024,
    tags: ['抽象', '几何', '动画', '创意']
  },
  {
    title: '快乐家庭时光',
    description: '温馨的家庭聚会场景，展现亲情和谐，适用于家庭产品宣传。',
    category: '人物',
    price: 32.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
    videoUrl: '/video/KM_1.mp4',
    duration: 110,
    fileSize: 45 * 1024 * 1024,
    tags: ['家庭', '温馨', '人物', '快乐']
  },
  {
    title: '在线教育学习场景',
    description: '现代在线教育环境，学生专注学习的场景，适用于教育科技宣传。',
    category: '教育',
    price: 28.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    videoUrl: '/video/KM_2.mp4',
    duration: 95,
    fileSize: 40 * 1024 * 1024,
    tags: ['教育', '学习', '在线', '学生']
  },
  {
    title: '音乐节现场氛围',
    description: '热闹的音乐节现场，观众热情互动，灯光炫目，完美的娱乐氛围。',
    category: '娱乐',
    price: 36.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    videoUrl: '/video/KM_3.mp4',
    duration: 150,
    fileSize: 60 * 1024 * 1024,
    tags: ['音乐', '娱乐', '现场', '氛围']
  },
  {
    title: '晨曦中的森林',
    description: '清晨阳光透过树林的唯美场景，宁静祥和的自然风光。',
    category: '自然',
    price: 26.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    videoUrl: '/video/KM_4.mp4',
    duration: 85,
    fileSize: 38 * 1024 * 1024,
    tags: ['森林', '晨曦', '阳光', '宁静']
  },
  {
    title: '现代办公环境',
    description: '时尚现代的办公空间，展现专业高效的工作氛围。',
    category: '商务',
    price: 31.99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    videoUrl: '/video/xigaogen_1.mp4',
    duration: 75,
    fileSize: 32 * 1024 * 1024,
    tags: ['办公', '现代', '专业', '工作']
  }
];

const sampleUsers = [
  {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com'
  },
  {
    username: 'testuser',
    password: 'password123',
    email: 'test@example.com',
    phone: '13800138000'
  }
];

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');

    // Clear existing data
    await Video.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ Cleared existing data');

    // Create sample videos
    const createdVideos = await Video.insertMany(sampleVideos);
    console.log(`✅ Created ${createdVideos.length} sample videos`);

    // Create sample users (using save to trigger password hashing)
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    console.log(`✅ Created ${createdUsers.length} sample users`);

    // Create text search index for videos
    await Video.collection.createIndex({
      title: 'text',
      description: 'text',
      tags: 'text'
    });
    console.log('✅ Created text search index for videos');

    console.log('🎉 Database initialization completed successfully!');
    
    console.log('\n📝 Sample Users:');
    console.log('Username: admin, Password: admin123, Email: admin@example.com');
    console.log('Username: testuser, Password: password123, Email: test@example.com');
    
    console.log('\n🎬 Sample Videos:');
    createdVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.category} - ¥${video.price}`);
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await initializeDatabase();
    console.log('\n✨ All done! You can now start the server.');
  } catch (error) {
    console.error('💥 Initialization failed:', error);
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

export { initializeDatabase, connectDB };