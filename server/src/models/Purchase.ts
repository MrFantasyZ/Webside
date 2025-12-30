import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  purchaseTime: Date;
  downloadExpiresAt: Date;
  isDownloaded: boolean;
  downloadCount: number;
  maxDownloads: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'alipay' | 'wechat' | 'other';
  transactionId?: string;
  amount: number;
}

const PurchaseSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  purchaseTime: {
    type: Date,
    default: Date.now
  },
  downloadExpiresAt: {
    type: Date,
    required: true
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: 3
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['alipay', 'wechat', 'other'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

PurchaseSchema.index({ userId: 1, videoId: 1 });
PurchaseSchema.index({ downloadExpiresAt: 1 });
PurchaseSchema.index({ paymentStatus: 1 });

PurchaseSchema.pre<IPurchase>('save', function(next) {
  if (this.isNew && !this.downloadExpiresAt) {
    this.downloadExpiresAt = new Date(this.purchaseTime.getTime() + 48 * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);