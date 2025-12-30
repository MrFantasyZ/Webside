import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
            <p className="text-gray-600">用户中心</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <p className="text-gray-900">{user?.username}</p>
          </div>
          
          {user?.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
          )}
          
          {user?.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <p className="text-gray-900">{user.phone}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">注册时间</label>
            <p className="text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/purchases"
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">购买历史</h3>
              <p className="text-gray-600 text-sm">查看您购买的所有视频</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">账户设置</h3>
              <p className="text-gray-600 text-sm">修改个人信息和密码</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;