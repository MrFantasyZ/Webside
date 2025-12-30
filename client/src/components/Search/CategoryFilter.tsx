import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useQuery } from 'react-query';
import { videosAPI } from '../../services/api';

const CategoryFilter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );

  const { data: categoriesData } = useQuery(
    'categories',
    videosAPI.getCategories,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const categories = [
    { value: 'all', label: '全部分类' },
    ...(categoriesData?.categories || []).map((cat: string) => ({
      value: cat,
      label: cat,
    })),
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsOpen(false);

    const params = new URLSearchParams(searchParams);
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    params.delete('page'); // Reset to first page
    navigate(`/?${params.toString()}`);
  };

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  const selectedLabel = categories.find(cat => cat.value === selectedCategory)?.label || '全部分类';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent whitespace-nowrap"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedLabel}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CategoryFilter;