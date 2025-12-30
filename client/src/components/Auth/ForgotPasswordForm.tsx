import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onClose, onBackToLogin }) => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setIsEmailSent(true);
      toast.success('密码重置邮件已发送！');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            邮件已发送
          </h3>
          <p className="text-gray-600 mb-4">
            我们已向您的邮箱发送了密码重置链接，请检查您的邮件并按照说明重置密码。
          </p>
          <p className="text-sm text-gray-500">
            没有收到邮件？请检查垃圾邮件箱，或稍后重试。
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onBackToLogin}
            className="w-full btn-primary"
          >
            返回登录
          </button>
          <button
            onClick={() => setIsEmailSent(false)}
            className="w-full btn-outline"
          >
            重新发送
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBackToLogin}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回登录
      </button>

      <div className="text-center mb-4">
        <p className="text-gray-600">
          请输入您的邮箱地址，我们将向您发送密码重置链接。
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            邮箱地址
          </label>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: '请输入邮箱地址',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: '请输入有效的邮箱地址',
              },
            })}
            className="input-field"
            placeholder="请输入您的邮箱地址"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '发送中...' : '发送重置链接'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;