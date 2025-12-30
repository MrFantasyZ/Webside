import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

// 视频分类
const categories = [
  '科技', '自然', '城市', '人物', '抽象', 
  '商务', '教育', '娱乐', '其他'
];

// 视频标题模板
const titleTemplates: Record<string, string[]> = {
  '科技': [
    '人工智能演示动画', '数据可视化特效', '科技网络连接', '未来科技概念',
    '数字化转型动画', '机器学习可视化', '区块链技术展示', '智能设备演示',
    '虚拟现实体验', '5G网络动画'
  ],
  '自然': [
    '森林风光延时', '海浪拍打岸边', '山间溪流', '花朵绽放过程',
    '日出日落美景', '雨滴落叶特写', '蝴蝶飞舞花间', '瀑布飞流直下',
    '云朵变幻莫测', '晨雾缭绕山谷'
  ],
  '城市': [
    '繁华都市夜景', '车流穿梭街道', '摩天大楼群', '地铁站人流',
    '城市建筑延时', '霓虹灯闪烁', '现代化办公区', '购物中心人潮',
    '立交桥车流', '城市天际线'
  ],
  '人物': [
    '商务团队合作', '家庭温馨时光', '运动健身场景', '学习工作状态',
    '朋友聚会欢乐', '老人悠闲生活', '儿童快乐玩耍', '情侣浪漫约会',
    '职场精英形象', '艺术创作过程'
  ],
  '抽象': [
    '几何图形变换', '色彩渐变动画', '粒子效果展示', '光影交错特效',
    '抽象艺术创作', '流体动力学', '分形图案动画', '音波可视化',
    '线条艺术动画', '色块碰撞效果'
  ],
  '商务': [
    '企业宣传片段', '产品展示动画', '会议讨论场景', '握手合作瞬间',
    '办公环境展示', '团队协作画面', '商务谈判场景', '成功庆祝时刻',
    '创业奋斗历程', '企业文化展示'
  ],
  '教育': [
    '在线学习场景', '课堂教学互动', '知识图表动画', '学生专注学习',
    '教师授课画面', '实验操作演示', '图书馆学习氛围', '毕业典礼时刻',
    '技能培训过程', '教育科技应用'
  ],
  '娱乐': [
    '音乐会现场', '舞蹈表演片段', '电影院观影', '游戏竞技场面',
    '娱乐节目录制', '艺术表演展示', '派对庆祝场面', '户外音乐节',
    '戏剧舞台表演', '综艺节目片段'
  ],
  '其他': [
    '日常生活片段', '美食制作过程', '旅行风景记录', '宠物可爱瞬间',
    '手工艺品制作', '运动竞技场面', '节日庆典活动', '文化传统展示',
    '创意设计过程', '生活美学展现'
  ]
};

// 获取视频文件列表
const getVideoFiles = () => {
  const videoDir = path.join(process.cwd(), '../video');
  return fs.readdirSync(videoDir)
    .filter(file => file.endsWith('.mp4'))
    .map(file => {
      const fullPath = path.join(videoDir, file);
      return {
        filename: file,
        path: `/video/${file}`,
        fullPath: fullPath,
        size: fs.statSync(fullPath).size
      };
    });
};

// 随机选择数组中的元素
const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// 固定价格0.1元
const fixedPrice = () => {
  return 0.1;
};

