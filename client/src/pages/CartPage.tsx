import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { purchasesAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PaymentModal from '../components/Payment/PaymentModal';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const { items, total, count, removeFromCart, clearCart, isLoading } = useCart();
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = React.useState<'alipay' | 'wechat' | null>(null);
  const [currentOrderId, setCurrentOrderId] = React.useState<string>('');

  const handleRemoveItem = async (videoId: string) => {
    try {
      await removeFromCart(videoId);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('确定要清空购物车吗？')) {
      try {
        await clearCart();
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const handleCheckout = async (paymentMethod: 'alipay' | 'wechat') => {
    setIsCreatingOrder(true);
    try {
      const { paymentUrl, orderId } = await purchasesAPI.createOrder(paymentMethod);
      
      // Show payment modal with QR code
      setCurrentPaymentMethod(paymentMethod);
      setCurrentOrderId(orderId);
      setShowPaymentModal(true);
      toast.success('订单创建成功！');
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建订单失败');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setCurrentPaymentMethod(null);
    setCurrentOrderId('');
  };

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m-.4-2H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 13l-2-5"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            购物车为空
          </h3>
          <p className="text-gray-600 mb-6">
            还没有添加任何视频到购物车
          </p>
          <Link
            to="/"
            className="btn-primary inline-flex items-center"
          >
            去逛逛
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          购物车 ({count})
        </h1>
        {count > 0 && (
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-500 text-sm"
          >
            清空购物车
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Cart Items */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.videoId._id} className="p-6">
              <div className="flex items-center space-x-4">
                <img
                  src={item.videoId.thumbnailUrl}
                  alt={item.videoId.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {item.videoId.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {item.videoId.category}
                  </p>
                  <p className="text-lg font-semibold text-orange-600">
                    ¥{item.videoId.price.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.videoId._id)}
                  className="text-red-600 hover:text-red-500 p-2"
                  title="移除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="bg-gray-50 p-6 rounded-b-lg">
          <div className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-4">
            <span>总计</span>
            <span className="text-orange-600">¥{total.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleCheckout('alipay')}
              disabled={isCreatingOrder}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingOrder ? '创建订单中...' : '支付宝支付'}
            </button>
            
            <button
              onClick={() => handleCheckout('wechat')}
              disabled={isCreatingOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingOrder ? '创建订单中...' : '微信支付'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            购买后您将拥有48小时的下载权限
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        paymentMethod={currentPaymentMethod}
        amount={total}
        orderId={currentOrderId}
      />
    </div>
  );
};

export default CartPage;