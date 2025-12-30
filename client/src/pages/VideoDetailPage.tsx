import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ShoppingCart, Play, Download, Clock } from 'lucide-react';
import { videosAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import VideoCard from '../components/Video/VideoCard';
import toast from 'react-hot-toast';

const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const { data: videoData, isLoading, error } = useQuery(
    ['video', id],
    () => videosAPI.getVideo(id!),
    {
      enabled: !!id,
    }
  );

  const { data: recommendationsData } = useQuery(
    ['recommendations', id],
    () => videosAPI.getRecommendations(id!),
    {
      enabled: !!id,
    }
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    try {
      await addToCart(id!);
    } catch (error) {
      // Error handled in context
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !videoData?.video) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            视频不存在
          </h2>
          <p className="text-gray-600">
            抱歉，找不到您要查看的视频。
          </p>
        </div>
      </div>
    );
  }

  const video = videoData.video;
  const recommendations = recommendationsData?.recommendations || [];

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Video Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-6">
            {video.videoUrl ? (
              <video
                className="w-full h-64 sm:h-96 object-cover"
                controls
                poster={video.thumbnailUrl}
              >
                <source src={video.videoUrl} type="video/mp4" />
                您的浏览器不支持视频播放。
              </video>
            ) : (
              <>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-64 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                  <button className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all">
                    <Play className="h-8 w-8 text-gray-800 ml-1" />
                  </button>
                </div>
              </>
            )}
            
            {/* Duration overlay */}
            {video.duration && !video.videoUrl && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {video.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    {video.category}
                  </span>
                  {video.duration && (
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ¥{video.price.toFixed(2)}
                </div>
                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>加入购物车</span>
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">视频描述</h3>
              <p className="text-gray-600 leading-relaxed">
                {video.description || '暂无描述'}
              </p>
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="mt-8 lg:mt-0">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">购买须知</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                购买后立即获得下载权限
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                48小时内可下载3次
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                支持个人和商业使用
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                高清无水印版本
              </li>
            </ul>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">相关推荐</h3>
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec: any) => (
                  <VideoCard key={rec._id} video={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;