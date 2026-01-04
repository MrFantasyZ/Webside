import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// VIP Token 密钥 - 必须与插件中的密钥一致
const SECRET_KEY = 'qihuanshijie-vip-secret-key-2026-ultra-secure';

// 扩展 Express Request 类型，添加 isVIP 属性
declare global {
  namespace Express {
    interface Request {
      isVIP?: boolean;
      vipUserId?: string;
    }
  }
}

/**
 * Base64URL 解码
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * 生成 HMAC-SHA256 签名
 */
function hmacSHA256(message: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

/**
 * Base64URL 编码
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 验证 JWT Token
 */
function validateJWTToken(token: string): { valid: boolean; payload?: any; reason?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid token format' };
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

    // 验证签名
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = hmacSHA256(signatureInput, SECRET_KEY);
    const expectedSignatureEncoded = base64UrlEncode(expectedSignature);

    if (signatureEncoded !== expectedSignatureEncoded) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // 解码 payload
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));

    // 检查过期时间
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false, reason: 'Token expired' };
    }

    // 检查必要字段
    if (!payload.userId || payload.role !== 'vip') {
      return { valid: false, reason: 'Invalid payload' };
    }

    return {
      valid: true,
      payload: payload
    };
  } catch (error) {
    return { valid: false, reason: (error as Error).message };
  }
}

/**
 * VIP 认证中间件
 *
 * 检查请求头中的 X-VIP-Token，验证后设置 req.isVIP 标志
 */
export const vipAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 默认为非 VIP
  req.isVIP = false;
  req.vipUserId = undefined;

  // 获取 Token
  const token = req.headers['x-vip-token'] as string;
  const clientVersion = req.headers['x-client-version'] as string;

  // 检查 Token 和客户端版本
  if (!token || clientVersion !== '2.0-premium') {
    console.log('[VIP Auth] No VIP token or invalid client version');
    return next();
  }

  // 验证 Token
  const validation = validateJWTToken(token);

  if (validation.valid && validation.payload) {
    req.isVIP = true;
    req.vipUserId = validation.payload.userId;
    console.log(`[VIP Auth] ✓ VIP user authenticated: ${req.vipUserId}`);
  } else {
    console.log(`[VIP Auth] ✗ Token validation failed: ${validation.reason}`);
  }

  next();
};

/**
 * 要求 VIP 的中间件（可选使用）
 *
 * 如果请求不是来自 VIP 用户，返回 403 错误
 */
export const requireVIP = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isVIP) {
    return res.status(403).json({
      success: false,
      message: '此功能仅限 VIP 会员访问'
    });
  }
  next();
};
