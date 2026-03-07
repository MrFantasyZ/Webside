import Dypnsapi20170525, { SendSmsVerifyCodeRequest } from '@alicloud/dypnsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';

export interface SmsResponse {
  success: boolean;
  message: string;
  code?: string; // 阿里云返回的实际验证码，用于服务端保存核验
}

function createAliyunClient(): Dypnsapi20170525 {
  const config = new OpenApi.Config({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'dypnsapi.aliyuncs.com',
  });
  return new Dypnsapi20170525(config);
}

/**
 * 通过阿里云号码认证服务发送短信验证码
 * 验证码由阿里云生成并发送，通过 ReturnVerifyCode=true 返回给服务端保存核验
 */
export async function sendSmsCode(phone: string): Promise<SmsResponse> {
  // 开发环境：跳过真实发送，本地生成验证码方便调试
  if (process.env.NODE_ENV !== 'production') {
    const devCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SMS DEV] 验证码 -> ${phone}: ${devCode}`);
    return { success: true, message: '验证码发送成功', code: devCode };
  }

  try {
    const client = createAliyunClient();
    const request = new SendSmsVerifyCodeRequest({
      phoneNumber: phone,
      signName: process.env.ALIYUN_SMS_SIGN_NAME,
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code: '##code##', min: '5' }),
      codeLength: 6,
      codeType: 1,            // 1 = 纯数字
      returnVerifyCode: true, // 让阿里云把实际发送的验证码返回给服务端
    });

    const response = await client.sendSmsVerifyCode(request);
    const body = response?.body;

    if (!body || body.code !== 'OK') {
      console.error('[SMS] 阿里云返回错误:', body?.code, body?.message);
      return { success: false, message: `短信发送失败: ${body?.message ?? '未知错误'}` };
    }

    const verifyCode = (body.model as any)?.verifyCode as string | undefined;
    if (!verifyCode) {
      console.error('[SMS] 阿里云未返回验证码，请确认已开启 ReturnVerifyCode');
      return { success: false, message: '短信发送异常，请稍后重试' };
    }

    return { success: true, message: '验证码发送成功', code: verifyCode };

  } catch (error: any) {
    console.error('[SMS] 发送短信异常:', error?.message || error);
    return { success: false, message: '验证码发送失败，请稍后重试' };
  }
}