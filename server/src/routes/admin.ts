import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Video from '../models/Video';
import User from '../models/User';
import Purchase from '../models/Purchase';
import { protect, AuthRequest, requireSuperAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv|jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传视频文件和图片文件'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Get all videos for admin (including inactive ones)
router.get('/videos', protect, requireSuperAdmin, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().escape(),
  query('category').optional().trim().escape(),
  query('status').optional().isIn(['all', 'active', 'inactive']),
  query('sortBy').optional().isIn(['createdAt', 'price', 'title']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string || 'all';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const skip = (page - 1) * limit;

    // Build query for admin - can see all videos
    let query: any = {};
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    // 'all' shows both active and inactive
    
    if (search) {
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
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
      Video.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      videos,
      pagination: {
        current: page,
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get admin videos error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete video
router.delete('/videos/:id', protect, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    // Delete the actual files if they exist
    try {
      const videoPath = path.join(process.cwd(), '..', video.videoUrl);
      const thumbnailPath = path.join(process.cwd(), '..', video.thumbnailUrl);
      
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      if (fs.existsSync(thumbnailPath) && thumbnailPath !== videoPath) {
        fs.unlinkSync(thumbnailPath);
      }
    } catch (fileError) {
      console.warn('Failed to delete files:', fileError);
    }

    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: '视频删除成功' });

  } catch (error: any) {
    console.error('Delete video error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update video
router.put('/videos/:id', protect, requireSuperAdmin, 
  upload.fields([
    { name: 'video', maxCount: 1 }, 
    { name: 'thumbnail', maxCount: 1 }
  ]), [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }),
  body('category').optional().trim().isLength({ min: 1 }),
  body('price').optional().isFloat({ min: 0 }),
  body('tags').optional().isArray(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updateData: any = {};

    // Update text fields
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.tags) {
      updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
    }

    // Handle file uploads
    if (files?.video && files.video[0]) {
      const videoFile = files.video[0];
      updateData.videoUrl = `/uploads/${videoFile.filename}`;
      updateData.fileSize = videoFile.size;
      
      // Delete old video file
      try {
        const oldVideoPath = path.join(process.cwd(), '..', video.videoUrl);
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
      } catch (error) {
        console.warn('Failed to delete old video file:', error);
      }
    }

    if (files?.thumbnail && files.thumbnail[0]) {
      const thumbnailFile = files.thumbnail[0];
      updateData.thumbnailUrl = `/uploads/${thumbnailFile.filename}`;
      
      // Delete old thumbnail file if different from video
      try {
        const oldThumbnailPath = path.join(process.cwd(), '..', video.thumbnailUrl);
        if (fs.existsSync(oldThumbnailPath) && oldThumbnailPath !== path.join(process.cwd(), '..', video.videoUrl)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      } catch (error) {
        console.warn('Failed to delete old thumbnail file:', error);
      }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );

    res.json({ 
      message: '视频更新成功',
      video: updatedVideo 
    });

  } catch (error: any) {
    console.error('Update video error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Toggle video active status (上架/下架)
router.patch('/videos/:id/toggle-status', protect, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    video.isActive = !video.isActive;
    await video.save();

    res.json({ 
      message: video.isActive ? '视频已上架' : '视频已下架',
      video: {
        _id: video._id,
        isActive: video.isActive
      }
    });

  } catch (error: any) {
    console.error('Toggle video status error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Download video (admin can download any video)
router.get('/videos/:id/download', protect, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    // Convert URL path to file system path
    // video.videoUrl is like "/video/AF_1.mp4", we need to map it to the actual file system path
    let videoPath;
    if (video.videoUrl.startsWith('/video/')) {
      // For videos in the /video directory (mounted volume)
      videoPath = path.join('/video', video.videoUrl.substring('/video/'.length));
    } else if (video.videoUrl.startsWith('/uploads/')) {
      // For uploaded videos in the /uploads directory
      videoPath = path.join(process.cwd(), video.videoUrl);
    } else {
      // Fallback to the original logic
      videoPath = path.join(process.cwd(), '..', video.videoUrl);
    }
    
    console.log('Video download request:', {
      videoId: req.params.id,
      videoUrl: video.videoUrl,
      videoPath,
      exists: fs.existsSync(videoPath)
    });
    
    if (!fs.existsSync(videoPath)) {
      console.error('Video file not found:', videoPath);
      return res.status(404).json({ message: '视频文件不存在' });
    }

    // Set headers for file download
    // Encode filename for HTTP header compatibility
    const filename = `${video.title}.mp4`;
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', 'video/mp4');
    
    // Stream the file
    const fileStream = fs.createReadStream(videoPath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('Download video error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new video
router.post('/videos', protect, requireSuperAdmin,
  upload.fields([
    { name: 'video', maxCount: 1 }, 
    { name: 'thumbnail', maxCount: 1 }
  ]), [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1, max: 1000 }),
  body('category').trim().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('tags').optional().isArray(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files?.video || !files.video[0]) {
      return res.status(400).json({ message: '视频文件是必需的' });
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail?.[0];

    const videoData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: parseFloat(req.body.price),
      videoUrl: `/uploads/${videoFile.filename}`,
      thumbnailUrl: thumbnailFile ? `/uploads/${thumbnailFile.filename}` : `/uploads/${videoFile.filename}`,
      fileSize: videoFile.size,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : [],
      isActive: true
    };

    const video = await Video.create(videoData);

    res.status(201).json({ 
      message: '视频创建成功',
      video 
    });

  } catch (error: any) {
    console.error('Create video error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get video statistics
router.get('/stats', protect, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalVideos,
      activeVideos,
      inactiveVideos,
      categoryStats
    ] = await Promise.all([
      Video.countDocuments(),
      Video.countDocuments({ isActive: true }),
      Video.countDocuments({ isActive: false }),
      Video.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    res.json({
      overview: {
        totalVideos,
        activeVideos,
        inactiveVideos
      },
      categories: categoryStats.map(cat => ({
        name: cat._id,
        count: cat.count,
        avgPrice: Math.round(cat.avgPrice * 100) / 100
      }))
    });

  } catch (error: any) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user consumption rankings (月/年)
router.get('/user-consumption-ranking', protect, requireSuperAdmin, [
  query('period').isIn(['month', 'year']).withMessage('Period must be month or year')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const period = req.query.period as string;
    const now = new Date();
    let startDate: Date;

    if (period === 'month') {
      // 当前月的第一天
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // 当前年的第一天
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const ranking = await Purchase.aggregate([
      {
        $match: {
          purchaseTime: { $gte: startDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalConsumption: { $sum: '$amount' },
          purchaseCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          username: '$user.username',
          email: '$user.email',
          totalConsumption: 1,
          purchaseCount: 1
        }
      },
      {
        $sort: { totalConsumption: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      period,
      ranking: ranking.map((item, index) => ({
        rank: index + 1,
        userId: item._id,
        username: item.username,
        email: item.email,
        totalConsumption: item.totalConsumption,
        purchaseCount: item.purchaseCount
      }))
    });

  } catch (error: any) {
    console.error('Get user consumption ranking error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user purchase frequency rankings (月/年)
router.get('/user-purchase-ranking', protect, requireSuperAdmin, [
  query('period').isIn(['month', 'year']).withMessage('Period must be month or year')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const period = req.query.period as string;
    const now = new Date();
    let startDate: Date;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const ranking = await Purchase.aggregate([
      {
        $match: {
          purchaseTime: { $gte: startDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$userId',
          purchaseCount: { $sum: 1 },
          totalConsumption: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          username: '$user.username',
          email: '$user.email',
          purchaseCount: 1,
          totalConsumption: 1
        }
      },
      {
        $sort: { purchaseCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      period,
      ranking: ranking.map((item, index) => ({
        rank: index + 1,
        userId: item._id,
        username: item.username,
        email: item.email,
        purchaseCount: item.purchaseCount,
        totalConsumption: item.totalConsumption
      }))
    });

  } catch (error: any) {
    console.error('Get user purchase ranking error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;