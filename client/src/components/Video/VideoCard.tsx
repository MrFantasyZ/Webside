import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Play, Edit, Trash2, Download, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

interface Video {
  _id: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  videoUrl?: string;
  category: string;
  description?: string;
  duration?: number;
  isActive?: boolean;
}

interface VideoCardProps {
  video: Video;
  onVideoUpdated?: () => void; // Callback for when video is updated/deleted
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onVideoUpdated }) => {
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { addToCart, isLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);


  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    try {
      await addToCart(video._id);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`确定要删除视频 "${video.title}" 吗？此操作不可恢复。`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await adminAPI.deleteVideo(video._id);
      toast.success('视频删除成功');
      onVideoUpdated?.();
    } catch (error) {
      toast.error('删除失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsProcessing(true);
    try {
      await adminAPI.toggleVideoStatus(video._id);
      toast.success(video.isActive ? '视频已下架' : '视频已上架');
      onVideoUpdated?.();
    } catch (error) {
      toast.error('状态切换失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsProcessing(true);
    try {
      const blob = await adminAPI.downloadVideo(video._id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('视频下载开始');
    } catch (error) {
      toast.error('下载失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // This would typically open an edit modal or navigate to edit page
    // For now, we'll show a toast
    toast.success('编辑功能需要在管理页面使用');
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Link
      to={`/video/${video._id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300"
    >
      <div className="relative overflow-hidden rounded-t-lg">
        {video.videoUrl ? (
          <video
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            muted
            loop
            poster={video.thumbnailUrl}
            onMouseEnter={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(() => {
                // 如果自动播放失败，显示缩略图
              });
            }}
            onMouseLeave={(e) => {
              const video = e.target as HTMLVideoElement;
              video.pause();
              video.currentTime = 0;
            }}
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="bg-white bg-opacity-0 group-hover:bg-opacity-90 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-all duration-200">
            <Play className="h-6 w-6 text-gray-800" />
          </div>
        </div>

        {/* Duration */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">
            {video.category}
          </span>
        </div>

        {/* Status badge for admin */}
        {isSuperAdmin && (
          <div className="absolute top-2 right-2">
            <span className={`text-white text-xs px-2 py-1 rounded ${
              video.isActive 
                ? 'bg-green-600' 
                : 'bg-red-600'
            }`}>
              {video.isActive ? '已上架' : '已下架'}
            </span>
          </div>
        )}

      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {video.title}
        </h3>

        {video.description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {video.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-orange-600">
            ¥{video.price.toFixed(2)}
          </div>

          {/* Show different buttons based on user role */}
          {authLoading ? (
            // Loading state
            <div className="bg-gray-300 text-gray-500 p-2 rounded-lg">
              加载中...
            </div>
          ) : isSuperAdmin ? (
            // Admin buttons
            <div className="flex space-x-1">
              <button
                onClick={handleEdit}
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="编辑"
              >
                <Edit className="h-3 w-3" />
              </button>
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="下载"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isProcessing}
                className={`text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  video.isActive 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
                title={video.isActive ? '下架' : '上架'}
              >
                {video.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="删除"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            // Regular user button
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title="添加到购物车"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;