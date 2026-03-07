import express, { Request, Response } from 'express';
import Purchase from '../models/Purchase';
import Cart from '../models/Cart';
import { verifyNotification, queryGopayOrderStatus } from '../services/gopayService';
import { awardCommission } from '../utils/commission';

const router = express.Router();

// GoPay 异步回调通知处理（支持 GET/POST）
async function handleNotify(req: Request, res: Response) {
  try {
    const params = (Object.keys(req.query).length > 0
      ? req.query
      : req.body) as Record<string, string>;
    console.log('GoPay notify received:', params);

    // 验证签名，防止伪造请求
    if (!verifyNotification(params)) {
      console.error('GoPay notify: invalid signature');
      return res.send('fail');
    }

    const { out_trade_no, trade_no, trade_status } = params;

    // 只处理支付成功的通知
    if (trade_status !== 'TRADE_SUCCESS') {
      return res.send('success');
    }

    // 根据 orderId 找到对应的所有购买记录
    const purchases = await Purchase.find({
      orderId: out_trade_no,
      paymentStatus: 'pending'
    });

    if (purchases.length === 0) {
      console.log('GoPay notify: no pending purchases found for orderId:', out_trade_no);
      return res.send('success');
    }

    // 标记所有关联购买记录为已完成
    await Purchase.updateMany(
      { orderId: out_trade_no, paymentStatus: 'pending' },
      {
        paymentStatus: 'completed',
        transactionId: trade_no,
        downloadExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    );

    // 清空该用户的购物车
    const userId = purchases[0].userId;
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    // 发放邀请佣金（非免费劵购买）
    for (const p of purchases) {
      if (!p.usedFreeCoupon) {
        await awardCommission(p.userId.toString(), p.videoId.toString(), p._id.toString());
      }
    }

    console.log(`GoPay notify: order ${out_trade_no} completed, ${purchases.length} purchases updated`);

    res.send('success');

  } catch (error) {
    console.error('GoPay notify error:', error);
    res.send('fail');
  }
}

router.get('/notify', handleNotify);
router.post('/notify', handleNotify);

// GoPay 同步跳转通知（用户支付完成后页面跳转到此）
router.get('/return', async (req: Request, res: Response) => {
  const { out_trade_no } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/payment/result?orderId=${out_trade_no}`);
});

// 前端轮询接口：查询订单支付状态（含 GoPay 主动查询备用逻辑）
router.get('/status/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const purchases = await Purchase.find({ orderId });

    if (purchases.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const allCompleted = purchases.every(p => p.paymentStatus === 'completed');
    const anyFailed = purchases.some(p => p.paymentStatus === 'failed');

    if (allCompleted) {
      return res.json({ orderId, status: 'completed', purchases: purchases.length });
    }

    if (anyFailed) {
      return res.json({ orderId, status: 'failed', purchases: purchases.length });
    }

    // 订单还是 pending：主动向 GoPay 查询是否已支付（notify_url 可能未被调用）
    const gopayResult = await queryGopayOrderStatus(orderId);
    if (gopayResult.paid) {
      await Purchase.updateMany(
        { orderId, paymentStatus: 'pending' },
        { paymentStatus: 'completed', transactionId: gopayResult.tradeNo,
          downloadExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) }
      );
      const userId = purchases[0].userId;
      await Cart.findOneAndUpdate({ userId }, { items: [] });

      // 发放邀请佣金
      const updatedPurchases = await Purchase.find({ orderId });
      for (const p of updatedPurchases) {
        if (!p.usedFreeCoupon) {
          await awardCommission(p.userId.toString(), p.videoId.toString(), p._id.toString());
        }
      }

      console.log(`GoPay poll: order ${orderId} confirmed paid via API query`);
      return res.json({ orderId, status: 'completed', purchases: purchases.length });
    }

    res.json({ orderId, status: 'pending', purchases: purchases.length });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
