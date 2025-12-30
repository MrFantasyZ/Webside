import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Cart from '../models/Cart';
import Video from '../models/Video';
import Purchase from '../models/Purchase';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's cart
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.videoId',
      select: 'title price thumbnailUrl category'
    });

    if (!cart) {
      return res.json({ 
        cart: { items: [], total: 0, count: 0 } 
      });
    }

    // Filter out videos that user already owns
    const userPurchases = await Purchase.find({
      userId,
      paymentStatus: 'completed'
    }).distinct('videoId');

    const availableItems = cart.items.filter(item => 
      !userPurchases.some(purchaseVideoId => 
        purchaseVideoId.toString() === item.videoId._id.toString()
      )
    );

    // Update cart if items were filtered out
    if (availableItems.length !== cart.items.length) {
      cart.items = availableItems;
      await cart.save();
    }

    const total = availableItems.reduce((sum, item: any) => 
      sum + (item.videoId?.price || 0), 0
    );

    res.json({
      cart: {
        items: availableItems,
        total,
        count: availableItems.length
      }
    });

  } catch (error: any) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add item to cart
router.post('/add', protect, [
  body('videoId').isMongoId().withMessage('Invalid video ID')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { videoId } = req.body;
    const userId = req.user!._id;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    // Check if user already owns this video
    const existingPurchase = await Purchase.findOne({
      userId,
      videoId,
      paymentStatus: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({ message: '您已拥有此视频' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(item => 
      item.videoId.toString() === videoId
    );

    if (existingItem) {
      return res.status(400).json({ message: '视频已在购物车中' });
    }

    // Add item to cart
    cart.items.push({
      videoId,
      addedAt: new Date()
    });

    await cart.save();

    // Populate the cart for response
    await cart.populate({
      path: 'items.videoId',
      select: 'title price thumbnailUrl category'
    });

    const total = cart.items.reduce((sum, item: any) => 
      sum + (item.videoId?.price || 0), 0
    );

    res.json({
      message: '已添加到购物车',
      cart: {
        items: cart.items,
        total,
        count: cart.items.length
      }
    });

  } catch (error: any) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove item from cart
router.delete('/remove/:videoId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = req.user!._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: '购物车为空' });
    }

    // Remove item from cart
    cart.items = cart.items.filter(item => 
      item.videoId.toString() !== videoId
    );

    await cart.save();

    // Populate the cart for response
    await cart.populate({
      path: 'items.videoId',
      select: 'title price thumbnailUrl category'
    });

    const total = cart.items.reduce((sum, item: any) => 
      sum + (item.videoId?.price || 0), 0
    );

    res.json({
      message: '已从购物车中移除',
      cart: {
        items: cart.items,
        total,
        count: cart.items.length
      }
    });

  } catch (error: any) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Clear cart
router.delete('/clear', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { upsert: true }
    );

    res.json({
      message: '购物车已清空',
      cart: {
        items: [],
        total: 0,
        count: 0
      }
    });

  } catch (error: any) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;