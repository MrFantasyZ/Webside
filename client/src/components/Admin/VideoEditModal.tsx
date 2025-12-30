import React, { useState } from 'react';
import { X, Upload, Save, Loader } from 'lucide-react';
import { adminAPI, VideoUpdateData } from '../../services/adminAPI';

interface Video {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

interface Props {
  video: Video;
  onClose: () => void;
  onComplete: () => void;
}

const categories = [
  '科技', '自然', '城市', '人物', '抽象', 
  '商务', '教育', '娱乐', '其他'
];

const VideoEditModal: React.FC<Props> = ({ video, onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description,
    category: video.category,
    price: video.price,
    tags: video.tags.join(', ')
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData: VideoUpdateData = {};

      // Check what changed
      if (formData.title !== video.title) updateData.title = formData.title;
      if (formData.description !== video.description) updateData.description = formData.description;
      if (formData.category !== video.category) updateData.category = formData.category;
      if (formData.price !== video.price) updateData.price = formData.price;
      
      const newTags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const oldTagsStr = video.tags.sort().join(',');
      const newTagsStr = newTags.sort().join(',');
      if (oldTagsStr !== newTagsStr) updateData.tags = newTags;

      if (videoFile) updateData.video = videoFile;
      if (thumbnailFile) updateData.thumbnail = thumbnailFile;

      // Only make API call if something changed
      if (Object.keys(updateData).length === 0) {
        alert('没有检测到任何更改');
        return;
      }

      await adminAPI.updateVideo(video._id, updateData);
      alert('视频更新成功');
      onComplete();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setError('视频文件大小不能超过500MB');
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('缩略图文件大小不能超过10MB');
        return;
      }
      setThumbnailFile(file);
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">编辑视频</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Current Video Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前视频
            </label>
            <video
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              controls
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  required
                  maxLength={200}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格 (¥) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="例如: 高清, 素材, 商务"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  required
                  maxLength={1000}
                />
              </div>

              {/* Video File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  替换视频文件 (可选)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-orange-500 focus:border-orange-500"
                  >
                    <Upload className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {videoFile ? videoFile.name : '选择视频文件 (最大500MB)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Thumbnail File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  替换缩略图 (可选)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-orange-500 focus:border-orange-500"
                  >
                    <Upload className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {thumbnailFile ? thumbnailFile.name : '选择缩略图 (最大10MB)'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Info */}
          {(videoFile || thumbnailFile) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-1">将要上传的文件:</h4>
              {videoFile && (
                <div className="text-sm text-blue-700">
                  • 视频: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
              {thumbnailFile && (
                <div className="text-sm text-blue-700">
                  • 缩略图: {thumbnailFile.name} ({(thumbnailFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? '保存中...' : '保存更改'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoEditModal;