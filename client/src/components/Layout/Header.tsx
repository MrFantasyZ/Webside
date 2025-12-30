import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import SearchBar from '../Search/SearchBar';
import AuthModal from '../Auth/AuthModal';
import UserMenu from '../User/UserMenu';
import ThemeToggle from '../UI/ThemeToggle';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleAuthAction = (action: 'login' | 'register') => {
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/ai-logo.png" alt="AI素材网" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">AI素材网</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <SearchBar />
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAuthAction('login')}
                  className="btn-outline text-sm"
                >
                  登录
                </button>
                <button
                  onClick={() => handleAuthAction('register')}
                  className="btn-primary text-sm"
                >
                  注册
                </button>
              </div>
            ) : (
              <>
                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {user?.username}
                    </span>
                  </button>

                  {showUserMenu && (
                    <UserMenu
                      onClose={() => setShowUserMenu(false)}
                      onLogout={handleLogout}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </header>
  );
};

export default Header;