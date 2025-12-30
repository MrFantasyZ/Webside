import React from 'react';
import { useQuery } from 'react-query';
import { Download, Clock, CheckCircle, ShoppingBag } from 'lucide-react';
import { purchasesAPI, videosAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const PurchaseHistoryPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(
    'purchaseHistory',
    () => purchasesAPI.getPurchaseHistory({ limit: 50 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleDownload = async (videoId: string, title: string) => {
    try {
      const { downloadUrl, remainingDownloads, expiresAt } = await videosAPI.getDownloadLink(videoId);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`下载开始！剩余下载次数: ${remainingDownloads}`);
      
      // Refresh the data to update download count
      // queryClient.invalidateQueries('purchaseHistory');
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || '下载失败');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            加载失败
          </h2>
          <p className="text-gray-600">
            无法加载购买历史，请稍后重试。
          </p>
        </div>
      </div>
    );
  }

  const purchases = data?.purchases || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        购买历史
      </h1>

      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无购买记录
          </h3>
          <p className="text-gray-600">
            您还没有购买任何视频素材
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase: any) => (
            <div key={purchase.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={purchase.video.thumbnailUrl}
                  alt={purchase.video.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {purchase.video.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>{purchase.video.category}</span>
                    <span>¥{purchase.amount.toFixed(2)}</span>
                    <span>
                      {new Date(purchase.purchaseTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Payment Status */}
                    <div className="flex items-center space-x-1">
                      {purchase.paymentStatus === 'completed' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">支付成功</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600">待支付</span>
                        </>
                      )}
                    </div>

                    {/* Download Info */}
                    {purchase.canDownload && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          剩余下载: {purchase.maxDownloads - purchase.downloadCount} 次
                        </span>
                        <span className="text-sm text-gray-500">
                          过期时间: {new Date(purchase.downloadExpiresAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Button */}
                {purchase.canDownload && (
                  <button
                    onClick={() => handleDownload(purchase.video._id, purchase.video.title)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>下载</span>
                  </button>
                )}
                
                {purchase.paymentStatus === 'completed' && !purchase.canDownload && (
                  <div className="text-sm text-gray-500">
                    {new Date(purchase.downloadExpiresAt) < new Date() 
                      ? '已过期' 
                      : '下载次数已用完'
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;