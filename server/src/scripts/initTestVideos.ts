import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';
import User from '../models/User';
import bcrypt from 'bcryptjs';

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

// 基于 test_video 目录的 6 个视频
const testVideos = [
  {
    title: 'AI 视频素材 1 - 科技未来',
    description: '高质量 AI 生成视频素材，适用于科技、未来主题的宣传和展示。VIP 用户可获得高清加长版。',
    category: '科技',
    price: 39.99,
    thumbnailUrl: '/test_video/1/AI_fengmian_out.png',
    videoUrl: '/test_video/1/AI_video.mp4',
    duration: 60,
    fileSize: 25 * 1024 * 1024,
    tags: ['AI', '科技', '未来', '高清'],
    isActive: true
  },
  {
    title: 'AI 视频素材 2 - 自然风光',
    description: '精美的自然风光 AI 视频，展现大自然的壮丽景色。VIP 版本包含更多场景。',
    category: '自然',
    price: 35.99,
    thumbnailUrl: '/test_video/2/AI_fengmian_out.png',
    videoUrl: '/test_video/2/AI_video.mp4',
    duration: 75,
    fileSize: 30 * 1024 * 1024,
    tags: ['AI', '自然', '风光', '景色'],
    isActive: true
  },
  {
    title: 'AI 视频素材 3 - 都市生活',
    description: '现代都市生活场景，AI 智能生成，适合城市主题项目。VIP 享受超清画质。',
    category: '城市',
    price: 42.99,
    thumbnailUrl: '/test_video/3/AI_fengmian_out.png',
    videoUrl: '/test_video/3/AI_video.mp4',
    duration: 90,
    fileSize: 35 * 1024 * 1024,
    tags: ['AI', '城市', '都市', '现代'],
    isActive: true
  },
  {
    title: 'AI 视频素材 4 - 人物情感',
    description: 'AI 生成的人物情感表达视频，适用于情感类、人文类项目。VIP 版本更加生动。',
    category: '人物',
    price: 38.99,
    thumbnailUrl: '/test_video/4/AI_fengmian_out.png',
    videoUrl: '/test_video/4/AI_video.mp4',
    duration: 65,
    fileSize: 28 * 1024 * 1024,
    tags: ['AI', '人物', '情感', '表达'],
    isActive: true
  },
  {
    title: 'AI 视频素材 5 - 抽象艺术',
    description: '创意抽象艺术视频，AI 算法生成独特视觉效果。VIP 用户获得完整创作版本。',
    category: '抽象',
    price: 44.99,
    thumbnailUrl: '/test_video/5/AI_fengmian_out.png',
    videoUrl: '/test_video/5/AI_video.mp4',
    duration: 80,
    fileSize: 32 * 1024 * 1024,
    tags: ['AI', '抽象', '艺术', '创意'],
    isActive: true
  },
  {
    title: 'AI 视频素材 6 - 商业场景',
    description: '专业商业场景 AI 视频，适合企业宣传、产品展示。VIP 尊享高级商用版本。',
    category: '商务',
    price: 49.99,
    thumbnailUrl: '/test_video/6/AI_fengmian_out.png',
    videoUrl: '/test_video/6/AI_video.mp4',
    duration: 70,
    fileSize: 30 * 1024 * 1024,
    tags: ['AI', '商务', '商业', '企业'],
    isActive: true
  }
];

// 测试用户
const testUsers = [
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    phone: '13800138000',
    role: 'user' as const
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    phone: '13900139000',
    role: 'admin' as const
  }
];

async function initDatabase() {
  try {
    await connectDB();

    console.log('\n=== 开始初始化数据库（仅 test_video 内容）===\n');

    // 1. 清空现有视频数据
    console.log('1. 清空现有视频数据...');
    const deletedVideos = await Video.deleteMany({});
    console.log(`   ✓ 已删除 ${deletedVideos.deletedCount} 个视频\n`);

    // 2. 插入测试视频
    console.log('2. 插入测试视频数据...');
    const videos = await Video.insertMany(testVideos);
    console.log(`   ✓ 成功插入 ${videos.length} 个视频\n`);

    // 3. 显示视频列表
    console.log('3. 视频列表：');
    videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}`);
      console.log(`      分类: ${video.category} | 价格: ¥${video.price}`);
      console.log(`      封面: ${video.thumbnailUrl}`);
      console.log(`      视频: ${video.videoUrl}\n`);
    });

    // 4. 检查并创建测试用户
    console.log('4. 检查测试用户...');
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ username: userData.username });

      if (existingUser) {
        console.log(`   - 用户 "${userData.username}" 已存在，跳过`);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`   ✓ 创建用户: ${userData.username} (${userData.role})`);
        console.log(`     密码: ${userData.password}`);
      }
    }

    console.log('\n=== 数据库初始化完成 ===\n');
    console.log('📝 重要提示：');
    console.log('1. 所有视频已映射到 test_video/1 至 test_video/6 目录');
    console.log('2. VIP 用户将看到 fengmian_*.png 封面和 V2.zip 下载');
    console.log('3. 普通用户将看到 AI_fengmian_*.png 封面和 AI_video.mp4 下载');
    console.log('4. 测试用户账号：');
    console.log('   - testuser / password123 (普通用户)');
    console.log('   - admin / admin123 (管理员)');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
