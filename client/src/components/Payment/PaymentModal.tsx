import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, ExternalLink } from 'lucide-react';
import { purchasesAPI } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: 'alipay' | 'wechat' | null;
  amount: number;
  orderId?: string;
  paymentUrl?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  amount,
  orderId,
  paymentUrl
}) => {
  const [status, setStatus] = useState<'waiting' | 'success' | 'failed'>('waiting');
  const [secondsLeft, setSecondsLeft] = useState(600); // 10分钟超时
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { clearCart } = useCart();

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!isOpen || !orderId) return;

    setStatus('waiting');
    setSecondsLeft(600);

    // 倒计时
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          stopPolling();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // 每3秒轮询一次支付状态
    pollRef.current = setInterval(async () => {
      try {
        const data = await purchasesAPI.checkPaymentStatus(orderId);
        if (data.status === 'completed') {
          setStatus('success');
          stopPolling();
          toast.success('支付成功！');
          clearCart();
        } else if (data.status === 'failed') {
          setStatus('failed');
          stopPolling();
        }
      } catch (e) {
        // 忽略轮询错误，继续重试
      }
    }, 3000);

    return stopPolling;
  }, [isOpen, orderId, clearCart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  if (!isOpen || !paymentMethod) return null;

  const isAlipay = paymentMethod === 'alipay';
  const methodName = isAlipay ? '支付宝' : '微信';
  const accentColor = isAlipay ? 'text-orange-600' : 'text-green-600';
  const btnColor = isAlipay
    ? 'bg-orange-600 hover:bg-orange-700'
    : 'bg-green-600 hover:bg-green-700';

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className={`text-lg font-semibold ${accentColor}`}>
            {methodName}支付
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {status === 'success' ? (
            // 支付成功
            <div className="py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-800 mb-2">支付成功！</p>
              <p className="text-gray-500 text-sm mb-6">
                您的订单已确认，请前往「购买记录」下载视频（48小时内有效）
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700"
              >
                确定
              </button>
            </div>
          ) : status === 'failed' ? (
            // 支付失败
            <div className="py-6">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xl font-semibold text-gray-800 mb-2">支付失败</p>
              <p className="text-gray-500 text-sm mb-6">请重新下单后再试</p>
              <button onClick={handleClose} className="w-full py-3 px-4 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600">
                关闭
              </button>
            </div>
          ) : (
            // 等待支付
            <>
              <div className={`${isAlipay ? 'bg-orange-50' : 'bg-green-50'} rounded-lg p-4 mb-5`}>
                <p className="text-sm text-gray-600 mb-1">订单金额</p>
                <p className={`text-3xl font-bold ${accentColor}`}>¥{amount.toFixed(2)}</p>
                {orderId && (
                  <p className="text-xs text-gray-400 mt-1">订单号: {orderId}</p>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                点击下方按钮跳转到{methodName}支付页面，完成付款后系统自动确认
              </p>

              {paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center w-full py-3 px-4 rounded-lg font-medium text-white mb-4 ${btnColor}`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  前往{methodName}支付
                </a>
              )}

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                <span>等待支付确认中...</span>
                <span className="font-mono text-gray-400">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>

              <p className="text-xs text-gray-400">
                支付完成后页面将自动更新，无需手动操作
              </p>

              <button
                onClick={handleClose}
                className="w-full mt-4 py-2 px-4 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
              >
                取消支付
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
