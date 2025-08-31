'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { Download, Trash2, BarChart3, Users, UserCheck, MapPin, Camera } from 'lucide-react'
import { format } from 'date-fns'
import CreateUserForm from './CreateUserForm'
import Toast from './Toast'

export default function AdminPanel() {
  const [exportDate, setExportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [userStatsDate, setUserStatsDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [cleanupDate, setCleanupDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSites: 0,
    totalTypes: 0,
    totalCaptures: 0,
    totalImages: 0
  })
  const [userStats, setUserStats] = useState<Array<{
    _id: string
    username: string
    role: string
    captureCount: number
    uniqueSites: number
    imageCount: number
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    loadStats()
    loadUserStats()
  }, [userStatsDate])

  const loadStats = async () => {
    try {
      const systemStats = await adminAPI.getStats()
      setStats(systemStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }



  const loadUserStats = async () => {
    try {
      const userStatsData = await adminAPI.getUserStats(userStatsDate)
      setUserStats(userStatsData.userStats)
    } catch (error) {
      console.error('Failed to load user stats:', error)
      setUserStats([])
    }
  }

  const handleExport = async () => {
    try {
      setIsLoading(true)
      setMessage('')

      // Backend returns Excel file directly
      const response = await adminAPI.exportData(exportDate)

      // Create download link for the Excel file
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `captures_report_${exportDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage('Export to Excel completed successfully!')
      setMessageType('success')
      setShowToast(true)
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Export failed')
      setMessageType('error')
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadImages = async () => {
    try {
      setIsLoading(true)
      setMessage('')

      // Backend returns ZIP file with all images
      const response = await adminAPI.downloadImages(exportDate)

      // Create download link for the ZIP file
      const blob = new Blob([response], {
        type: 'application/zip'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `captures_${exportDate}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage('Download all images completed successfully!')
      setMessageType('success')
      setShowToast(true)
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Download failed')
      setMessageType('error')
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }



  const handleCleanup = async () => {
    if (!confirm(`Are you sure you want to delete all data before ${cleanupDate}? This action cannot be undone.`)) {
      return
    }

    try {
      setIsLoading(true)
      setMessage('')

      // API now automatically sends confirm=true
      const result = await adminAPI.cleanup(cleanupDate)
      setMessage(result.message)
      setMessageType('success')
      setShowToast(true)

      // Reload stats after cleanup
      loadStats()
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Cleanup failed')
      setMessageType('error')
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* System Statistics */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            System Statistics
          </h3>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Real-time data
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
            <div className="text-xl sm:text-2xl font-bold text-blue-700 mb-1">{stats.totalUsers}</div>
            <div className="text-sm font-medium text-blue-800">Users</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
            <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">{stats.totalSites}</div>
            <div className="text-sm font-medium text-green-800">Sites</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-200">
            <div className="text-xl sm:text-2xl font-bold text-yellow-700 mb-1">{stats.totalTypes}</div>
            <div className="text-sm font-medium text-yellow-800">Types</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
            <div className="text-xl sm:text-2xl font-bold text-purple-700 mb-1">{stats.totalCaptures}</div>
            <div className="text-sm font-medium text-purple-800">Captures</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 hover:shadow-md transition-all duration-200 col-span-2 sm:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-red-700 mb-1">{stats.totalImages}</div>
            <div className="text-sm font-medium text-red-800">Images</div>
          </div>
        </div>
      </div>

      {/* User Performance Statistics */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center mb-2">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              User Performance Report
            </h3>
            <p className="text-gray-600 text-sm">Track user activities and performance metrics</p>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <label htmlFor="userStatsDate" className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="userStatsDate"
                value={userStatsDate}
                onChange={(e) => setUserStatsDate(e.target.value)}
                className="input-field w-full lg:w-auto max-w-[220px] lg:max-w-[240px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-2 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {userStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No user activity found for {userStatsDate}</p>
            <p className="text-sm text-gray-400 mt-1">Try selecting a different date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-blue-700">{userStats.reduce((sum, user) => sum + user.uniqueSites, 0)}</div>
                <div className="text-sm text-blue-600 font-medium">Total Sites</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-green-700">{userStats.reduce((sum, user) => sum + user.captureCount, 0)}</div>
                <div className="text-sm text-green-600 font-medium">Total Types</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-purple-700">{userStats.reduce((sum, user) => sum + user.imageCount, 0)}</div>
                <div className="text-sm text-purple-600 font-medium">Total Images</div>
              </div>
            </div>

            {/* Report Table */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
                Detailed Report
              </h4>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        👤 User
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        🏢 Sites
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        📊 Types
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        📸 Images
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userStats.map((user, index) => (
                      <tr key={user._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}>
                        <td className="px-4 py-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-base truncate">{user.username}</div>
                            <div className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full inline-block">{user.role}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <span className="text-xl font-bold text-blue-700">{user.uniqueSites}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">trạm</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                            <span className="text-xl font-bold text-green-700">{user.captureCount}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">type</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Camera className="h-5 w-5 text-purple-600" />
                            <span className="text-xl font-bold text-purple-700">{user.imageCount}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">hình</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            Export & Download
          </h3>
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
            Data Management
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col items-start">
            <label htmlFor="exportDate" className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Select Date for Export
            </label>
            <input
              type="date"
              id="exportDate"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              className="input-field w-full sm:w-auto max-w-[220px] sm:max-w-[240px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-2 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="btn-primary flex items-center justify-center space-x-3 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-base hover:scale-105 transition-all duration-200"
            >
              <Download className="h-5 w-5" />
              <span>{isLoading ? 'Exporting...' : 'Export to Excel'}</span>
            </button>

            <button
              onClick={handleDownloadImages}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 w-full sm:w-auto hover:scale-105"
            >
              <Download className="h-5 w-5" />
              <span>{isLoading ? 'Downloading...' : 'Download All Images'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            User Management
          </h3>
          <div className="text-sm text-gray-500 bg-purple-50 px-3 py-1 rounded-full">
            Admin Tools
          </div>
        </div>
        <CreateUserForm onUserCreated={loadStats} />
      </div>

      {/* Data Cleanup */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            Data Cleanup
          </h3>
          <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            ⚠️ Dangerous Operation
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col items-start">
            <label htmlFor="cleanupDate" className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Delete data before this date
            </label>
            <input
              type="date"
              id="cleanupDate"
              value={cleanupDate}
              onChange={(e) => setCleanupDate(e.target.value)}
              className="input-field w-full sm:w-auto max-w-[220px] sm:max-w-[240px] border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg px-4 py-2 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 w-full sm:w-auto hover:scale-105"
          >
            <Trash2 className="h-5 w-5" />
            <span>{isLoading ? 'Cleaning...' : 'Cleanup Old Data'}</span>
          </button>
        </div>
      </div>

      {/* Toast Component */}
      <Toast
        message={message}
        type={messageType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
    </div>
  )
}
