'use client'

import { useState, useEffect } from 'react'
import LoginForm from '@/components/LoginForm'
import TowerCaptureForm from '@/components/TowerCaptureForm'
import AdminPanel from '@/components/AdminPanel'
import { User } from '@/types'
import { authAPI } from '@/lib/api'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<'login' | 'upload' | 'admin'>('login')
  const [isLoading, setIsLoading] = useState(true)

  const handleLogin = (userData: User) => {
    setUser(userData)
    setCurrentView(userData.role === 'admin' ? 'admin' : 'upload')
    // Lưu user vào localStorage
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Kiểm tra token và user khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        
        if (token && savedUser) {
          // Kiểm tra token có hợp lệ không
          const currentUser = await authAPI.getCurrentUser()
          setUser(currentUser)
          setCurrentView(currentUser.role === 'admin' ? 'admin' : 'upload')
        }
      } catch (error) {
        // Token không hợp lệ, xóa khỏi localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Đang kiểm tra đăng nhập...</span>
        </div>
      )
    }

    if (!user) {
      return <LoginForm onLogin={handleLogin} />
    }

    switch (currentView) {
      case 'upload':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Mobile-first header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              {/* Title - Full width on mobile, left-aligned on desktop */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
                Tower Capture Upload
              </h1>
              
              {/* Buttons - Stacked on mobile, horizontal on desktop */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                {user.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="btn-secondary w-full sm:w-auto text-sm sm:text-base py-2 px-3 sm:px-4"
                  >
                    Admin Panel
                  </button>
                )}
                <button 
                  onClick={handleLogout} 
                  className="btn-secondary w-full sm:w-auto text-sm sm:text-base py-2 px-3 sm:px-4"
                >
                  Logout
                </button>
              </div>
            </div>
            <TowerCaptureForm />
          </div>
        )
      case 'admin':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Mobile-first header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              {/* Title - Full width on mobile, left-aligned on desktop */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
                Admin Panel
              </h1>
              
              {/* Buttons - Stacked on mobile, horizontal on desktop */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => setCurrentView('upload')}
                  className="btn-secondary w-full sm:w-auto text-sm sm:text-base py-2 px-3 sm:px-4"
                >
                  Upload Form
                </button>
                <button 
                  onClick={handleLogout} 
                  className="btn-secondary w-full sm:w-auto text-sm sm:text-base py-2 px-3 sm:px-4"
                >
                  Logout
                </button>
              </div>
            </div>
            <AdminPanel />
          </div>
        )
      default:
        return <LoginForm onLogin={handleLogin} />
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      {/* Main title - Mobile-first */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Tower Capture Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Manage tower capture operations and image uploads
        </p>
      </div>
      
      {renderContent()}
    </div>
  )
}
