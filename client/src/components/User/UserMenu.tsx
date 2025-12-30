import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, Settings, LogOut } from 'lucide-react';

interface UserMenuProps {
  onClose: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onClose, onLogout }) => {
  const handleItemClick = () => {
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
      <div className="py-1">
        <Link
          to="/profile"
          onClick={handleItemClick}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <User className="h-4 w-4 mr-3" />
          个人信息
        </Link>
        
        <Link
          to="/purchases"
          onClick={handleItemClick}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag className="h-4 w-4 mr-3" />
          购买历史
        </Link>
        
        <div className="border-t border-gray-100 my-1"></div>
        
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-3" />
          退出登录
        </button>
      </div>
    </div>
  );
};

export default UserMenu;