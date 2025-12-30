import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import SmsCode from '../models/SmsCode';
import { generateSmsCode, sendSmsCode } from '../services/smsService';

const router = express.Router();

// 短信验证码专用限流：每个IP每小时最多发送10条，每个手机号每小时最多5条
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 每个IP限制10条/小时
  message: '发送验证码过于频繁，请1小时后重试',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/sms/send-code
 * 发送手机验证码
 */
router.post('/send-code', 
  smsLimiter,
  [
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '输入数据有误',
          errors: errors.array()
        });
      }

      const { phone } = req.body;

      // 检查该手机号是否在过去1分钟内已发送过验证码
      const recentCode = await SmsCode.findOne({
        phone,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
      });

      if (recentCode) {
        return res.status(429).json({
          message: '验证码发送过于频繁，请1分钟后重试'
        });
      }

      // 删除该手机号之前未使用的验证码
      await SmsCode.deleteMany({ phone, verified: false });

      // 生成新验证码
      const code = generateSmsCode();

      // 保存验证码到数据库
      const smsCode = new SmsCode({
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟过期
      });
      await smsCode.save();

      // 发送短信
      const smsResult = await sendSmsCode(phone, code);

      if (!smsResult.success) {
        // 发送失败，删除验证码记录
        await SmsCode.deleteOne({ _id: smsCode._id });
        return res.status(500).json({
          message: smsResult.message
        });
      }

      res.json({
        message: '验证码已发送，请注意查收',
        // 开发环境返回验证码用于测试
        ...(process.env.NODE_ENV !== 'production' && { code: smsResult.code })
      });

    } catch (error) {
      console.error('发送验证码失败:', error);
      res.status(500).json({
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * POST /api/sms/login
 * 手机号验证码登录
 */
router.post('/login',
  [
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('验证码必须为6位数字')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '输入数据有误',
          errors: errors.array()
        });
      }

      const { phone, code } = req.body;

      // 查找有效的验证码
      const smsCode = await SmsCode.findOne({
        phone,
        code,
        verified: false,
        expiresAt: { $gt: new Date() }
      });

      if (!smsCode) {
        return res.status(400).json({
          message: '验证码错误或已过期'
        });
      }

      // 标记验证码已使用
      await SmsCode.updateOne(
        { _id: smsCode._id },
        { verified: true }
      );

      // 查找或创建用户
      let user = await User.findOne({ phone });
      
      if (!user) {
        // 如果用户不存在，创建新用户
        const username = `user_${phone.slice(-4)}_${Date.now()}`;
        user = new User({
          username,
          phone,
          password: Math.random().toString(36).substring(2, 15) // 随机密码，手机登录用户不需要
        });
        await user.save();
      }

      // 生成JWT token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email
        }
      });

    } catch (error) {
      console.error('手机验证码登录失败:', error);
      res.status(500).json({
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * POST /api/sms/bind-phone
 * 为现有用户绑定手机号（需要登录）
 */
router.post('/bind-phone',
  // 这里需要添加身份验证中间件，暂时省略
  [
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('验证码必须为6位数字')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '输入数据有误',
          errors: errors.array()
        });
      }

      // 实现绑定手机号逻辑...
      res.json({ message: '手机号绑定功能待完善' });

    } catch (error) {
      console.error('绑定手机号失败:', error);
      res.status(500).json({
        message: '服务器内部错误'
      });
    }
  }
);

export default router;