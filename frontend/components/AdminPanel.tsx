'use client'

import { useState, useEffect } from 'react'
import { adminAPI, capturesAPI } from '@/lib/api'
import { Capture } from '@/types'
import { Download, Trash2, BarChart3, Calendar, FileText, Users } from 'lucide-react'
import { format } from 'date-fns'
import CreateUserForm from './CreateUserForm'

export default function AdminPanel() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [cleanupDate, setCleanupDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
  const [captures, setCaptures] = useState<Capture[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSites: 0,
    totalTypes: 0,
    totalCaptures: 0,
    totalImages: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    loadStats()
    loadCapturesByDate()
  }, [selectedDate])

  const loadStats = async () => {
    try {
      const systemStats = await adminAPI.getStats()
      setStats(systemStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadCapturesByDate = async () => {
    try {
      setIsLoading(true)
      const dateCaptures = await capturesAPI.getByDate(selectedDate)
      setCaptures(dateCaptures.captures)
    } catch (error) {
      console.error('Failed to load captures:', error)
      setCaptures([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      
      const blob = await adminAPI.exportData(selectedDate)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_${selectedDate}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setMessage('Export completed successfully!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Export failed')
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

      {/* Data Export */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Export Data
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="exportDate" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              id="exportDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isLoading ? 'Exporting...' : 'Export Data'}</span>
          </button>
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

      {/* Captures by Date */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Captures for {selectedDate}
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading captures...</p>
          </div>
        ) : captures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No captures found for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Found {captures.length} captures with {captures.reduce((total, c) => total + c.images.length, 0)} images
            </div>
            <div className="space-y-3">
              {captures.map((capture) => (
                <div key={capture.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{capture.siteCode}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-700">{capture.typeName}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(capture.capturedAt), 'HH:mm')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Captured by: {capture.capturedBy}
                  </div>
                  <div className="flex space-x-2 overflow-x-auto">
                    {capture.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:5000${image}`}
                        alt={`Image ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
