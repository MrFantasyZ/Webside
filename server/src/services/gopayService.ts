import crypto from 'crypto';

// MD5 签名计算（GoPay 标准签名方式）
export function calculateSign(params: Record<string, string>): string {
  const gopayKey = process.env.GOPAY_KEY || '';
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '')
    .sort();

  const paramStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  const signStr = `${paramStr}${gopayKey}`;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 生成 GoPay 支付跳转 URL
export function createPaymentUrl(params: {
  orderId: string;
  amount: number;
  paymentMethod: 'alipay' | 'wechat';
  notifyUrl: string;
  returnUrl: string;
  productName: string;
}): string {
  const gopayBaseUrl = process.env.GOPAY_API_URL || 'https://pay.mymzf.com';
  const gopayPid = process.env.GOPAY_PID || '12545';
  const type = params.paymentMethod === 'alipay' ? 'alipay' : 'wxpay';

  const requestParams: Record<string, string> = {
    pid: gopayPid,
    type,
    out_trade_no: params.orderId,
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    name: params.productName,
    money: params.amount.toFixed(2),
    sitename: '奇幻世界',
  };

  const sign = calculateSign(requestParams);
  requestParams.sign = sign;
  requestParams.sign_type = 'MD5';

  const queryString = new URLSearchParams(requestParams).toString();
  return `${gopayBaseUrl}/xpay/epay/submit.php?${queryString}`;
}

// 验证 GoPay 回调通知的签名
export function verifyNotification(params: Record<string, string>): boolean {
  const { sign, sign_type, ...rest } = params;
  if (!sign) return false;
  const expectedSign = calculateSign(rest);
  return sign === expectedSign;
}
