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

// 视频文件映射和数据生成
const videoFiles = [
  'cam0.mp4', 'cam1.mp4', 'cam2.mp4',
  'cam0 - Copy.mp4', 'cam1 - Copy.mp4', 'cam2 - Copy.mp4',
  'cam0 - Copy (2).mp4', 'cam1 - Copy (2).mp4', 'cam2 - Copy (2).mp4',
  'cam0 - Copy (3).mp4', 'cam1 - Copy (3).mp4', 'cam2 - Copy (3).mp4',
  'cam0 - Copy (4).mp4', 'cam1 - Copy (4).mp4', 'cam2 - Copy (4).mp4',
  'cam0 - Copy (5).mp4', 'cam1 - Copy (5).mp4', 'cam2 - Copy (5).mp4',
  'cam0 - Copy (6).mp4', 'cam1 - Copy (6).mp4', 'cam2 - Copy (6).mp4',
  'cam0 - Copy (7).mp4', 'cam1 - Copy (7).mp4', 'cam2 - Copy (7).mp4',
  'cam0 - Copy (8).mp4', 'cam1 - Copy (8).mp4', 'cam2 - Copy (8).mp4',
  'cam0 - Copy (9).mp4', 'cam1 - Copy (9).mp4', 'cam2 - Copy (9).mp4'
];

const categories = ['城市', '自然', '科技', '商务', '抽象', '人物', '教育', '娱乐', '其他'];
const thumbnails = [
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'
];

const videoTitles = [
  '城市夜景延时摄影', '自然风光山间流水', '科技感粒子特效', '商务人士握手合作', '抽象几何动画',
  '快乐家庭时光', '在线教育学习场景', '音乐节现场氛围', '晨曦中的森林', '现代办公环境',
  '企业团队会议', '创意设计工作室', '城市街道车流', '海边日出风景', '工业生产线作业',
  '学生课堂讨论', '医疗健康检查', '运动健身训练', '咖啡馆休闲时光', '科技数据展示',
  '建筑施工现场', '农田丰收场景', '艺术创作过程', '交通枢纽繁忙', '购物中心场景',
  '餐厅美食制作', '宠物可爱瞬间', '婚礼庆典仪式', '儿童游乐场景', '夜市热闹氛围'
];

const videoDescriptions = [
  '高清城市夜景延时摄影，展现现代都市的繁华与美丽，适用于商业宣传、背景素材等用途。',
  '清澈的山间小溪，水流潺潺，绿树环绕，完美的自然风光素材。',
  '蓝色科技感粒子动画，适用于科技产品宣传、数字化转型等主题。',
  '专业商务人士握手场景，象征合作共赢，适用于企业宣传、商务展示。',
  '现代抽象几何形状动画，色彩丰富，适用于创意设计、艺术项目。',
  '温馨家庭聚会场景，展现亲情温暖，适用于家庭、生活类宣传。',
  '现代在线教育学习环境，展现数字化学习的便利性。',
  '激情音乐节现场，人群律动，灯光绚烂，完美的娱乐氛围素材。',
  '清晨阳光透过森林，鸟语花香，宁静自然的美好时光。',
  '现代化办公空间，简约设计，适用于企业文化、办公环境展示。',
  '高效团队协作会议场景，展现企业文化和团队精神。',
  '创意工作室设计过程，灵感迸发的创作环境。',
  '繁忙的城市街道交通流，现代都市生活节奏感。',
  '壮观的海边日出景色，大自然的美丽与宁静。',
  '现代化工业生产线，高效的制造业场景。',
  '活跃的学生课堂讨论，教育互动的生动场面。',
  '专业医疗健康检查过程，关爱健康的医疗服务。',
  '健康运动健身训练场景，积极向上的生活方式。',
  '温馨咖啡馆休闲时光，放松惬意的生活节奏。',
  '炫酷科技数据可视化展示，信息技术的魅力。',
  '繁忙的建筑施工现场，城市建设的进步力量。',
  '金秋农田丰收场景，丰硕成果的喜悦时刻。',
  '艺术家创作过程记录，创意灵感的诞生瞬间。',
  '交通枢纽的繁忙景象，现代交通的便利高效。',
  '热闹购物中心场景，消费文化的繁荣景象。',
  '精美餐厅美食制作过程，烹饪艺术的精湛技艺。',
  '可爱宠物的温馨瞬间，人与动物的和谐相处。',
  '浪漫婚礼庆典仪式，人生重要时刻的美好记录。',
  '孩子们快乐的游乐场景，童年欢乐的珍贵时光。',
  '夜市热闹繁华氛围，城市夜生活的多彩魅力。'
];

// 生成所有30个视频的数据
const sampleVideos = videoFiles.map((fileName, index) => ({
  title: videoTitles[index],
  description: videoDescriptions[index],
  category: categories[index % categories.length],
  price: Math.round((Math.random() * 30 + 20) * 100) / 100, // 20-50之间的随机价格
  thumbnailUrl: thumbnails[index % thumbnails.length],
  videoUrl: `/video/${fileName}`,
  duration: Math.floor(Math.random() * 120 + 30), // 30-150秒随机时长
  fileSize: Math.floor(Math.random() * 40 + 20) * 1024 * 1024, // 20-60MB随机大小
  tags: [
    categories[index % categories.length],
    index % 2 === 0 ? '高清' : '精品',
    index % 3 === 0 ? '专业' : '创意',
    index % 4 === 0 ? '热门' : '推荐'
  ]
}));

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

const initDatabase = async () => {
  try {
    await connectDB();

    console.log('🔄 Initializing database with 30 videos...');

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

    console.log('\n✨ All done! You can now start the server.');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

initDatabase();