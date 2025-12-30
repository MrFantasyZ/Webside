import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User';
import { generateToken, protect, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';

const router = express.Router();

interface PasswordResetToken {
  [email: string]: {
    token: string;
    expires: Date;
  };
}

const passwordResetTokens: PasswordResetToken = {};

// Register
router.post('/register', [
  body('username').isLength({ min: 3, max: 30 }).trim().escape(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('Please enter a valid phone number')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, password, email, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: '用户名、邮箱或手机号已被使用' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      email,
      phone
    });

    const token = generateToken(String(user._id));

    // Send welcome email if email provided
    if (email) {
      await sendWelcomeEmail(email, username);
    }

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // Find user by username, email, or phone
    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        { phone: username }
      ]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        message: '用户名或密码错误' 
      });
    }

    const token = generateToken(String(user._id));

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      user: {
        id: req.user!._id,
        username: req.user!.username,
        email: req.user!.email,
        phone: req.user!.phone,
        role: req.user!.role,
        createdAt: req.user!.createdAt
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Please provide a valid email', 
        errors: errors.array() 
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: '该邮箱未注册' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    passwordResetTokens[email] = {
      token: resetToken,
      expires
    };

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (emailSent) {
      res.json({ 
        message: '密码重置邮件已发送' 
      });
    } else {
      res.status(500).json({ 
        message: '发送邮件失败，请稍后重试' 
      });
    }

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('newPassword').isLength({ min: 6 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { token, email, newPassword } = req.body;

    // Check if token exists and is valid
    const resetData = passwordResetTokens[email];
    if (!resetData || resetData.token !== token || resetData.expires < new Date()) {
      return res.status(400).json({ 
        message: '重置令牌无效或已过期' 
      });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: '用户不存在' 
      });
    }

    user.password = newPassword;
    await user.save();

    // Remove used token
    delete passwordResetTokens[email];

    res.json({ 
      message: '密码重置成功' 
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update profile
router.put('/profile', protect, [
  body('username').optional().isLength({ min: 3, max: 30 }).trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^1[3-9]\d{9}$/)
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, phone } = req.body;
    const userId = req.user!._id;

    // Check if username/email/phone already exists (excluding current user)
    if (username || email || phone) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: '用户名、邮箱或手机号已被使用' 
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...(username && { username }), ...(email && { email }), ...(phone && { phone }) },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: '个人信息更新成功',
      user: {
        id: updatedUser!._id,
        username: updatedUser!.username,
        email: updatedUser!.email,
        phone: updatedUser!.phone,
        role: updatedUser!.role,
        updatedAt: updatedUser!.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;