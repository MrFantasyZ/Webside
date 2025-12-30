import React, { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import PhoneLoginForm from './PhoneLoginForm';

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, defaultTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot' | 'phone'>(defaultTab);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">
              {activeTab === 'login' && '登录'}
              {activeTab === 'register' && '注册'}
              {activeTab === 'forgot' && '找回密码'}
              {activeTab === 'phone' && '手机登录'}
            </h2>
          </div>

          {/* Tabs */}
          {activeTab !== 'forgot' && activeTab !== 'phone' && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'login'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'register'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {/* Forms */}
          <div>
            {activeTab === 'login' && (
              <LoginForm 
                onClose={onClose} 
                onForgotPassword={() => setActiveTab('forgot')}
                onPhoneLogin={() => setActiveTab('phone')}
              />
            )}
            {activeTab === 'register' && (
              <RegisterForm onClose={onClose} />
            )}
            {activeTab === 'forgot' && (
              <ForgotPasswordForm 
                onClose={onClose}
                onBackToLogin={() => setActiveTab('login')} 
              />
            )}
            {activeTab === 'phone' && (
              <PhoneLoginForm 
                onClose={onClose}
                onBackToLogin={() => setActiveTab('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;