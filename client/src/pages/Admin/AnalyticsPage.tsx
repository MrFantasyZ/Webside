import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3, Award, Users } from 'lucide-react';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

interface EarningsData {
  today: number;
  thisMonth: number;
  thisYear: number;
  dailyData: { date: string; amount: number }[];
  monthlyData: { month: string; amount: number }[];
}

interface VideoRankingData {
  id: string;
  title: string;
  downloads: number;
  category: string;
}

interface CategoryRankingData {
  category: string;
  downloads: number;
  percentage: number;
}

interface UserRankingData {
  userId: string;
  username: string;
  email: string;
  totalConsumption?: number;
  purchaseCount: number;
}

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('earnings');
  const [timeRange, setTimeRange] = useState<'day' | 'month' | 'total'>('day');
  const [userTimeRange, setUserTimeRange] = useState<'month' | 'year'>('month');
  const [consumptionRanking, setConsumptionRanking] = useState<UserRankingData[]>([]);
  const [purchaseRanking, setPurchaseRanking] = useState<UserRankingData[]>([]);
  const [isLoadingUserRankings, setIsLoadingUserRankings] = useState(false);

  const earningsData: EarningsData = {
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    dailyData: [],
    monthlyData: []
  };

  const videoRankings: { [key in 'day' | 'month' | 'total']: VideoRankingData[] } = {
    day: [],
    month: [],
    total: []
  };

  const categoryRankings: { [key in 'day' | 'month' | 'total']: CategoryRankingData[] } = {
    day: [],
    month: [],
    total: []
  };

  const EarningsCard = ({ title, amount, icon: Icon, trend }: { title: string; amount: number; icon: any; trend?: number }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">¥{amount.toLocaleString()}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              +{trend}%
            </p>
          )}
        </div>
        <Icon className="h-8 w-8 text-orange-500" />
      </div>
    </div>
  );

  const RankingTable = ({ data, title }: { data: VideoRankingData[] | CategoryRankingData[], title: string }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Award className="h-5 w-5 mr-2 text-orange-500" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 text-sm font-bold mr-3 ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {index + 1}
              </span>
              <div>
                {'title' in item ? (
                  <>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{item.category}</p>
                    <p className="text-sm text-gray-500">{item.percentage}% 占比</p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{item.downloads.toLocaleString()}</p>
              <p className="text-sm text-gray-500">下载</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const UserRankingTable = ({ data, title, showConsumption = false }: { 
    data: UserRankingData[], 
    title: string,
    showConsumption?: boolean 
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2 text-orange-500" />
        {title}
      </h3>
      {(!data || data.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          暂无数据
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((user, index) => (
            <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 text-sm font-bold mr-3 ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                {showConsumption ? (
                  <>
                    <p className="font-bold text-gray-900">¥{(user.totalConsumption || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">消费金额</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900">{user.purchaseCount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">购买次数</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const loadUserRankings = async () => {
      if (activeTab !== 'user-rankings') return;
      
      setIsLoadingUserRankings(true);
      try {
        const [consumptionData, purchaseData] = await Promise.all([
          adminAPI.getUserConsumptionRanking(userTimeRange),
          adminAPI.getUserPurchaseRanking(userTimeRange)
        ]);
        
        setConsumptionRanking(consumptionData.ranking || []);
        setPurchaseRanking(purchaseData.ranking || []);
      } catch (error) {
        toast.error('获取用户排名数据失败');
        console.error('Failed to load user rankings:', error);
      } finally {
        setIsLoadingUserRankings(false);
      }
    };

    loadUserRankings();
  }, [activeTab, userTimeRange]);

  return (
    <div className="ml-64 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('earnings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                收益统计
              </button>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rankings'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                排名统计
              </button>
              <button
                onClick={() => setActiveTab('user-rankings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'user-rankings'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                用户活跃度排名
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EarningsCard
                title="今日收益"
                amount={earningsData.today}
                icon={DollarSign}
                trend={12}
              />
              <EarningsCard
                title="本月收益"
                amount={earningsData.thisMonth}
                icon={Calendar}
                trend={8}
              />
              <EarningsCard
                title="本年收益"
                amount={earningsData.thisYear}
                icon={TrendingUp}
                trend={15}
              />
            </div>

            {/* No Data Message */}
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>暂无收益数据</p>
              <p className="text-sm mt-1">当有用户购买视频后，收益数据将显示在此处</p>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex space-x-4">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeRange === 'day'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                日排名
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeRange === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                月排名
              </button>
              <button
                onClick={() => setTimeRange('total')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeRange === 'total'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                总排名
              </button>
            </div>

            {/* No Data Message */}
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>暂无排名数据</p>
              <p className="text-sm mt-1">当有用户购买视频后，排名数据将显示在此处</p>
            </div>
          </div>
        )}

        {activeTab === 'user-rankings' && (
          <div className="space-y-6">
            {/* Time Range Selector for User Rankings */}
            <div className="flex space-x-4">
              <button
                onClick={() => setUserTimeRange('month')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  userTimeRange === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                月排名
              </button>
              <button
                onClick={() => setUserTimeRange('year')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  userTimeRange === 'year'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                年排名
              </button>
            </div>

            {/* User Rankings */}
            {isLoadingUserRankings ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">加载中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserRankingTable
                  data={consumptionRanking}
                  title={`用户消费排名 (${userTimeRange === 'month' ? '本月' : '本年'})`}
                  showConsumption={true}
                />
                <UserRankingTable
                  data={purchaseRanking}
                  title={`用户购买次数排名 (${userTimeRange === 'month' ? '本月' : '本年'})`}
                  showConsumption={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;