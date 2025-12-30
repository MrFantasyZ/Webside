import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ current, total, hasNext, hasPrev }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    navigate(`/?${params.toString()}`);
  };

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else {
      if (total > 1) {
        rangeWithDots.push(total);
      }
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center space-x-1">
      {/* Previous button */}
      <button
        onClick={() => goToPage(current - 1)}
        disabled={!hasPrev}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:block ml-1">上一页</span>
      </button>

      {/* Page numbers */}
      <div className="hidden sm:flex space-x-1">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                ...
              </span>
            ) : (
              <button
                onClick={() => goToPage(page as number)}
                className={`flex items-center px-3 py-2 text-sm font-medium border ${
                  current === page
                    ? 'bg-orange-50 border-orange-500 text-orange-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile page info */}
      <div className="flex sm:hidden items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
        {current} / {total}
      </div>

      {/* Next button */}
      <button
        onClick={() => goToPage(current + 1)}
        disabled={!hasNext}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <span className="hidden sm:block mr-1">下一页</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;