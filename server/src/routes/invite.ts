import express, { Response } from 'express';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET /api/invite/my-code - get or generate user's invite code
router.get('/my-code', protect, async (req: AuthRequest, res: Response) => {
  try {
    let user = req.user!;
    if (!user.inviteCode) {
      let code: string;
      let exists: boolean;
      do {
        code = generateCode();
        exists = !!(await User.findOne({ inviteCode: code }));
      } while (exists);

      await User.findByIdAndUpdate(user._id, { inviteCode: code });
      user = (await User.findById(user._id).select('-password'))!;
    }

    res.json({
      inviteCode: user.inviteCode,
      luckyCoins: user.luckyCoins,
      freeCoupons: user.freeCoupons
    });
  } catch (error) {
    console.error('Get invite code error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
