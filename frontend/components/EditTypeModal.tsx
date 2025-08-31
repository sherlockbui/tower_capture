'use client'

import { useState, useEffect } from 'react'
import { X, Save, Edit3 } from 'lucide-react'

interface EditTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (typeName: string, note: string) => void
  initialTypeName: string
  initialNote: string
}

export default function EditTypeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialTypeName, 
  initialNote 
}: EditTypeModalProps) {
  const [typeName, setTypeName] = useState(initialTypeName)
  const [note, setNote] = useState(initialNote)

  useEffect(() => {
    if (isOpen) {
      setTypeName(initialTypeName)
      setNote(initialNote)
    }
  }, [isOpen, initialTypeName, initialNote])

  const handleSave = () => {
    if (typeName.trim() && !typeName.includes(' ')) {
      onSave(typeName.trim(), note.trim())
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Edit3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Type</h2>
              <p className="text-sm text-gray-600">Update type name and note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              placeholder="Enter type name (e.g., MAIN, SUB)"
              autoFocus
            />
            {typeName.includes(' ') && (
              <p className="text-sm text-red-600">Type name cannot contain spaces</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none"
              placeholder="Enter note (optional)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!typeName.trim() || typeName.includes(' ')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + Enter</kbd> to save
          </p>
        </div>
      </div>
    </div>
  )
}
