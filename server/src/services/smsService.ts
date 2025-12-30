/**
 * SMS服务 - 用于发送手机验证码
 * 注意：这是模拟实现，生产环境需要集成真实的短信服务提供商
 * 如：阿里云短信服务、腾讯云短信、网易云信等
 */

export interface SmsResponse {
  success: boolean;
  message: string;
  code?: string; // 开发环境返回验证码用于测试
}

/**
 * 生成6位数字验证码
 */
export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 发送短信验证码 (模拟实现)
 * 生产环境需要替换为真实的SMS API调用
 */
export async function sendSmsCode(phone: string, code: string): Promise<SmsResponse> {
  try {
    // 模拟发送过程
    console.log(`📱 [SMS] 发送验证码到 ${phone}: ${code}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 在开发环境中，我们假设发送总是成功的
    if (process.env.NODE_ENV !== 'production') {
      return {
        success: true,
        message: '验证码发送成功',
        code: code // 开发环境返回验证码用于测试
      };
    }
    
    // 生产环境的实现示例：
    // const result = await aliCloudSms.send({
    //   phone: phone,
    //   templateCode: 'SMS_XXXXXXX',
    //   templateParam: { code: code }
    // });
    
    return {
      success: true,
      message: '验证码发送成功'
    };
    
  } catch (error) {
    console.error('短信发送失败:', error);
    return {
      success: false,
      message: '验证码发送失败，请稍后重试'
    };
  }
}

/**
 * 生产环境短信服务配置示例
 */
export const SMS_CONFIG = {
  // 阿里云短信服务配置示例
  aliyun: {
    accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
    signName: '过足瘾',
    templateCode: 'SMS_XXXXXXX' // 需要在阿里云申请模板
  },
  
  // 腾讯云短信服务配置示例  
  tencent: {
    secretId: process.env.TENCENT_SMS_SECRET_ID || '',
    secretKey: process.env.TENCENT_SMS_SECRET_KEY || '',
    smsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID || '',
    signName: '过足瘾',
    templateId: 'XXXXXXX' // 需要在腾讯云申请模板
  }
};