import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { purchasesAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PaymentModal from '../components/Payment/PaymentModal';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const { items, total, count, removeFromCart, clearCart, isLoading } = useCart();
  const { user, refreshUser } = useAuth();
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = React.useState<'alipay' | 'wechat' | 'qq' | null>(null);
  const [currentOrderId, setCurrentOrderId] = React.useState<string>('');
  const [currentPaymentUrl, setCurrentPaymentUrl] = React.useState<string>('');
  const [useFreeCoupon, setUseFreeCoupon] = React.useState(false);
  const [luckyCoinsInput, setLuckyCoinsInput] = React.useState(0);

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

  const couponDiscount = useFreeCoupon && count === 1 ? total : 0;
  const coinsDiscount = Math.min(luckyCoinsInput, user?.luckyCoins ?? 0, total - couponDiscount);
  const finalTotal = Math.max(0, total - couponDiscount - coinsDiscount);

  const handleCheckout = async (paymentMethod: 'alipay' | 'wechat' | 'qq') => {
    const effectiveMethod = finalTotal === 0 ? 'free' : paymentMethod;
    setIsCreatingOrder(true);
    try {
      const result = await purchasesAPI.createOrder({
        paymentMethod: effectiveMethod,
        useFreeCoupon: useFreeCoupon && count === 1,
        luckyCoinsAmount: coinsDiscount
      });

      if (result.freeOrder) {
        toast.success('购买成功！');
        await refreshUser();
        clearCart();
        return;
      }

      setCurrentPaymentMethod(paymentMethod);
      setCurrentOrderId(result.orderId);
      setCurrentPaymentUrl(result.paymentUrl);
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
    setCurrentPaymentUrl('');
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
          {/* Free coupon */}
          {(user?.freeCoupons ?? 0) > 0 && count === 1 && (
            <div className="flex items-center justify-between mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="text-sm font-medium text-green-800">使用免费购买券</div>
                <div className="text-xs text-green-600">剩余 {user?.freeCoupons} 张，可免费获得此视频</div>
              </div>
              <input
                type="checkbox"
                checked={useFreeCoupon}
                onChange={e => setUseFreeCoupon(e.target.checked)}
                className="w-5 h-5 accent-green-600"
              />
            </div>
          )}

          {/* Lucky coins */}
          {(user?.luckyCoins ?? 0) > 0 && !useFreeCoupon && (
            <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-yellow-800">使用幸运币</div>
                <div className="text-xs text-yellow-600">余额 {(user?.luckyCoins ?? 0).toFixed(2)} 枚</div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.min(user?.luckyCoins ?? 0, total)}
                step={0.01}
                value={luckyCoinsInput}
                onChange={e => setLuckyCoinsInput(parseFloat(e.target.value))}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-yellow-700 mt-1">
                <span>0</span>
                <span className="font-semibold">抵扣 ¥{coinsDiscount.toFixed(2)}</span>
                <span>{Math.min(user?.luckyCoins ?? 0, total).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-4">
            <span>实付</span>
            <div className="text-right">
              {(couponDiscount > 0 || coinsDiscount > 0) && (
                <div className="text-sm text-gray-400 line-through">¥{total.toFixed(2)}</div>
              )}
              <span className="text-orange-600">¥{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {finalTotal === 0 ? (
              <button
                onClick={() => handleCheckout('alipay')}
                disabled={isCreatingOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingOrder ? '处理中...' : '免费获取'}
              </button>
            ) : (
              <>
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

                <button
                  onClick={() => handleCheckout('qq')}
                  disabled={isCreatingOrder}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingOrder ? '创建订单中...' : 'QQ支付'}
                </button>
              </>
            )}
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
        paymentUrl={currentPaymentUrl}
      />
    </div>
  );
};

export default CartPage;