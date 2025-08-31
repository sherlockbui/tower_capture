'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { Download, Trash2, BarChart3, Users, UserCheck, MapPin, Camera } from 'lucide-react'
import { format } from 'date-fns'
import CreateUserForm from './CreateUserForm'

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
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Export failed')
      setMessageType('error')
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
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Download failed')
      setMessageType('error')
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
      
      // Reload stats after cleanup
      loadStats()
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Cleanup failed')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* System Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          System Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-blue-800">Users</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalSites}</div>
            <div className="text-sm text-green-800">Sites</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalTypes}</div>
            <div className="text-sm text-yellow-800">Types</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalCaptures}</div>
            <div className="text-sm text-purple-800">Captures</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.totalImages}</div>
            <div className="text-sm text-red-800">Images</div>
          </div>
        </div>
      </div>

      {/* User Performance Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            User Performance Report
          </h3>
          <div className="mt-3 sm:mt-0">
            <label htmlFor="userStatsDate" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              id="userStatsDate"
              value={userStatsDate}
              onChange={(e) => setUserStatsDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        
        {userStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No user activity found for {userStatsDate}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
            </div>
            
            {/* Report Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Số Trạm chụp
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Số Type của Trạm
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Số hình của trạm
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userStats.map((user, index) => (
                    <tr key={user._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-lg font-semibold text-blue-600">{user.uniqueSites}</span>
                        </div>
                        <div className="text-xs text-gray-500">trạm</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-semibold text-green-600">{user.captureCount}</span>
                        </div>
                        <div className="text-xs text-gray-500">type</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Camera className="h-4 w-4 text-purple-600" />
                          <span className="text-lg font-semibold text-purple-600">{user.imageCount}</span>
                        </div>
                        <div className="text-xs text-gray-500">hình</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-gray-600" />
                        <span>Tổng cộng</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {userStats.reduce((sum, user) => sum + user.uniqueSites, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {userStats.reduce((sum, user) => sum + user.captureCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {userStats.reduce((sum, user) => sum + user.imageCount, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Export & Download
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="exportDate" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date for Export
            </label>
            <input
              type="date"
              id="exportDate"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isLoading ? 'Exporting...' : 'Export to Excel'}</span>
            </button>
            
            <button
              onClick={handleDownloadImages}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isLoading ? 'Downloading...' : 'Download All Images'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          User Management
        </h3>
        <CreateUserForm onUserCreated={loadStats} />
      </div>

      {/* Data Cleanup */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Trash2 className="h-5 w-5 mr-2" />
          Data Cleanup
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="cleanupDate" className="block text-sm font-medium text-gray-700 mb-1">
              Delete data before this date
            </label>
            <input
              type="date"
              id="cleanupDate"
              value={cleanupDate}
              onChange={(e) => setCleanupDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isLoading ? 'Cleaning...' : 'Cleanup Old Data'}</span>
          </button>
        </div>
      </div>



      {/* Message Display */}
      {message && (
        <div className={`rounded-lg p-4 ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
