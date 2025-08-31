'use client'

import { useState } from 'react'
import { Upload, BarChart3, LogOut, Menu, X } from 'lucide-react'
import { User } from '@/types'

interface HeaderProps {
  user: User | null
  currentView: 'login' | 'upload' | 'admin'
  onViewChange: (view: 'login' | 'upload' | 'admin') => void
  onLogout: () => void
}

export default function Header({ user, currentView, onViewChange, onLogout }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gray-900">Tower Capture</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <span className="text-gray-500 text-sm font-medium">Please login to continue</span>
            </nav>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Tower Capture</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onViewChange('upload')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  currentView === 'upload'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Upload Form</span>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => onViewChange('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    currentView === 'admin'
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-3 border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onViewChange('upload')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 flex items-center space-x-3 ${
                    currentView === 'upload'
                      ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${currentView === 'upload' ? 'bg-blue-600' : 'bg-blue-100'}`}>
                    <Upload className={`h-5 w-5 ${currentView === 'upload' ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Upload Form</div>
                    <div className={`text-sm ${currentView === 'upload' ? 'text-blue-100' : 'text-gray-500'}`}>
                      Submit new captures and images
                    </div>
                  </div>
                  {currentView === 'upload' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      onViewChange('admin')
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 flex items-center space-x-3 ${
                      currentView === 'admin'
                        ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${currentView === 'admin' ? 'bg-blue-600' : 'bg-blue-100'}`}>
                      <BarChart3 className={`h-5 w-5 ${currentView === 'admin' ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Admin Panel</div>
                      <div className={`text-sm ${currentView === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>
                        Manage system and users
                      </div>
                    </div>
                    {currentView === 'admin' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                )}
              </div>
              
              {/* Mobile User Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 mt-6 shadow-md">
                <div className="text-left mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">User Profile</h4>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full inline-block">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full px-4 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border border-red-200 hover:border-red-300"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Close Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Close Menu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

