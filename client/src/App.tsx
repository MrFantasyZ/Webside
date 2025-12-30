import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import VideoDetailPage from './pages/VideoDetailPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import VideoUploadPage from './pages/Admin/VideoUploadPage';
import AnalyticsPage from './pages/Admin/AnalyticsPage';
import VideoManagePage from './pages/Admin/VideoManagePage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="video/:id" element={<VideoDetailPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected routes */}
          <Route path="cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="purchases" element={
            <ProtectedRoute>
              <PurchaseHistoryPage />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="admin/videos" element={
            <AdminRoute requireSuperAdmin={true}>
              <VideoManagePage />
            </AdminRoute>
          } />
          <Route path="admin/upload" element={
            <AdminRoute requireSuperAdmin={true}>
              <VideoUploadPage />
            </AdminRoute>
          } />
          <Route path="admin/analytics" element={
            <AdminRoute requireSuperAdmin={true}>
              <AnalyticsPage />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </div>
  );
}

export default App;