// 获取视频真实时长 - 基于文件大小的估算方法
const getVideoDuration = (videoPath: string, fileSize: number): number => {
  try {
    // 首先尝试使用ffprobe获取准确时长
    const command = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`;
    const result = execSync(command, { encoding: 'utf8' });
    const duration = parseFloat(result.trim());
    return Math.round(duration);
  } catch (error) {
    // 如果ffprobe不可用，使用基于文件大小的估算
    // 假设平均比特率为 500kbps (这是一个合理的估计)
    const avgBitrateKbps = 500;
    const avgBitrateBps = avgBitrateKbps * 1000 / 8; // 转换为字节/秒
    const estimatedDuration = Math.round(fileSize / avgBitrateBps);
    console.warn(`Could not get duration for ${videoPath}, estimated ${estimatedDuration}s based on file size`);
    return Math.max(estimatedDuration, 10); // 至少10秒
  }
};

// 生成视频数据
const generateVideoData = (videoFiles: any[]) => {
  return videoFiles.map((file, index) => {
    const category = randomChoice(categories);
    const titleTemplate = randomChoice(titleTemplates[category]);
    
    // 为每个视频生成独特的描述
    const descriptions = [
      `高品质${category}视频素材，适用于商业宣传、广告制作、网站装饰等多种用途。`,
      `专业拍摄的${category}主题视频，画质清晰，构图精美，是您项目的理想选择。`,
      `精心制作的${category}视频内容，独特的视角和出色的画面效果让您的作品脱颖而出。`,
      `原创${category}视频素材，无版权争议，可用于各种商业和个人项目。`,
      `高分辨率${category}视频片段，专业级质量，为您的创作提供完美素材。`
    ];
    
    // 生成相关标签
    const generateTags = (category: string) => {
      const baseTags = [category, 'HD', '高清', '素材'];
      const categoryTags: Record<string, string[]> = {
        '科技': ['AI', '数字', '创新', '未来'],
        '自然': ['风景', '生态', '环保', '美景'],
        '城市': ['现代', '都市', '建筑', '繁华'],
        '人物': ['生活', '情感', '社交', '人文'],
        '抽象': ['艺术', '创意', '设计', '视觉'],
        '商务': ['企业', '专业', '合作', '成功'],
        '教育': ['学习', '知识', '培训', '成长'],
        '娱乐': ['欢乐', '表演', '艺术', '文化'],
        '其他': ['生活', '日常', '记录', '分享']
      };
      
      return [...baseTags, ...randomChoice([
        categoryTags[category] || ['通用', '实用', '精品', '推荐']
      ])].slice(0, 6);
    };

    console.log(`Processing ${file.filename}...`);
    const realDuration = getVideoDuration(file.fullPath, file.size);

    return {
      title: `${titleTemplate} ${String(index + 1).padStart(2, '0')}`,
      description: randomChoice(descriptions),
      category,
      price: fixedPrice(),
      thumbnailUrl: file.path, // 使用视频文件本身作为缩略图
      videoUrl: file.path,
      duration: realDuration,
      fileSize: file.size,
      tags: generateTags(category),
      isActive: true // 默认所有视频都上架
    };
  });
};

const initRealVideos = async () => {
  try {
    console.log('🔄 Initializing database with real videos...');

    // 清除现有数据
    await Video.deleteMany({});
    console.log('✅ Cleared existing video data');

    // 获取视频文件
    const videoFiles = getVideoFiles();
    console.log(`📁 Found ${videoFiles.length} video files`);

    if (videoFiles.length === 0) {
      console.log('⚠️ No video files found in /video directory');
      return;
    }

    // 生成视频数据
    const videoData = generateVideoData(videoFiles);
    
    // 插入视频数据
    const videos = await Video.insertMany(videoData);
    console.log(`✅ Created ${videos.length} videos`);

    // 创建文本搜索索引
    try {
      await Video.collection.createIndex({ 
        title: 'text', 
        description: 'text', 
        tags: 'text' 
      });
      console.log('✅ Created text search index for videos');
    } catch (error: any) {
      if (error.code !== 85) { // Index already exists
        console.log('ℹ️ Text search index already exists');
      }
    }

    console.log('\n📝 Video Summary:');
    const categoryCounts = await Video.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    categoryCounts.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} videos`);
    });

    console.log('\n🎬 Sample Videos:');
    const sampleVideos = videos.slice(0, 5);
    sampleVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - ${video.category} - ¥${video.price.toFixed(2)}`);
    });

  } catch (error) {
    console.error('❌ Failed to initialize videos:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await initRealVideos();
    console.log('\n✨ Real videos initialization completed successfully!');
  } catch (error) {
    console.error('💥 Real videos initialization failed:', error);
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

export { initRealVideos };