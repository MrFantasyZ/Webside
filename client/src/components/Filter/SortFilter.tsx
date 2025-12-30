import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const SortFilter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const sortOptions = [
    { value: 'createdAt-desc', label: '最新上传' },
    { value: 'createdAt-asc', label: '最早上传' },
    { value: 'price-asc', label: '价格从低到高' },
    { value: 'price-desc', label: '价格从高到低' },
    { value: 'title-asc', label: '标题A-Z' },
    { value: 'title-desc', label: '标题Z-A' },
  ];

  const currentSortValue = `${sortBy}-${sortOrder}`;
  const currentSortLabel = sortOptions.find(opt => opt.value === currentSortValue)?.label || '最新上传';

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    const params = new URLSearchParams(searchParams);
    
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    params.delete('page'); // Reset to first page
    
    navigate(`/?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        <span className="text-sm font-medium text-gray-700">
          排序: {currentSortLabel}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  currentSortValue === option.value
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
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

export default SortFilter;