'use client'

import { useState, useEffect } from 'react'
import LoginForm from '@/components/LoginForm'
import TowerCaptureForm from '@/components/TowerCaptureForm'
import AdminPanel from '@/components/AdminPanel'
import Header from '@/components/Header'
import { User } from '@/types'
import { authAPI } from '@/lib/api'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<'login' | 'upload' | 'admin'>('login')
  const [isLoading, setIsLoading] = useState(true)

  const handleLogin = (userData: User) => {
    setUser(userData)
    setCurrentView('upload') // Luôn set về upload form, không phân biệt role
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
          setCurrentView('upload') // Luôn set về upload form, không phân biệt role
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
        return <TowerCaptureForm />
      case 'admin':
        return <AdminPanel />
      default:
        return <LoginForm onLogin={handleLogin} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
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
      </main>
    </div>
  )
}
