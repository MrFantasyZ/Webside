import mongoose from 'mongoose';
import User from '../models/User';
import Video from '../models/Video';
import Purchase from '../models/Purchase';

/**
 * Award 40% commission to the inviter of the buyer for a given purchase.
 * No-op if already awarded or buyer has no inviter.
 */
export async function awardCommission(
  buyerIdStr: string,
  videoIdStr: string,
  purchaseIdStr: string
): Promise<void> {
  try {
    // Prevent double-awarding
    const updated = await Purchase.findOneAndUpdate(
      { _id: purchaseIdStr, commissionAwarded: false },
      { commissionAwarded: true }
    );
    if (!updated) return;

    const buyer = await User.findById(buyerIdStr).select('invitedBy');
    if (!buyer?.invitedBy) return;

    const video = await Video.findById(videoIdStr).select('price');
    if (!video) return;

    const commission = Math.round(video.price * 0.4 * 100) / 100;
    await User.findByIdAndUpdate(buyer.invitedBy, { $inc: { luckyCoins: commission } });
    console.log(`[Commission] 用户 ${buyer.invitedBy} 获得幸运币 ${commission}（来自购买 ${videoIdStr}）`);
  } catch (error) {
    console.error('[Commission] 发放佣金失败:', error);
  }
}
