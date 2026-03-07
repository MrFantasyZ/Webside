import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inviteAPI } from '../services/api';

const InviteButton: React.FC = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.inviteCode) {
      setInviteCode(user.inviteCode);
    }
  }, [user?.inviteCode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!inviteCode && !isLoading) {
      setIsLoading(true);
      try {
        const data = await inviteAPI.getMyCode();
        setInviteCode(data.inviteCode);
        await refreshUser();
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const luckyCoins = user?.luckyCoins ?? 0;
  const freeCoupons = user?.freeCoupons ?? 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end" ref={popupRef}>
      {isOpen && (
        <div className="mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64">
          <div className="text-sm font-semibold text-gray-700 mb-3">我的邀请</div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">幸运币余额</span>
            <span className="text-sm font-bold text-yellow-500">{luckyCoins.toFixed(2)} 枚</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">免费购买券</span>
            <span className="text-sm font-bold text-green-600">{freeCoupons} 张</span>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs text-gray-500 mb-1">我的邀请码</div>
            {isLoading ? (
              <div className="text-sm text-gray-400">生成中...</div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="flex-1 font-mono text-lg font-bold text-orange-600 tracking-widest">
                  {inviteCode || '------'}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            邀请好友注册时填写您的邀请码，好友获得免费购买券，每当好友购买视频您将获得售价40%的幸运币
          </p>
        </div>
      )}

      <div className="flex flex-col items-end space-y-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center space-x-3">
          <div className="text-center">
            <div className="text-xs text-gray-400 dark:text-gray-500 leading-none mb-0.5">幸运币</div>
            <div className="text-sm font-bold text-yellow-500 leading-none">{luckyCoins.toFixed(2)}</div>
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
          <button
            onClick={handleOpen}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors shadow-sm"
          >
            邀请好友
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteButton;
