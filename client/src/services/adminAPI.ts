import api from './api';

export interface AdminVideoFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface AdminVideoResponse {
  videos: Array<{
    _id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    thumbnailUrl: string;
    videoUrl: string;
    duration?: number;
    fileSize?: number;
    tags: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface VideoUpdateData {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  tags?: string[];
  video?: File;
  thumbnail?: File;
}

export interface StatsResponse {
  overview: {
    totalVideos: number;
    activeVideos: number;
    inactiveVideos: number;
  };
  categories: Array<{
    name: string;
    count: number;
    avgPrice: number;
  }>;
}

export interface UserRankingData {
  userId: string;
  username: string;
  email: string;
  totalConsumption?: number;
  purchaseCount: number;
}

export interface UserRankingResponse {
  ranking: UserRankingData[];
  period: 'month' | 'year';
}

class AdminAPI {
  // Get all videos for admin
  async getVideos(filters: AdminVideoFilters = {}): Promise<AdminVideoResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/admin/videos?${params.toString()}`);
    return response.data;
  }

  // Delete video
  async deleteVideo(videoId: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/videos/${videoId}`);
    return response.data;
  }

  // Update video
  async updateVideo(videoId: string, data: VideoUpdateData): Promise<{
    message: string;
    video: any;
  }> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'video' || key === 'thumbnail') return; // Handle files separately
      if (value !== undefined && value !== null) {
        if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add files
    if (data.video) {
      formData.append('video', data.video);
    }
    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail);
    }

    const response = await api.put(`/admin/videos/${videoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // Toggle video active status
  async toggleVideoStatus(videoId: string): Promise<{
    message: string;
    video: { _id: string; isActive: boolean };
  }> {
    const response = await api.patch(`/admin/videos/${videoId}/toggle-status`);
    return response.data;
  }

  // Download video
  async downloadVideo(videoId: string): Promise<Blob> {
    const response = await api.get(`/admin/videos/${videoId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get admin statistics
  async getStats(): Promise<StatsResponse> {
    const response = await api.get('/admin/stats');
    return response.data;
  }

  // Upload new video
  async uploadVideo(data: {
    title: string;
    description: string;
    category: string;
    price: number;
    tags: string[];
    video: File;
    thumbnail?: File;
  }): Promise<{
    message: string;
    video: any;
  }> {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('price', data.price.toString());
    formData.append('tags', JSON.stringify(data.tags));
    formData.append('video', data.video);
    
    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail);
    }

    const response = await api.post('/admin/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // Get user consumption ranking
  async getUserConsumptionRanking(period: 'month' | 'year' = 'month'): Promise<UserRankingResponse> {
    const response = await api.get(`/admin/user-consumption-ranking?period=${period}`);
    return response.data;
  }

  // Get user purchase frequency ranking
  async getUserPurchaseRanking(period: 'month' | 'year' = 'month'): Promise<UserRankingResponse> {
    const response = await api.get(`/admin/user-purchase-ranking?period=${period}`);
    return response.data;
  }
}

export const adminAPI = new AdminAPI();