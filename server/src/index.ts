import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './config/database';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import cartRoutes from './routes/cart';
import purchaseRoutes from './routes/purchases';
import smsRoutes from './routes/sms';
import categoriesRoutes from './routes/categories';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure trust proxy for rate limiting
app.set('trust proxy', 1);

connectDB();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:"], // 允许视频和音频
      objectSrc: ["'none'"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 开发环境允许更多请求
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/', authLimiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3005', 'http://localhost:3010'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/video', express.static(path.join(__dirname, '../../video')));

// 添加调试日志
console.log('Static file paths:');
console.log('Uploads path:', path.join(__dirname, '../uploads'));
console.log('Video path:', path.join(__dirname, '../../video'));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;