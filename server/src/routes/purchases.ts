import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Purchase from '../models/Purchase';
import Video from '../models/Video';
import Cart from '../models/Cart';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create order from cart
router.post('/create-order', protect, [
  body('paymentMethod').isIn(['alipay', 'wechat']).withMessage('Invalid payment method')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { paymentMethod } = req.body;
    const userId = req.user!._id;

    try {
      // Get user's cart
      const cart = await Cart.findOne({ userId }).populate('items.videoId');
      if (!cart || cart.items.length === 0) {
        throw new Error('购物车为空');
      }

      // Check if user already owns any videos in cart
      const videoIds = cart.items.map(item => item.videoId._id);
      const existingPurchases = await Purchase.find({
        userId,
        videoId: { $in: videoIds },
        paymentStatus: 'completed'
      }).distinct('videoId');

      if (existingPurchases.length > 0) {
        throw new Error('购物车中包含已拥有的视频');
      }

      // Calculate total amount
      const totalAmount = cart.items.reduce((sum, item: any) => 
        sum + (item.videoId?.price || 0), 0
      );

      // Create purchase records
      const purchases = cart.items.map(item => ({
        userId,
        videoId: item.videoId._id,
        paymentStatus: 'pending' as const,
        paymentMethod,
        amount: (item.videoId as any).price,
        purchaseTime: new Date(),
        downloadExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      }));

      const createdPurchases = await Purchase.insertMany(purchases);

      // Generate order ID (simplified - in production use proper payment gateway)
      const orderId = `ORDER_${Date.now()}_${userId}`;

      // In a real implementation, you would integrate with Alipay/WeChat Pay APIs here
      // For demo purposes, we'll simulate payment creation
      const paymentUrl = generateMockPaymentUrl(orderId, totalAmount, paymentMethod);

      res.json({
        message: '订单创建成功',
        orderId,
        paymentUrl,
        totalAmount,
        purchases: createdPurchases.map(p => p._id)
      });

    } catch (error) {
      throw error;
    }

  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: error.message || '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Simulate payment completion (in production, this would be a webhook from payment provider)
router.post('/complete-payment', protect, [
  body('orderId').notEmpty(),
  body('transactionId').notEmpty()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { orderId, transactionId } = req.body;
    const userId = req.user!._id;

    // In production, you would verify the payment with the payment provider here

    // Update purchase records to completed
    const updatedPurchases = await Purchase.updateMany(
      {
        userId,
        paymentStatus: 'pending',
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
      },
      {
        paymentStatus: 'completed',
        transactionId
      }
    );

    if (updatedPurchases.modifiedCount === 0) {
      return res.status(404).json({ message: '未找到待支付订单' });
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] }
    );

    res.json({
      message: '支付成功',
      purchasesUpdated: updatedPurchases.modifiedCount
    });

  } catch (error: any) {
    console.error('Complete payment error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's purchase history
router.get('/history', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      Purchase.find({ userId })
        .populate('videoId', 'title thumbnailUrl price category')
        .sort({ purchaseTime: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments({ userId })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      purchases: purchases.map(purchase => ({
        id: purchase._id,
        video: purchase.videoId,
        purchaseTime: purchase.purchaseTime,
        amount: purchase.amount,
        paymentStatus: purchase.paymentStatus,
        paymentMethod: purchase.paymentMethod,
        downloadExpiresAt: purchase.downloadExpiresAt,
        isDownloaded: purchase.isDownloaded,
        downloadCount: purchase.downloadCount,
        canDownload: purchase.paymentStatus === 'completed' && 
                     purchase.downloadExpiresAt > new Date() &&
                     purchase.downloadCount < purchase.maxDownloads
      })),
      pagination: {
        current: page,
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get purchase history error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single purchase details
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const purchaseId = req.params.id;

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      userId
    }).populate('videoId', 'title thumbnailUrl price category description');

    if (!purchase) {
      return res.status(404).json({ message: '购买记录不存在' });
    }

    res.json({
      purchase: {
        id: purchase._id,
        video: purchase.videoId,
        purchaseTime: purchase.purchaseTime,
        amount: purchase.amount,
        paymentStatus: purchase.paymentStatus,
        paymentMethod: purchase.paymentMethod,
        downloadExpiresAt: purchase.downloadExpiresAt,
        isDownloaded: purchase.isDownloaded,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        canDownload: purchase.paymentStatus === 'completed' && 
                     purchase.downloadExpiresAt > new Date() &&
                     purchase.downloadCount < purchase.maxDownloads,
        transactionId: purchase.transactionId
      }
    });

  } catch (error: any) {
    console.error('Get purchase error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to generate mock payment URL (replace with real payment integration)
function generateMockPaymentUrl(orderId: string, amount: number, method: string): string {
  const baseUrl = process.env.PAYMENT_CALLBACK_URL || 'http://localhost:3000';
  return `${baseUrl}/payment/mock?orderId=${orderId}&amount=${amount}&method=${method}`;
}

export default router;