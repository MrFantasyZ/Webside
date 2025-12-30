import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category';
import Video from '../models/Video';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 检查管理员权限的中间件
const checkAdminPermission = (req: AuthRequest, res: Response, next: any) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

// 获取所有分类
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    res.json({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取所有分类（包含统计信息）
router.get('/with-stats', async (req: Request, res: Response) => {
  try {
    // 获取分类及其视频数量
    const categoryStats = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'videos',
          localField: 'name',
          foreignField: 'category',
          as: 'videos'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          count: { $size: '$videos' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // 获取总视频数
    const totalVideos = await Video.countDocuments();

    // 添加"全部"选项
    const allCategories = [
      { name: '全部', count: totalVideos },
      ...categoryStats
    ];

    res.json({ categories: allCategories });
  } catch (error: any) {
    console.error('Get categories with stats error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 创建新分类（需要管理员权限）
router.post('/', protect, checkAdminPermission, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('分类名称长度必须在1-50个字符之间'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('描述长度不能超过200个字符')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '验证失败', 
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;

    // 检查分类名称是否已存在
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: '分类名称已存在' });
    }

    const category = new Category({
      name,
      description
    });

    await category.save();

    res.status(201).json({ 
      message: '分类创建成功',
      category 
    });

  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 更新分类（需要管理员权限）
router.put('/:id', protect, checkAdminPermission, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('分类名称长度必须在1-50个字符之间'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('描述长度不能超过200个字符')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '验证失败', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }

    const oldName = category.name;

    // 如果名称发生变化，检查新名称是否已存在
    if (name !== oldName) {
      const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({ message: '分类名称已存在' });
      }
    }

    // 更新分类
    category.name = name;
    category.description = description;
    await category.save();

    // 如果分类名称发生变化，更新所有相关视频的分类字段
    if (name !== oldName) {
      await Video.updateMany({ category: oldName }, { category: name });
    }

    res.json({ 
      message: '分类更新成功',
      category 
    });

  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 删除分类（需要管理员权限）
router.delete('/:id', protect, checkAdminPermission, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }

    // 检查是否有视频使用该分类
    const videosCount = await Video.countDocuments({ category: category.name });
    if (videosCount > 0) {
      return res.status(400).json({ 
        message: `无法删除分类，有${videosCount}个视频正在使用该分类。请先将这些视频移至其他分类。` 
      });
    }

    // 软删除（设置为不活跃）而不是真正删除
    category.isActive = false;
    await category.save();

    res.json({ message: '分类删除成功' });

  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;