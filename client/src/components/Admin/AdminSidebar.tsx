import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Upload, BarChart3, Settings, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: '/admin/videos',
      icon: Video,
      label: '视频管理',
      description: '管理所有视频内容'
    },
    {
      path: '/admin/upload',
      icon: Upload,
      label: '上传视频',
      description: '上传新的视频素材'
    },
    {
      path: '/admin/analytics',
      icon: BarChart3,
      label: '数据分析',
      description: '查看网站收益和统计'
    }
  ];

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 z-40">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          超级管理员
        </h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;