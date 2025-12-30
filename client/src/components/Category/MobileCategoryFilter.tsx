import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { videosAPI } from '../../services/api';

interface CategoryData {
  name: string;
  count: number;
}

const MobileCategoryFilter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentCategory = searchParams.get('category') || '';

  // 获取分类数据
  const { data: categoriesData, isLoading } = useQuery(
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
    setIsOpen(false); // 选择后关闭
  };

  if (isLoading) {
    return null;
  }

  const categories = categoriesData?.categories || [];
  const currentCategoryData = categories.find((cat: CategoryData) => 
    (cat.name === '全部' && !currentCategory) || cat.name === currentCategory
  );

  return (
    <div className="lg:hidden mb-4">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* 分类选择按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-gray-900">
              {currentCategoryData?.name || '全部'}分类
            </span>
            {currentCategoryData && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {currentCategoryData.count}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* 分类列表 */}
        {isOpen && (
          <div className="border-t border-gray-200 px-2 pb-2">
            <div className="grid grid-cols-2 gap-1 pt-2">
              {categories.slice(0, 8).map((category: CategoryData) => {
                const isActive = (category.name === '全部' && !currentCategory) || 
                                (category.name === currentCategory);
                
                return (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-1 text-left truncate">{category.name}</span>
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
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
            
            {categories.length > 8 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-1">
                  {categories.slice(8).map((category: CategoryData) => {
                    const isActive = category.name === currentCategory;
                    
                    return (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryClick(category.name)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex-1 text-left">{category.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCategoryFilter;