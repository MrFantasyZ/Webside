// VIP Token Crypto Utilities
// 使用 HMAC-SHA256 生成和验证 JWT token

// 密钥 - 在生产环境中应该更复杂和保密
const SECRET_KEY = 'qihuanshijie-vip-secret-key-2026-ultra-secure';

// Token 有效期：30天（毫秒）
const TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000;

/**
 * 将字符串转换为 Base64URL 编码
 */
function base64UrlEncode(str) {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * 将 Base64URL 解码为字符串
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

/**
 * 使用 Web Crypto API 生成 HMAC-SHA256 签名
 */
async function hmacSHA256(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // 转换为 hex 字符串
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * 生成 VIP Token（JWT格式）
 */
async function generateVIPToken() {
  // 生成唯一用户ID（基于时间戳和随机数）
  const userId = `vip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 过期时间
  const expiresAt = Date.now() + TOKEN_EXPIRY;

  // JWT Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // JWT Payload
  const payload = {
    userId: userId,
    role: 'vip',
    iat: Date.now(), // issued at
    exp: expiresAt,   // expiration
    jti: Math.random().toString(36).substr(2, 16) // JWT ID (防止重放)
  };

  // 编码 header 和 payload
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

  // 生成签名
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  const signature = await hmacSHA256(signatureInput, SECRET_KEY);
  const signatureEncoded = base64UrlEncode(signature);

  // 组合 JWT
  const token = `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;

  return {
    token: token,
    userId: userId,
    expiresAt: expiresAt
  };
}

/**
 * 验证 Token 是否有效
 */
async function validateVIPToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid token format' };
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

    // 验证签名
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = await hmacSHA256(signatureInput, SECRET_KEY);
    const expectedSignatureEncoded = base64UrlEncode(expectedSignature);

    if (signatureEncoded !== expectedSignatureEncoded) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // 解码 payload
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));

    // 检查过期时间
    if (payload.exp < Date.now()) {
      return { valid: false, reason: 'Token expired' };
    }

    return {
      valid: true,
      payload: payload
    };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

/**
 * 获取或创建 Token
 */
async function getOrCreateToken() {
  // 从 chrome.storage 获取现有 token
  const result = await chrome.storage.local.get(['vipToken', 'tokenData']);

  if (result.vipToken && result.tokenData) {
    // 验证现有 token
    const validation = await validateVIPToken(result.vipToken);

    if (validation.valid) {
      return {
        token: result.vipToken,
        ...result.tokenData
      };
    }
  }

  // 生成新 token
  const tokenData = await generateVIPToken();

  // 保存到 storage
  await chrome.storage.local.set({
    vipToken: tokenData.token,
    tokenData: {
      userId: tokenData.userId,
      expiresAt: tokenData.expiresAt
    }
  });

  return tokenData;
}
