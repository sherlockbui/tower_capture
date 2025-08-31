import axios from 'axios'
import { User, Site, Type, Capture, LoginResponse } from '@/types'
import { config } from './config'


const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    console.log('Frontend: Attempting login...');
    console.log('Frontend: API URL:', config.apiUrl);
    console.log('Frontend: Username:', username);
    
    try {
      const response = await api.post('/auth/login', { username, password })
      console.log('Frontend: Login response:', response.data);
      return response.data
    } catch (error: any) {
      console.error('Frontend: Login error:', error);
      console.error('Frontend: Error response:', error.response?.data);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data.user
  },
}

export const sitesAPI = {
  create: async (siteCode: string): Promise<{ message: string; site: Site }> => {
    const response = await api.post('/sites', { siteCode })
    return response.data
  },

  getAll: async (): Promise<Site[]> => {
    const response = await api.get('/sites')
    return response.data.sites
  },
}

export const typesAPI = {
  create: async (siteId: string, typeName: string): Promise<{ message: string; type: Type }> => {
    const response = await api.post(`/types/sites/${siteId}`, { typeName })
    return response.data
  },

  getBySite: async (siteId: string): Promise<Type[]> => {
    const response = await api.get(`/types/sites/${siteId}`)
    return response.data.types
  },

  update: async (typeId: string, typeName: string, note: string): Promise<{ message: string; type: Type }> => {
    const response = await api.put(`/types/${typeId}`, { typeName, note })
    return response.data
  },
}

export const capturesAPI = {
  upload: async (typeId: string, images: File[]): Promise<Capture> => {
    const formData = new FormData()
    formData.append('typeId', typeId)
    images.forEach((image) => {
      formData.append('images', image)
    })

    const response = await api.post(`/captures/types/${typeId}/captures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.capture
  },

  getByDate: async (date: string): Promise<{ captures: Capture[] }> => {
    const response = await api.get(`/captures?date=${date}`)
    return response.data
  },

  // Admin method to get all captures by date
  getByDateAdmin: async (date: string): Promise<{ captures: Capture[] }> => {
    const response = await api.get(`/captures/admin/all?date=${date}`)
    return response.data
  },
}

export const adminAPI = {
  exportData: async (date: string): Promise<Blob> => {
    const response = await api.get(`/admin/export?date=${date}`, {
      responseType: 'blob',
    })
    return response.data
  },

  downloadImages: async (date: string): Promise<Blob> => {
    const response = await api.get(`/admin/download-images?date=${date}`, {
      responseType: 'blob',
    })
    return response.data
  },

  cleanup: async (beforeDate: string): Promise<{ message: string; deletedCount: number }> => {
    const response = await api.delete(`/admin/cleanup?before=${beforeDate}&confirm=true`)
    return response.data
  },

  getStats: async (): Promise<{
    totalUsers: number
    totalSites: number
    totalTypes: number
    totalCaptures: number
    totalImages: number
  }> => {
    const response = await api.get('/admin/stats')
    return response.data.stats
  },

  getUserStats: async (date: string): Promise<{
    userStats: Array<{
      _id: string
      username: string
      role: string
      captureCount: number
      uniqueSites: number
      imageCount: number
    }>
    date: string
    totalCaptures: number
    totalImages: number
  }> => {
    const response = await api.get(`/admin/user-stats?date=${date}`)
    return response.data
  },
}

export const createUser = async (userData: {
  username: string
  password: string
  role: string
}): Promise<{ message: string; user: User }> => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export default api
