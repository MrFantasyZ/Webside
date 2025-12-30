import React from 'react';
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { videosAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CategoryData {
  name: string;
  count: number;
}

const CategorySidebar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentCategory = searchParams.get('category') || '';

  // 获取分类数据
  const { data: categoriesData, isLoading, error } = useQuery(
    'categories',
    () => videosAPI.getCategories(),
    {
      staleTime: 5 * 60 * 1000, // 5分钟缓存
    }
  );

  // 处理分类点击
  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (categoryName === '全部') {
      params.delete('category');
    } else {
      params.set('category', categoryName);
    }
    
    // 重置到第一页
    params.delete('page');
    
    navigate(`/?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">视频分类</h3>
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">视频分类</h3>
        <div className="text-center text-gray-500 py-4">
          <p>加载分类失败</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-orange-600 hover:text-orange-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const categories = categoriesData?.categories || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          视频分类
        </h3>
      </div>

      {/* 分类列表 */}
      <div className="p-2">
        {categories.map((category: CategoryData) => {
          const isActive = (category.name === '全部' && !currentCategory) || 
                          (category.name === currentCategory);
          
          return (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex-1 text-left">{category.name}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部统计信息 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center text-sm text-gray-600">
          <p>
            共 <span className="font-semibold text-gray-900">{categories[0]?.count || 0}</span> 个视频
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;