import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: {
    token: string;
    email: string;
    newPassword: string;
  }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

// Videos API
export const videosAPI = {
  getVideos: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get('/videos', { params });
    return response.data;
  },

  getVideo: async (id: string) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/videos/categories');
    return response.data;
  },

  getDownloadLink: async (id: string) => {
    const response = await api.get(`/videos/${id}/download`);
    return response.data;
  },

  getUserPurchases: async (params: { page?: number; limit?: number }) => {
    const response = await api.get('/videos/user/purchases', { params });
    return response.data;
  },

  getRecommendations: async (id: string) => {
    const response = await api.get(`/videos/recommendations/${id}`);
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (videoId: string) => {
    const response = await api.post('/cart/add', { videoId });
    return response.data;
  },

  removeFromCart: async (videoId: string) => {
    const response = await api.delete(`/cart/remove/${videoId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
};

// Purchases API
export const purchasesAPI = {
  createOrder: async (paymentMethod: 'alipay' | 'wechat') => {
    const response = await api.post('/purchases/create-order', { paymentMethod });
    return response.data;
  },

  completePayment: async (data: { orderId: string; transactionId: string }) => {
    const response = await api.post('/purchases/complete-payment', data);
    return response.data;
  },

  getPurchaseHistory: async (params: { page?: number; limit?: number }) => {
    const response = await api.get('/purchases/history', { params });
    return response.data;
  },

  getPurchase: async (id: string) => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategoriesWithStats: async () => {
    const response = await api.get('/categories/with-stats');
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string }) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: { name: string; description?: string }) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default api;