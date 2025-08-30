'use client'

import { useState, useEffect } from 'react'
import { Upload, Plus, X, Trash2, Edit3, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { sitesAPI, typesAPI, capturesAPI } from '@/lib/api'
import { config } from '@/lib/config'
import ImageModal from './ImageModal'

interface CaptureType {
  id: string
  typeName: string
  note: string
  images: File[]
}

interface StationData {
  id: string
  siteCode: string
  createdAt: string
  types: {
    id: string
    typeName: string
    note: string
    imageCount: number
    images: string[]
  }[]
}

export default function TowerCaptureForm() {
  const [stationCode, setStationCode] = useState('DNI0272')
  const [captureTypes, setCaptureTypes] = useState<CaptureType[]>([
    {
      id: '1',
      typeName: 'GPV',
      note: '',
      images: []
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // New state for uploaded images
  const [uploadedStations, setUploadedStations] = useState<StationData[]>([])
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set())
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  
  // Date navigation state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])
  
  // Edit mode state
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editTypeName, setEditTypeName] = useState('')
  const [editNoteText, setEditNoteText] = useState('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0)
  
  // Cleanup object URLs when modal closes
  useEffect(() => {
    return () => {
      // Cleanup object URLs to prevent memory leaks
      modalImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  // Load uploaded stations on component mount
  useEffect(() => {
    loadUploadedStations()
  }, [selectedDate]) // Reload when date changes

  const loadUploadedStations = async () => {
    try {
      setIsLoadingStations(true)
      // Use selected date
      const dateString = selectedDate.toISOString().split('T')[0]
      console.log('Loading stations for date:', dateString)
      
      const response = await capturesAPI.getByDate(dateString)
      console.log('API response:', response)
      
      // Group captures by station and type
      const stationMap = new Map<string, StationData>()
      
      response.captures.forEach((capture: any) => {
        console.log('Processing capture:', capture)
        const siteCode = capture.siteCode
        const typeName = capture.typeName
        const typeId = capture.typeId
        
                 if (!stationMap.has(siteCode)) {
           stationMap.set(siteCode, {
             id: siteCode, // Use siteCode as ID since we don't have site._id
             siteCode,
             createdAt: selectedDate.toLocaleDateString('vi-VN'),
             types: []
           })
         }
        
        const station = stationMap.get(siteCode)!
        let type = station.types.find(t => t.typeName === typeName)
        
        if (!type) {
          type = {
            id: typeId,
            typeName,
            note: 'No note',
            imageCount: 0,
            images: []
          }
          station.types.push(type)
        }
        
        type.imageCount += capture.images.length
        type.images.push(...capture.images)
      })
      
      const stationsArray = Array.from(stationMap.values())
      console.log('Final stations array:', stationsArray)
      setUploadedStations(stationsArray)
    } catch (error) {
      console.error('Error loading stations:', error)
    } finally {
      setIsLoadingStations(false)
    }
  }

  const toggleStationExpanded = (siteCode: string) => {
    const newExpanded = new Set(expandedStations)
    if (newExpanded.has(siteCode)) {
      newExpanded.delete(siteCode)
    } else {
      newExpanded.add(siteCode)
    }
    setExpandedStations(newExpanded)
  }

  const toggleTypeExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId)
    } else {
      newExpanded.add(typeId)
    }
    setExpandedTypes(newExpanded)
  }

  const openImageModal = (images: (string | File)[], startIndex: number = 0) => {
    console.log('Opening modal with images:', images)
    console.log('Start index:', startIndex)
    console.log('Image types:', images.map(img => ({ type: typeof img, isFile: img instanceof File })))
    
    // Handle both File objects and string URLs
    const fullImageUrls = images.map(image => {
      if (image instanceof File) {
        // For File objects, create object URL
        const objectUrl = URL.createObjectURL(image)
        console.log('Created object URL:', objectUrl)
        return objectUrl
      } else {
        // For string URLs, add backend prefix
        const fullUrl = `${config.backendUrl}${image}`
        console.log('Created full URL:', fullUrl)
        return fullUrl
      }
    })
    console.log('Final modal images:', fullImageUrls)
    
    setModalImages(fullImageUrls)
    setModalCurrentIndex(startIndex)
    setIsModalOpen(true)
  }

  const closeImageModal = () => {
    console.log('Closing modal, cleaning up URLs:', modalImages)
    
    // Cleanup object URLs before closing
    modalImages.forEach(url => {
      if (url.startsWith('blob:')) {
        console.log('Revoking object URL:', url)
        URL.revokeObjectURL(url)
      }
    })
    
    setIsModalOpen(false)
    setModalImages([])
    setModalCurrentIndex(0)
  }

  const goToPreviousImage = () => {
    if (modalCurrentIndex > 0) {
      setModalCurrentIndex(modalCurrentIndex - 1)
    }
  }

  const goToNextImage = () => {
    if (modalCurrentIndex < modalImages.length - 1) {
      setModalCurrentIndex(modalCurrentIndex + 1)
    }
  }

  // Date navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
    setDateInput(newDate.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
    setDateInput(newDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setDateInput(today.toISOString().split('T')[0])
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    setSelectedDate(newDate)
    setDateInput(e.target.value)
  }

  // Edit functions
  const startEditType = (typeId: string, currentName: string) => {
    setEditingType(typeId)
    setEditTypeName(currentName)
  }

  const startEditNote = (typeId: string, currentNote: string) => {
    setEditingNote(typeId)
    setEditNoteText(currentNote)
  }

  const saveEditType = async (typeId: string) => {
    try {
      // Find the type in uploadedStations
      let updated = false
      const updatedStations = uploadedStations.map(station => {
        const updatedTypes = station.types.map(type => {
          if (type.id === typeId) {
            updated = true
            return { ...type, typeName: editTypeName }
          }
          return type
        })
        return { ...station, types: updatedTypes }
      })

      if (updated) {
        setUploadedStations(updatedStations)
        // TODO: Call API to update type name in backend
        console.log('Type name updated:', editTypeName)
      }
    } catch (error) {
      console.error('Error updating type name:', error)
    } finally {
      setEditingType(null)
      setEditTypeName('')
    }
  }

  const saveEditNote = async (typeId: string) => {
    try {
      // Find the type in uploadedStations
      let updated = false
      const updatedStations = uploadedStations.map(station => {
        const updatedTypes = station.types.map(type => {
          if (type.id === typeId) {
            updated = true
            return { ...type, note: editNoteText }
          }
          return type
        })
        return { ...station, types: updatedTypes }
      })

      if (updated) {
        setUploadedStations(updatedStations)
        // TODO: Call API to update note in backend
        console.log('Note updated:', editNoteText)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setEditingNote(null)
      setEditNoteText('')
    }
  }

  const cancelEdit = () => {
    setEditingType(null)
    setEditingNote(null)
    setEditTypeName('')
    setEditNoteText('')
  }

  const deleteImage = async (typeId: string, imageIndex: number) => {
    try {
      // Find the type in uploadedStations
      const updatedStations = uploadedStations.map(station => {
        const updatedTypes = station.types.map(type => {
          if (type.id === typeId) {
            const updatedImages = type.images.filter((_, index) => index !== imageIndex)
            return { 
              ...type, 
              images: updatedImages,
              imageCount: updatedImages.length
            }
          }
          return type
        })
        return { ...station, types: updatedTypes }
      })

      setUploadedStations(updatedStations)
      // TODO: Call API to delete image in backend
      console.log('Image deleted from type:', typeId, 'at index:', imageIndex)
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const addCaptureType = () => {
    const newType: CaptureType = {
      id: Date.now().toString(),
      typeName: '',
      note: '',
      images: []
    }
    setCaptureTypes(prev => [...prev, newType])
  }

  const removeCaptureType = (id: string) => {
    if (captureTypes.length > 1) {
      setCaptureTypes(prev => prev.filter(type => type.id !== id))
    }
  }

  const updateCaptureType = (id: string, field: keyof CaptureType, value: string) => {
    setCaptureTypes(prev => prev.map(type => 
      type.id === id ? { ...type, [field]: value } : type
    ))
  }

  const addImages = (typeId: string, files: FileList) => {
    const fileArray = Array.from(files)
    setCaptureTypes(prev => prev.map(type => 
      type.id === typeId 
        ? { ...type, images: [...type.images, ...fileArray] }
        : type
    ))
  }

  const removeImage = (typeId: string, imageIndex: number) => {
    setCaptureTypes(prev => prev.map(type => 
      type.id === typeId 
        ? { ...type, images: type.images.filter((_, index) => index !== imageIndex) }
        : type
    ))
  }

  const clearAllImages = (typeId: string) => {
    setCaptureTypes(prev => prev.map(type => 
      type.id === typeId ? { ...type, images: [] } : type
    ))
  }

  const handleUpload = async () => {
    if (!stationCode.trim()) {
      setMessage('Vui lòng nhập Station Code')
      return
    }

    const hasImages = captureTypes.some(type => type.images.length > 0)
    if (!hasImages) {
      setMessage('Vui lòng chọn ít nhất một hình ảnh')
      return
    }

    try {
      setIsLoading(true)
      setMessage('Đang upload...')
      
      // Tạo hoặc lấy site
      let site
      try {
        const response = await sitesAPI.create(stationCode.trim())
        site = response.site
      } catch (error: any) {
        console.error('Site creation error:', error)
        throw new Error('Không thể tạo hoặc tìm thấy site')
      }

      if (!site) {
        throw new Error('Không thể tạo hoặc tìm thấy site')
      }

      // Upload từng type
      for (const type of captureTypes) {
        if (type.images.length === 0) continue

        // Tạo hoặc lấy type
        let captureType
        try {
          const response = await typesAPI.create(site.id, type.typeName.trim())
          captureType = response.type
        } catch (error: any) {
          console.error('Type creation error:', error)
          throw new Error(`Không thể tạo hoặc tìm thấy type: ${type.typeName}`)
        }

        if (!captureType) {
          throw new Error(`Không thể tạo hoặc tìm thấy type: ${type.typeName}`)
        }

        // Upload hình ảnh
        await capturesAPI.upload(captureType.id, type.images)
      }
      
      setMessage('Upload thành công!')
      // Reset form after successful upload
      setCaptureTypes([{
        id: '1',
        typeName: 'GPV',
        note: '',
        images: []
      }])
      setStationCode('DNI0272')
      
      // Reload uploaded stations
      await loadUploadedStations()
    } catch (error: any) {
      console.error('Upload error:', error)
      let errorMessage = 'Upload thất bại. Vui lòng thử lại.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Images</h2>
        
        {/* Station Code */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Station Code *
          </label>
          <input
            type="text"
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mã trạm..."
          />
        </div>

        {/* Capture Types */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Capture Types</h3>
            <button
              onClick={addCaptureType}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Type</span>
            </button>
          </div>

          <div className="space-y-4">
            {captureTypes.map((type, index) => (
              <div key={type.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-900">Type {index + 1}</h4>
                  {captureTypes.length > 1 && (
                    <button
                      onClick={() => removeCaptureType(type.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Type Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type Name *
                  </label>
                  <input
                    type="text"
                    value={type.typeName}
                    onChange={(e) => updateCaptureType(type.id, 'typeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên type..."
                  />
                </div>

                {/* Note */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <input
                    type="text"
                    value={type.note}
                    onChange={(e) => updateCaptureType(type.id, 'note', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes"
                  />
                </div>

                {/* Images */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images *
                  </label>
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && addImages(type.id, e.target.files)}
                      className="hidden"
                      id={`file-${type.id}`}
                    />
                    <label
                      htmlFor={`file-${type.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                    >
                      Chọn tệp
                    </label>
                    {type.images.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {type.images.length} ảnh
                      </span>
                    )}
                    {type.images.length > 0 && (
                      <button
                        onClick={() => clearAllImages(type.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Image Count */}
                  {type.images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        {type.images.length} image(s) selected
                      </p>
                    </div>
                  )}

                                     {/* Image Previews */}
                   {type.images.length > 0 && (
                     <div className="grid grid-cols-3 gap-2">
                       {type.images.map((image, imageIndex) => (
                         <div key={imageIndex} className="relative group">
                                                      <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${imageIndex + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-200 cursor-pointer transition-opacity"
                              style={{ touchAction: 'manipulation' }}
                              onClick={() => openImageModal([image], 0)}
                            />
                           <button
                             onClick={() => removeImage(type.id, imageIndex)}
                             className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                           >
                             <X className="h-3 w-3" />
                           </button>
                           <div className="text-xs text-gray-500 mt-1 text-center">
                             {(image.size / 1024 / 1024).toFixed(2)} MB
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Upload className="h-5 w-5" />
          <span>{isLoading ? 'Đang upload...' : 'Upload Images'}</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 text-center ${
          message.includes('thành công') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : message.includes('Upload thất bại')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

             {/* Uploaded Images Section */}
       <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
         <div className="flex flex-col space-y-4 mb-6">
           <h2 className="text-xl font-semibold text-gray-900">Uploaded Images</h2>
           
           {/* Date Navigation */}
           <div className="flex flex-wrap items-center gap-2">
             <button
               onClick={goToPreviousDay}
               className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
               title="Ngày trước"
             >
               ←
             </button>
             
             <input
               type="date"
               value={dateInput}
               onChange={handleDateChange}
               className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 flex-1"
             />
             
             <button
               onClick={goToNextDay}
               className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
               title="Ngày sau"
             >
               →
             </button>
             
             <button
               onClick={goToToday}
               className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
               title="Hôm nay"
             >
               Today
             </button>
           </div>
         </div>
         
         {isLoadingStations ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Đang tải...</p>
          </div>
                 ) : uploadedStations.length === 0 ? (
           <div className="text-center py-8 text-gray-500">
             <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
             <p>Chưa có trạm nào được chụp vào {selectedDate.toLocaleDateString('vi-VN')}</p>
             <p className="text-sm text-gray-400 mt-1">Hãy upload một số hình ảnh hoặc chọn ngày khác</p>
           </div>
        ) : (
          <div className="space-y-4">
            {uploadedStations.map((station) => (
              <div key={station.id} className="border border-gray-200 rounded-lg">
                                 {/* Station Header */}
                 <div 
                   className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 cursor-pointer hover:bg-gray-50 space-y-2 sm:space-y-0"
                   onClick={() => toggleStationExpanded(station.siteCode)}
                 >
                   <div className="flex items-center space-x-3">
                     {expandedStations.has(station.siteCode) ? (
                       <ChevronDown className="h-5 w-5 text-gray-500" />
                     ) : (
                       <ChevronRight className="h-5 w-5 text-gray-500" />
                     )}
                     <div>
                       <h3 className="font-medium text-gray-900">Station: {station.siteCode}</h3>
                     </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-2">
                     <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                       {station.types.length} types
                     </span>
                     <span className="text-sm text-gray-500">Created: {station.createdAt}</span>
                   </div>
                 </div>

                {/* Station Types */}
                {expandedStations.has(station.siteCode) && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    {station.types.map((type) => (
                      <div key={type.id} className="border border-gray-200 rounded-lg">
                                                 {/* Type Header */}
                         <div 
                           className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 cursor-pointer hover:bg-gray-50 space-y-2 sm:space-y-0"
                           onClick={() => toggleTypeExpanded(type.id)}
                         >
                           <div className="flex items-center space-x-3">
                             {expandedTypes.has(type.id) ? (
                               <ChevronDown className="h-4 w-4 text-gray-500" />
                             ) : (
                               <ChevronRight className="h-4 w-4 text-gray-500" />
                             )}
                             <div className="flex items-center space-x-2">
                               {editingType === type.id ? (
                                 <div className="flex items-center space-x-2">
                                   <input
                                     type="text"
                                     value={editTypeName}
                                     onChange={(e) => setEditTypeName(e.target.value)}
                                     className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                     autoFocus
                                   />
                                                                       <button
                                      onClick={() => saveEditType(type.id)}
                                      className="text-green-600 hover:text-green-700 text-lg font-bold px-2 py-1"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-600 hover:text-red-700 text-lg font-bold px-2 py-1"
                                    >
                                      ✕
                                    </button>
                                 </div>
                               ) : (
                                 <div className="flex items-center space-x-2">
                                   <span className="font-medium text-gray-900">{type.typeName}</span>
                                   <Edit3 
                                     className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" 
                                     onClick={(e) => {
                                       e.stopPropagation()
                                       startEditType(type.id, type.typeName)
                                     }}
                                   />
                                 </div>
                               )}
                             </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-2">
                             <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                               {type.imageCount} images
                             </span>
                             <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 text-xs">
                               + Add Images
                             </button>
                           </div>
                         </div>

                        {/* Type Details */}
                        {expandedTypes.has(type.id) && (
                          <div className="border-t border-gray-200 p-3 space-y-3">
                                                                                      {/* Note */}
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <span className="text-sm text-gray-600">Note:</span>
                                <div className="flex items-center space-x-2">
                                  {editingNote === type.id ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        value={editNoteText}
                                        onChange={(e) => setEditNoteText(e.target.value)}
                                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                                        placeholder="Enter note..."
                                        autoFocus
                                      />
                                                                             <button
                                         onClick={() => saveEditNote(type.id)}
                                         className="text-green-600 hover:text-green-700 text-lg font-bold px-2 py-1"
                                       >
                                         ✓
                                       </button>
                                       <button
                                         onClick={cancelEdit}
                                         className="text-red-600 hover:text-red-700 text-lg font-bold px-2 py-1"
                                       >
                                         ✕
                                       </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-900 break-words">{type.note}</span>
                                      <Edit3 
                                        className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" 
                                        onClick={() => startEditNote(type.id, type.note)}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                                                                                      {/* Images Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {type.images.map((image, index) => (
                                                                     <div key={index} className="relative group">
                                     <img
                                       src={`${config.backendUrl}${image}`}
                                       alt={`Image ${index + 1}`}
                                       className="w-full h-16 sm:h-20 object-cover rounded border border-gray-200 cursor-pointer transition-opacity"
                                       style={{ touchAction: 'manipulation' }}
                                       onClick={() => openImageModal(type.images, index)}
                                     />
                                     <button 
                                       className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                       onClick={(e) => {
                                         e.stopPropagation()
                                         deleteImage(type.id, index)
                                       }}
                                       title="Delete image"
                                     >
                                       <Trash2 className="h-3 w-3" />
                                     </button>
                                   </div>
                                ))}
                              </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
                     </div>
         )}
       </div>

       {/* Image Modal */}
       <ImageModal
         isOpen={isModalOpen}
         onClose={closeImageModal}
         images={modalImages}
         currentIndex={modalCurrentIndex}
         onPrevious={goToPreviousImage}
         onNext={goToNextImage}
       />
     </div>
   )
 }
