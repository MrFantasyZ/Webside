import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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

// 视频分类数组
const categories = ['科技', '自然', '城市', '人物', '抽象', '商务', '教育', '娱乐', '其他'];

// 随机视频标题前缀
const titlePrefixes = [
  '精美', '高清', '专业', '创意', '时尚', '现代', '经典', '优质', '独特', '震撼',
  '唯美', '动感', '炫酷', '梦幻', '艺术', '商业', '实用', '热门', '流行', '精彩'
];

// 随机标题后缀
const titleSuffixes = [
  '视频素材', '影像素材', '视频片段', '动态素材', '背景视频', '宣传片段', 
  '展示视频', '产品视频', '场景视频', '特效素材', '动画片段', '广告素材'
];

// 随机描述模板
const descriptions = [
  '高质量视频素材，适合各种商业用途和项目展示，画质清晰，内容丰富。',
  '专业拍摄的视频素材，完美适合广告、宣传片、产品展示等多种场景使用。',
  '精心制作的视频内容，提供优秀的视觉效果，是您项目的理想选择。',
  '多场景拍摄，内容丰富多样，适合各种创意项目和商业应用。',
  '高品质视频素材，专业级制作水准，为您的项目添加专业视觉效果。',
  '创意视频素材，独特的视觉表现力，适合现代化项目和时尚品牌使用。',
  '实用性强的视频素材，广泛适用于各类媒体制作和网络营销需求。',
  '优质视频内容，经过精心编辑和后期处理，确保最佳视觉体验。'
];

// 随机标签组合
const tagGroups = [
  ['高清', '4K', '专业', '商用'],
  ['创意', '现代', '时尚', '潮流'],
  ['自然', '清新', '生态', '环保'],
  ['科技', '未来', '数字', '创新'],
  ['商务', '办公', '企业', '专业'],
  ['艺术', '创作', '设计', '美学'],
  ['动态', '活力', '动感', '节奏'],
  ['温馨', '生活', '日常', '真实'],
  ['精品', '优质', '高端', '品质'],
  ['实用', '通用', '多用途', '灵活']
];

// 生成随机价格 (1-50元)
const getRandomPrice = (): number => {
  const prices = [1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 12.99, 15.99, 19.99, 24.99, 29.99, 39.99, 49.99];
  return prices[Math.floor(Math.random() * prices.length)];
};

// 生成随机标题
const generateRandomTitle = (): string => {
  const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
  const suffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
  return `${prefix}${suffix}`;
};

// 生成随机描述
const generateRandomDescription = (): string => {
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

// 生成随机标签
const generateRandomTags = (): string[] => {
  const tagGroup = tagGroups[Math.floor(Math.random() * tagGroups.length)];
  // 从选中的标签组中随机选择2-4个标签
  const numTags = Math.floor(Math.random() * 3) + 2; // 2-4个标签
  const shuffled = [...tagGroup].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
};

// 生成随机分类
const getRandomCategory = (): string => {
  return categories[Math.floor(Math.random() * categories.length)];
};

// 估算视频时长（基于文件大小的简单估算）
const estimateDuration = (fileSize: number): number => {
  // 粗略估算：每MB约对应8-12秒的视频
  const mbSize = fileSize / (1024 * 1024);
  const baseDuration = Math.floor(mbSize * 10); // 基础时长
  const variation = Math.floor(Math.random() * 6) - 3; // -3到+3的随机变化
  return Math.max(5, baseDuration + variation); // 最少5秒
};

// 生成随机缩略图URL（使用Unsplash的随机图片）
const generateThumbnailUrl = (): string => {
  const topics = ['technology', 'nature', 'city', 'business', 'abstract', 'education', 'people', 'lifestyle'];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const imageId = Math.floor(Math.random() * 1000) + 1;
  return `https://picsum.photos/400/225?random=${imageId}&blur=1`;
};

const uploadVideoFiles = async () => {
  try {
    console.log('🎬 Starting batch video upload...');
    
    // 获取video目录中的所有MP4文件
    const videoDir = path.join(process.cwd(), '../video');
    const files = fs.readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
    
    if (files.length === 0) {
      console.log('❌ No video files found in video directory');
      return;
    }
    
    console.log(`📁 Found ${files.length} video files`);
    
    // 为每个视频文件生成随机信息
    const videoData = [];
    
    for (const file of files) {
      const filePath = path.join(videoDir, file);
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      const videoInfo = {
        title: generateRandomTitle(),
        description: generateRandomDescription(),
        category: getRandomCategory(),
        price: getRandomPrice(),
        thumbnailUrl: generateThumbnailUrl(),
        videoUrl: `/video/${file}`, // 使用现有的静态文件路径
        duration: estimateDuration(fileSize),
        fileSize: fileSize,
        tags: generateRandomTags()
      };
      
      videoData.push(videoInfo);
      
      console.log(`📹 Prepared: ${file} -> ${videoInfo.title} (${videoInfo.category})`);
    }
    
    // 检查是否已存在视频，避免重复添加
    const existingVideos = await Video.find({
      videoUrl: { $in: videoData.map(v => v.videoUrl) }
    });
    
    if (existingVideos.length > 0) {
      console.log(`⚠️  Found ${existingVideos.length} existing videos, removing duplicates...`);
      const existingUrls = new Set(existingVideos.map(v => v.videoUrl));
      const newVideoData = videoData.filter(v => !existingUrls.has(v.videoUrl));
      
      if (newVideoData.length === 0) {
        console.log('✅ All videos already exist in database');
        return;
      }
      
      console.log(`📊 Will add ${newVideoData.length} new videos`);
      await Video.insertMany(newVideoData);
    } else {
      // 批量插入到数据库
      await Video.insertMany(videoData);
    }
    
    console.log(`✅ Successfully uploaded ${videoData.length} videos to database`);
    
    // 显示统计信息
    const categoryCount = videoData.reduce((acc, video) => {
      acc[video.category] = (acc[video.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Upload Statistics:');
    console.log(`Total videos: ${videoData.length}`);
    console.log('Categories:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} videos`);
    });
    
    const totalSize = videoData.reduce((sum, v) => sum + v.fileSize, 0);
    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    const priceRange = {
      min: Math.min(...videoData.map(v => v.price)),
      max: Math.max(...videoData.map(v => v.price)),
      avg: (videoData.reduce((sum, v) => sum + v.price, 0) / videoData.length).toFixed(2)
    };
    console.log(`Price range: ¥${priceRange.min} - ¥${priceRange.max} (avg: ¥${priceRange.avg})`);
    
  } catch (error) {
    console.error('❌ Failed to upload videos:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await uploadVideoFiles();
    console.log('\n🎉 Batch video upload completed successfully!');
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

export { uploadVideoFiles };