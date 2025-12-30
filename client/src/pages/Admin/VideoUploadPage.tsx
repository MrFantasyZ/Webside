import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Image, DollarSign, Tag, Video, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import CategorySelector from '../../components/Category/CategorySelector';

interface VideoFormData {
  title: string;
  description: string;
  category: string;
  price: number;
  tags: string;
  duration: number;
}

const VideoUploadPage: React.FC = () => {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<VideoFormData>();


  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const onSubmit = async (data: VideoFormData) => {
    if (!thumbnailFile || !videoFile) {
      toast.error('请选择缩略图和视频文件');
      return;
    }

    if (!selectedCategory) {
      toast.error('请选择视频分类');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', selectedCategory);
      formData.append('price', data.price.toString());
      formData.append('tags', data.tags);
      formData.append('duration', data.duration.toString());
      formData.append('thumbnail', thumbnailFile);
      formData.append('video', videoFile);

      // This would be implemented in the API service
      // await videosAPI.upload(formData);

      toast.success('视频上传成功！');
      reset();
      setThumbnailFile(null);
      setVideoFile(null);
      setThumbnailPreview('');
      setSelectedCategory('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="ml-64 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Upload className="h-6 w-6 text-orange-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">上传视频素材</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  视频标题
                </label>
                <input
                  {...register('title', { required: '请输入视频标题' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="输入视频标题"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  价格（元）
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { 
                    required: '请输入价格',
                    min: { value: 0.01, message: '价格必须大于0' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="29.99"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* 分类和时长 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <CategorySelector
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  error={!selectedCategory && errors.category ? '请选择分类' : undefined}
                  placeholder="请选择分类"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="h-4 w-4 inline mr-1" />
                  时长（秒）
                </label>
                <input
                  type="number"
                  {...register('duration', { 
                    required: '请输入时长',
                    min: { value: 1, message: '时长必须大于0' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="120"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频描述
              </label>
              <textarea
                {...register('description', { required: '请输入视频描述' })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="请详细描述视频内容和适用场景..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                标签（用逗号分隔）
              </label>
              <input
                {...register('tags', { required: '请输入标签' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="科技,创新,现代"
              />
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>

            {/* 文件上传 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 缩略图上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="h-4 w-4 inline mr-1" />
                  缩略图
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="cursor-pointer block text-center"
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="缩略图预览"
                        className="max-w-full h-32 object-cover mx-auto rounded"
                      />
                    ) : (
                      <div className="text-gray-500">
                        <Image className="h-12 w-12 mx-auto mb-2" />
                        <p>点击选择缩略图</p>
                        <p className="text-xs">支持 JPG, PNG 格式</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 视频文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="h-4 w-4 inline mr-1" />
                  视频文件
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer block text-center"
                  >
                    <div className="text-gray-500">
                      <Video className="h-12 w-12 mx-auto mb-2" />
                      {videoFile ? (
                        <p className="text-green-600">{videoFile.name}</p>
                      ) : (
                        <>
                          <p>点击选择视频文件</p>
                          <p className="text-xs">支持 MP4, MOV, AVI 格式</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setThumbnailFile(null);
                  setVideoFile(null);
                  setThumbnailPreview('');
                  setSelectedCategory('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                重置
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '上传中...' : '上传视频'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadPage;