import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';

dotenv.config();

const defaultCategories = [
  { name: '科技', description: '科技相关的视频素材' },
  { name: '自然', description: '自然风景和生物的视频素材' },
  { name: '城市', description: '城市景观和建筑的视频素材' },
  { name: '人物', description: '人物相关的视频素材' },
  { name: '抽象', description: '抽象艺术和概念的视频素材' },
  { name: '商务', description: '商务办公相关的视频素材' },
  { name: '教育', description: '教育培训相关的视频素材' },
  { name: '娱乐', description: '娱乐休闲相关的视频素材' },
  { name: '其他', description: '其他类型的视频素材' }
];

const initCategories = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-video-store');
    console.log('Connected to MongoDB');

    // 清除现有分类（仅在开发环境）
    if (process.env.NODE_ENV !== 'production') {
      await Category.deleteMany({});
      console.log('Cleared existing categories');
    }

    // 创建默认分类
    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`Created category: ${categoryData.name}`);
      } else {
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    console.log('Categories initialization completed');
    process.exit(0);

  } catch (error) {
    console.error('Error initializing categories:', error);
    process.exit(1);
  }
};

initCategories();