import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Plus,
  MoreHorizontal,
  RefreshCw 
} from 'lucide-react';
import { adminAPI } from '../../services/adminAPI';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import VideoEditModal from '../../components/Admin/VideoEditModal';

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

interface Pagination {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AdminVideosResponse {
  videos: Video[];
  pagination: Pagination;
}

const VideoManagePage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [stats, setStats] = useState<any>(null);

  const categories = [
    '全部', '科技', '自然', '城市', '人物', '抽象', 
    '商务', '教育', '娱乐', '其他'
  ];

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '已上架' },
    { value: 'inactive', label: '已下架' }
  ];

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getVideos({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        category: selectedCategory === '全部' ? 'all' : selectedCategory,
        status: selectedStatus,
        sortBy,
        sortOrder
      });
      
      setVideos(response.videos);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVideos();
  };

  const handleDelete = async (video: Video) => {
    if (!window.confirm(`确定要删除视频 "${video.title}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await adminAPI.deleteVideo(video._id);
      fetchVideos();
      fetchStats();
      alert('视频删除成功');
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  const handleToggleStatus = async (video: Video) => {
    try {
      await adminAPI.toggleVideoStatus(video._id);
      fetchVideos();
      fetchStats();
    } catch (error) {
      alert('状态切换失败，请重试');
    }
  };

  const handleDownload = async (video: Video) => {
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
    } catch (error) {
      alert('下载失败，请重试');
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
  };

  const handleEditComplete = () => {
    setEditingVideo(null);
    fetchVideos();
    fetchStats();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pl-64 pt-16">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pl-64 pt-16">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">视频管理</h1>
          
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">总视频数</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.overview.totalVideos}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">已上架</h3>
                <p className="text-2xl font-bold text-green-600">{stats.overview.activeVideos}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">已下架</h3>
                <p className="text-2xl font-bold text-red-600">{stats.overview.inactiveVideos}</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜索视频标题、描述或标签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </form>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="createdAt-desc">最新创建</option>
              <option value="createdAt-asc">最早创建</option>
              <option value="title-asc">标题 A-Z</option>
              <option value="title-desc">标题 Z-A</option>
              <option value="price-desc">价格高到低</option>
              <option value="price-asc">价格低到高</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchVideos}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {videos.map(video => (
            <div key={video._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Video Thumbnail */}
              <div className="relative">
                <video
                  src={video.videoUrl}
                  poster={video.thumbnailUrl}
                  className="w-full h-48 object-cover rounded-t-lg"
                  muted
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    video.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {video.isActive ? '已上架' : '已下架'}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate mb-1">{video.title}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{video.description}</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">{video.category}</span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(video.price)}</span>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  <div>大小: {formatFileSize(video.fileSize)}</div>
                  <div>创建: {new Date(video.createdAt).toLocaleDateString()}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(video)}
                    className="flex-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => handleDownload(video)}
                    className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded flex items-center justify-center space-x-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>下载</span>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(video)}
                    className={`flex-1 px-3 py-1 text-white text-xs rounded flex items-center justify-center space-x-1 ${
                      video.isActive 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    {video.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{video.isActive ? '下架' : '上架'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(video)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-md ${
                  page === currentPage 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && videos.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVideo && (
        <VideoEditModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onComplete={handleEditComplete}
        />
      )}
    </div>
  );
};

export default VideoManagePage;