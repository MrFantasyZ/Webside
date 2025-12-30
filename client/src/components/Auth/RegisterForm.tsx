import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
}

interface RegisterFormProps {
  onClose: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose }) => {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const registerData = {
        username: data.username,
        password: data.password,
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
      };
      
      await registerUser(registerData);
      toast.success('注册成功！');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          用户名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          {...register('username', {
            required: '请输入用户名',
            minLength: {
              value: 3,
              message: '用户名至少需要3个字符',
            },
            maxLength: {
              value: 30,
              message: '用户名不能超过30个字符',
            },
          })}
          className="input-field"
          placeholder="请输入用户名"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          密码 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            {...register('password', {
              required: '请输入密码',
              minLength: {
                value: 6,
                message: '密码至少需要6个字符',
              },
            })}
            className="input-field pr-10"
            placeholder="请输入密码"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          确认密码 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            {...register('confirmPassword', {
              required: '请确认密码',
              validate: (value) => value === password || '两次输入的密码不一致',
            })}
            className="input-field pr-10"
            placeholder="请再次输入密码"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          邮箱 <span className="text-gray-400">(可选，用于找回密码)</span>
        </label>
        <input
          type="email"
          id="email"
          {...register('email', {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: '请输入有效的邮箱地址',
            },
          })}
          className="input-field"
          placeholder="请输入邮箱地址"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          手机号 <span className="text-gray-400">(可选)</span>
        </label>
        <input
          type="tel"
          id="phone"
          {...register('phone', {
            pattern: {
              value: /^1[3-9]\d{9}$/,
              message: '请输入有效的手机号码',
            },
          })}
          className="input-field"
          placeholder="请输入手机号码"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Terms */}
      <div className="text-sm text-gray-500">
        注册即表示您同意我们的{' '}
        <a href="#" className="text-orange-600 hover:text-orange-500">
          服务条款
        </a>{' '}
        和{' '}
        <a href="#" className="text-orange-600 hover:text-orange-500">
          隐私政策
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '注册中...' : '注册'}
      </button>
    </form>
  );
};

export default RegisterForm;