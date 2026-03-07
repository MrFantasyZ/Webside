import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Purchase from '../models/Purchase';
import Video from '../models/Video';
import Cart from '../models/Cart';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';
import { createPaymentUrl } from '../services/gopayService';
import { awardCommission } from '../utils/commission';

const router = express.Router();

// Create order from cart
router.post('/create-order', protect, [
  body('paymentMethod').isIn(['alipay', 'wechat', 'qq', 'free']).withMessage('Invalid payment method')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentMethod, useFreeCoupon, luckyCoinsAmount } = req.body;
    const userId = req.user!._id;
    const userRecord = await User.findById(userId);
    if (!userRecord) throw new Error('用户不存在');

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.videoId');
    if (!cart || cart.items.length === 0) throw new Error('购物车为空');

    const videoIds = cart.items.map(item => item.videoId._id);
    const existingPurchases = await Purchase.find({
      userId,
      videoId: { $in: videoIds },
      paymentStatus: 'completed'
    }).distinct('videoId');

    if (existingPurchases.length > 0) throw new Error('购物车中包含已拥有的视频');

    // Validate free coupon usage
    if (useFreeCoupon) {
      if (userRecord.freeCoupons < 1) throw new Error('没有可用的免费购买券');
      if (cart.items.length !== 1) throw new Error('免费购买券只能用于购买单个视频');
    }

    // Calculate totals
    const totalAmount = cart.items.reduce((sum, item: any) => sum + (item.videoId?.price || 0), 0);
    const coinsToUse = Math.min(Math.max(0, luckyCoinsAmount || 0), userRecord.luckyCoins, totalAmount);
    const couponDiscount = useFreeCoupon ? totalAmount : 0;
    const finalAmount = Math.max(0, totalAmount - couponDiscount - coinsToUse);

    if (finalAmount === 0 && paymentMethod !== 'free') throw new Error('免费订单请使用 free 支付方式');

    const orderId = `ORDER_${Date.now()}_${userId}`;
    const now = new Date();

    if (finalAmount === 0) {
      // 免费订单：直接标记为完成
      const purchaseDocs = cart.items.map(item => ({
        userId,
        videoId: item.videoId._id,
        orderId,
        paymentStatus: 'completed' as const,
        paymentMethod: 'free' as const,
        amount: useFreeCoupon ? 0 : (item.videoId as any).price - coinsToUse,
        usedFreeCoupon: !!useFreeCoupon,
        luckyCoinsUsed: coinsToUse,
        commissionAwarded: false,
        purchaseTime: now,
        downloadExpiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000)
      }));

      const createdPurchases = await Purchase.insertMany(purchaseDocs);

      // 扣除资源
      const updateFields: any = {};
      if (useFreeCoupon) updateFields.$inc = { freeCoupons: -1 };
      if (coinsToUse > 0) {
        if (updateFields.$inc) updateFields.$inc.luckyCoins = -coinsToUse;
        else updateFields.$inc = { luckyCoins: -coinsToUse };
      }
      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(userId, updateFields);
      }

      // 清空购物车
      await Cart.findOneAndUpdate({ userId }, { items: [] });

      // 发放佣金（非免费劵订单才发放）
      if (!useFreeCoupon) {
        for (const p of createdPurchases) {
          await awardCommission((userId as any).toString(), p.videoId.toString(), (p._id as any).toString());
        }
      }

      return res.json({
        message: '订单创建成功',
        orderId,
        paymentUrl: null,
        freeOrder: true,
        totalAmount: finalAmount,
        purchases: createdPurchases.map(p => p._id)
      });
    }

    // 需要付款的订单
    const purchaseDocs = cart.items.map(item => ({
      userId,
      videoId: item.videoId._id,
      orderId,
      paymentStatus: 'pending' as const,
      paymentMethod,
      amount: (item.videoId as any).price,
      usedFreeCoupon: false,
      luckyCoinsUsed: coinsToUse,
      commissionAwarded: false,
      purchaseTime: now,
      downloadExpiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000)
    }));

    await Purchase.insertMany(purchaseDocs);

    // 预扣幸运币（防止重复使用）
    if (coinsToUse > 0) {
      await User.findByIdAndUpdate(userId, { $inc: { luckyCoins: -coinsToUse } });
    }

    const serverUrl = process.env.SERVER_URL || 'https://qihuanshijie.xyz';
    const frontendUrl = process.env.FRONTEND_URL || 'https://qihuanshijie.xyz';
    const paymentUrl = createPaymentUrl({
      orderId,
      amount: finalAmount,
      paymentMethod,
      notifyUrl: `${serverUrl}/api/payments/notify`,
      returnUrl: `${frontendUrl}/payment/result?orderId=${orderId}`,
      productName: '奇幻世界视频素材'
    });

    res.json({
      message: '订单创建成功',
      orderId,
      paymentUrl,
      totalAmount: finalAmount,
      purchases: purchaseDocs.map((_, i) => i)
    });

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