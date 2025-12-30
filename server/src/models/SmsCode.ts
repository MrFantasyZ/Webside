import mongoose, { Document, Schema } from 'mongoose';

export interface ISmsCode extends Document {
  phone: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const SmsCodeSchema: Schema = new Schema({
  phone: {
    type: String,
    required: true,
    match: [/^1[3-9]\d{9}$/, 'Please enter a valid phone number']
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5分钟后过期
    index: { expires: 0 } // MongoDB自动删除过期记录
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 创建复合索引确保每个手机号同时只能有一个有效验证码
SmsCodeSchema.index({ phone: 1, verified: 1 });

export default mongoose.model<ISmsCode>('SmsCode', SmsCodeSchema);