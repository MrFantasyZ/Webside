import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  videoId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const CartItemSchema = new Schema({
  videoId: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const CartSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema]
}, {
  timestamps: true
});

CartSchema.index({ userId: 1 });

export default mongoose.model<ICart>('Cart', CartSchema);