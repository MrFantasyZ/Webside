import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PhoneLoginFormProps {
  onClose: () => void;
  onBackToLogin?: () => void;
}

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onClose, onBackToLogin }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const { loginWithToken } = useAuth();

  // 验证手机号格式
  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入有效的手机号码');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      const response = await fetch(`/api/sms/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setCountdown(60);
        
        // 开发环境显示验证码
        if (data.code) {
          console.log('验证码（开发环境）:', data.code);
          // 可选：在开发环境自动填充验证码
          setCode(data.code);
        }

        // 倒计时
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } else {
        setError(data.message || '验证码发送失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 手机验证码登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      setError('请输入有效的手机号码');
      return;
    }

    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/sms/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (response.ok) {
        loginWithToken(data.user, data.token);
        onClose();
      } else {
        setError(data.message || '登录失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">手机验证码登录</h2>
        <p className="mt-2 text-gray-600">输入手机号码，获取验证码快速登录</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* 手机号输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            手机号码
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入11位手机号码"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            maxLength={11}
            required
          />
        </div>

        {/* 验证码输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            验证码
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入6位验证码"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              maxLength={6}
              required
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || countdown > 0 || !validatePhone(phone)}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSendingCode
                ? '发送中...'
                : countdown > 0
                ? `${countdown}s`
                : codeSent
                ? '重新发送'
                : '获取验证码'}
            </button>
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isLoading || !phone || code.length !== 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登录中...
            </>
          ) : (
            '登录'
          )}
        </button>
      </form>

      {/* 开发环境提示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-center text-sm text-gray-500 bg-yellow-50 p-3 rounded-md">
          <p>🛠️ 开发环境：验证码将在浏览器控制台显示</p>
          <p>📱 支持手机号：13000000000 - 19999999999</p>
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-center text-sm text-gray-500">
        <p>首次使用手机号登录将自动创建账户</p>
        <p>验证码有效期5分钟，请及时输入</p>
      </div>

      {/* 返回登录 */}
      {onBackToLogin && (
        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            返回用户名登录
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneLoginForm;