import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnailUrl: string;
  videoUrl: string;
  duration?: number;
  fileSize?: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    min: 0
  },
  fileSize: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

VideoSchema.index({ title: 'text', description: 'text', tags: 'text' });
VideoSchema.index({ category: 1 });
VideoSchema.index({ price: 1 });
VideoSchema.index({ createdAt: -1 });
VideoSchema.index({ isActive: 1 });

export default mongoose.model<IVideo>('Video', VideoSchema);