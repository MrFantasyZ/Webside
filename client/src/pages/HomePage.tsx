import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { videosAPI } from '../services/api';
import { adminAPI } from '../services/adminAPI';
import { useAuth } from '../contexts/AuthContext';
import VideoCard from '../components/Video/VideoCard';
import Pagination from '../components/Pagination/Pagination';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SortFilter from '../components/Filter/SortFilter';
import CategorySidebar from '../components/Category/CategorySidebar';

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const handleVideoUpdated = () => {
    // Invalidate and refetch videos when a video is updated/deleted
    queryClient.invalidateQueries(['videos']);
    queryClient.invalidateQueries(['admin-videos']);
  };

  const {
    data,
    isLoading,
    error,
  } = useQuery(
    isSuperAdmin 
      ? ['admin-videos', currentPage, search, category, sortBy, sortOrder]
      : ['videos', currentPage, search, category, sortBy, sortOrder],
    () => isSuperAdmin 
      ? adminAPI.getVideos({
          page: currentPage,
          limit: 12,
          search: search || undefined,
          category: category === '全部' ? 'all' : (category || undefined),
          status: 'all', // Show both active and inactive videos for admin
          sortBy,
          sortOrder,
        })
      : videosAPI.getVideos({
          page: currentPage,
          limit: 12,
          search: search || undefined,
          category: category || undefined,
          sortBy,
          sortOrder,
        }),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            无法加载视频内容，请稍后重试。
          </p>
        </div>
      </div>
    );
  }

  const videos = data?.videos || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* 左侧主内容区 */}
        <div className="flex-1">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {search ? `搜索结果: "${search}"` : category ? `${category} 分类` : '视频素材'}
              </h1>
              {pagination && (
                <p className="text-gray-600 mt-1">
                  共找到 {pagination.total} 个视频
                </p>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0">
              <SortFilter />
            </div>
          </div>

          {/* Videos Grid */}
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v1m0 0h8m0 0v2H7V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                没有找到视频
              </h3>
              <p className="text-gray-600">
                {search || category 
                  ? '请尝试调整搜索条件或浏览其他分类' 
                  : '暂时没有可用的视频素材'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video: any) => (
                  <VideoCard 
                    key={video._id} 
                    video={video} 
                    onVideoUpdated={handleVideoUpdated}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-12">
                  <Pagination
                    current={pagination.current}
                    total={pagination.pages}
                    hasNext={pagination.hasNext}
                    hasPrev={pagination.hasPrev}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* 右侧边栏 */}
        <div className="hidden lg:block lg:w-80">
          <div className="sticky top-8">
            <CategorySidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;