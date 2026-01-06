import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import Video from '../models/Video';
import Purchase from '../models/Purchase';
import { protect, AuthRequest } from '../middleware/auth';
import { transformVideosForVIP, transformVideoForVIP, getDownloadUrl } from '../utils/vipContent';

const router = express.Router();

// Get all videos with pagination, search, and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('search').optional().trim().escape(),
  query('category').optional().trim().escape(),
  query('sortBy').optional().isIn(['createdAt', 'price', 'title']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const skip = (page - 1) * limit;

    // Build query - only show active videos for non-admin users
    let query: any = { isActive: true };
    
    if (search) {
      // 优先使用正则表达式搜索，对中文支持更好
      // 转义搜索词中的特殊字符，防止正则表达式错误
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapeRegex(search), 'i'); // 不区分大小写的正则表达式
      
      query.$or = [
        // 1. 搜索标题 (对于中文部分匹配效果好)
        { title: searchRegex },
        // 2. 搜索描述
        { description: searchRegex },
        // 3. 搜索标签
        { tags: { $in: [searchRegex] } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get videos with pagination
    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
        // Include videoUrl for development
      Video.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    // 根据 VIP 状态转换视频内容
    const isVIP = (req as any).isVIP || false;
    const transformedVideos = transformVideosForVIP(videos, isVIP);

    res.json({
      videos: transformedVideos,
      pagination: {
        current: page,
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get videos error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get video categories with count
router.get('/categories', async (req: Request, res: Response) => {
  try {
    // 获取所有分类及其视频数量 - 只统计已上架的视频
    const categoryStats = await Video.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 } // 按数量降序排列
      }
    ]);

    // 获取总视频数 - 只统计已上架的视频
    const totalVideos = await Video.countDocuments({ isActive: true });

    // 格式化返回数据
    const categories = categoryStats.map(stat => ({
      name: stat._id,
      count: stat.count
    }));

    // 添加"全部"选项
    const allCategories = [
      { name: '全部', count: totalVideos },
      ...categories
    ];

    res.json({ categories: allCategories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get video by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    // 根据 VIP 状态转换视频内容
    const isVIP = (req as any).isVIP || false;
    const transformedVideo = transformVideoForVIP(video, isVIP);

    res.json({ video: transformedVideo });

  } catch (error: any) {
    console.error('Get video error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get video download link (protected route)
router.get('/:id/download', protect, async (req: AuthRequest, res: Response) => {
  try {
    const videoId = req.params.id;
    const userId = req.user!._id;

    // ⚠️ 测试模式：跳过付费验证（记得测试完成后恢复）
    const TEST_MODE = true; // 设置为 false 以启用付费验证

    if (!TEST_MODE) {
      // Check if user has purchased this video
      const purchase = await Purchase.findOne({
        userId,
        videoId,
        paymentStatus: 'completed'
      });

      if (!purchase) {
        return res.status(403).json({ message: '您尚未购买此视频' });
      }

      // Check if download hasn't expired
      if (purchase.downloadExpiresAt < new Date()) {
        return res.status(403).json({ message: '下载链接已过期' });
      }

      // Check download limit
      if (purchase.downloadCount >= purchase.maxDownloads) {
        return res.status(403).json({ message: '已达到最大下载次数' });
      }

      // Update download count
      purchase.downloadCount += 1;
      purchase.isDownloaded = true;
      await purchase.save();
    }

    // Get video with download URL
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    // 根据 VIP 状态返回不同的下载 URL
    const isVIP = (req as any).isVIP || false;
    const downloadUrl = getDownloadUrl(video, isVIP);

    console.log(`[Download] Video: ${videoId}, User: ${userId}, VIP: ${isVIP}, URL: ${downloadUrl}`);

    res.json({
      downloadUrl,
      remainingDownloads: TEST_MODE ? 999 : 0, // 测试模式下显示 999
      expiresAt: TEST_MODE ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(), // 测试模式下1年有效期
      isVIP, // 用于调试，生产环境可移除
      testMode: TEST_MODE // 显示当前是否为测试模式
    });

  } catch (error: any) {
    console.error('Get download link error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's purchased videos
router.get('/user/purchases', protect, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user!._id;

    const [purchases, total] = await Promise.all([
      Purchase.find({ 
        userId, 
        paymentStatus: 'completed' 
      })
        .populate('videoId', 'title thumbnailUrl price category')
        .sort({ purchaseTime: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments({ 
        userId, 
        paymentStatus: 'completed' 
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    const purchasedVideos = purchases.map(purchase => ({
      purchaseId: purchase._id,
      video: purchase.videoId,
      purchaseTime: purchase.purchaseTime,
      downloadExpiresAt: purchase.downloadExpiresAt,
      isDownloaded: purchase.isDownloaded,
      downloadCount: purchase.downloadCount,
      maxDownloads: purchase.maxDownloads,
      canDownload: purchase.downloadExpiresAt > new Date() && 
                   purchase.downloadCount < purchase.maxDownloads,
      amount: purchase.amount
    }));

    res.json({
      purchases: purchasedVideos,
      pagination: {
        current: page,
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get user purchases error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get recommended videos (simple recommendation based on categories)
router.get('/recommendations/:id', async (req: Request, res: Response) => {
  try {
    const currentVideo = await Video.findById(req.params.id);
    if (!currentVideo) {
      return res.status(404).json({ message: '视频不存在' });
    }

    const recommendations = await Video.find({
      _id: { $ne: req.params.id },
      category: currentVideo.category
    })
      // Include videoUrl for development
      .limit(6)
      .sort({ createdAt: -1 });

    // 根据 VIP 状态转换视频内容
    const isVIP = (req as any).isVIP || false;
    const transformedRecommendations = transformVideosForVIP(recommendations, isVIP);

    res.json({ recommendations: transformedRecommendations });

  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;