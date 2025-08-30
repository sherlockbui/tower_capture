export interface User {
  id: string
  username: string
  role: 'user' | 'admin'
}

export interface Site {
  id: string
  siteCode: string
  createdAt: string
}

export interface Type {
  id: string
  siteId: string
  typeName: string
  createdAt: string
}

export interface Capture {
  id: string
  typeId: string
  typeName: string
  siteCode: string
  images: string[]
  capturedBy: string
  capturedAt: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ApiResponse<T> {
  message?: string
  data?: T
  error?: string
}
