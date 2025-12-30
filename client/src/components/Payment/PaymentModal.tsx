import React from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: 'alipay' | 'wechat' | null;
  amount: number;
  orderId?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  amount,
  orderId
}) => {
  if (!isOpen || !paymentMethod) return null;

  const getPaymentInfo = () => {
    switch (paymentMethod) {
      case 'alipay':
        return {
          title: '支付宝支付',
          qrCode: '/uploads/payments/zhifubao.jpg',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      case 'wechat':
        return {
          title: '微信支付',
          qrCode: '/uploads/payments/wechat.jpg',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      default:
        return null;
    }
  };

  const paymentInfo = getPaymentInfo();
  if (!paymentInfo) return null;

  const handleCompletePayment = () => {
    // 模拟支付完成
    onClose();
    // 这里可以添加支付完成的逻辑
    alert('支付成功！订单正在处理中...');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className={`text-lg font-semibold ${paymentInfo.color}`}>
            {paymentInfo.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className={`${paymentInfo.bgColor} rounded-lg p-4 mb-4`}>
            <p className="text-sm text-gray-600 mb-2">订单金额</p>
            <p className={`text-2xl font-bold ${paymentInfo.color}`}>
              ¥{amount.toFixed(2)}
            </p>
            {orderId && (
              <p className="text-xs text-gray-500 mt-1">
                订单号: {orderId}
              </p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              请使用{paymentInfo.title}扫描下方二维码完成支付
            </p>
            
            {/* QR Code */}
            <div className="flex justify-center">
              <img
                src={paymentInfo.qrCode}
                alt={`${paymentInfo.title}收款码`}
                className="w-64 h-64 object-contain border border-gray-200 rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <p class="text-gray-500 text-sm">收款码加载失败</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 mb-6 space-y-1">
            <p>1. 打开{paymentMethod === 'alipay' ? '支付宝' : '微信'}扫一扫功能</p>
            <p>2. 扫描上方二维码</p>
            <p>3. 确认支付金额后完成付款</p>
            <p>4. 支付完成后点击下方按钮</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCompletePayment}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                paymentMethod === 'alipay' 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              我已完成支付
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              取消支付
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            支付遇到问题？请联系客服协助处理
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;