'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Plus, X, Trash2, Edit3, ChevronDown, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { sitesAPI, typesAPI, capturesAPI } from '@/lib/api'
import { config, getImageUrl } from '@/lib/config'
import ImageModal from './ImageModal'
import EditTypeModal from './EditTypeModal'
import Toast from './Toast'
import { User } from '@/types'
import { log } from 'console'

// Validation schemas
const stationCodeSchema = z.object({
  stationCode: z.string()
    .min(1, 'Station Code là bắt buộc')
    .transform(val => val.trim().toUpperCase())
    .refine(val => val.length > 0, 'Station Code không được để trống')
    .refine(val => !val.includes(' '), 'Station Code không được chứa khoảng trắng')
})

const typeNameSchema = z.object({
  typeName: z.string()
    .min(1, 'Type Name là bắt buộc')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Type Name không được để trống')
    .refine(val => !val.includes(' '), 'Type Name không được chứa khoảng trắng')
})

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

interface TowerCaptureFormProps {
  user: User | null
}

export default function TowerCaptureForm({ user }: TowerCaptureFormProps) {
  const [captureTypes, setCaptureTypes] = useState<CaptureType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [showToast, setShowToast] = useState(false)
  const [stationCode, setStationCode] = useState('')

  // Form for station code validation
  const stationForm = useForm({
    resolver: zodResolver(stationCodeSchema),
    defaultValues: {
      stationCode: ''
    }
  })

  // Form for type name validation
  const typeForm = useForm({
    resolver: zodResolver(typeNameSchema),
    defaultValues: {
      typeName: ''
    }
  })

  // New state for uploaded images
  const [uploadedStations, setUploadedStations] = useState<StationData[]>([])
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set())
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [addingImagesTypeId, setAddingImagesTypeId] = useState<string | null>(null)

  // Admin toggle state
  const [showAllData, setShowAllData] = useState(false)
  
  // ===== MODAL STATE =====
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0)

  // ===== EDIT MODE STATE =====
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<{
    id: string
    typeName: string
    note: string
  } | null>(null)
  
  // Image optimization settings (fixed, no user controls needed)
  const imageQuality = 0.8 // 80% quality - good balance
  const maxWidth = 1920 // Max width in pixels
  const maxHeight = 1080 // Max height in pixels

  // Initialize with one default capture type
  useEffect(() => {
    // Add one default capture type when component mounts
    if (captureTypes.length === 0) {
      setCaptureTypes([{
        id: 'default-1',
        typeName: '',
        note: '',
        images: []
      }])
    }
  }, [])

  // Sync stationCode state with form value on initial load
  useEffect(() => {
    const currentValue = stationForm.getValues('stationCode')
    setStationCode(currentValue)
  }, [])

  // Check if form is valid for upload
  const isFormValid = () => {
    // Check if station code is filled and valid
    if (!stationCode || stationCode.trim() === '' || stationCode.includes(' ')) {
      return false
    }
    
    // Check if at least one capture type has required fields
    return captureTypes.some(type => 
      type.typeName.trim() !== '' && 
      type.images.length > 0
    )
  }

  // Image optimization function
  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        const aspectRatio = width / height
        
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
        
        // Set canvas dimensions
        canvas.width = width
        canvas.height = height
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to blob with quality setting
        canvas.toBlob((blob) => {
          if (blob) {
            // Create new file with optimized data
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            resolve(file) // Fallback to original if optimization fails
          }
        }, 'image/jpeg', imageQuality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Optimize multiple images
  const optimizeImages = async (files: File[]): Promise<File[]> => {
    try {
      const optimizedFiles = await Promise.all(
        files.map(file => optimizeImage(file))
      )
      return optimizedFiles
    } catch (error) {
      console.error('Error optimizing images:', error)
      return files // Return original files if optimization fails
    }
  }

  // Date navigation state
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    // Set to start of day in local timezone
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date()
    // Format as YYYY-MM-DD in local timezone
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })



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
  }, [selectedDate, showAllData]) // Reload when date changes or admin toggle changes

  const loadUploadedStations = async () => {
    try {
      setIsLoadingStations(true)
      // Use selected date in local timezone (not UTC)
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      // Use appropriate API based on user role and admin preference
      let response
      if (user?.role === 'admin' && showAllData) {
        // Admin wants to see all users' data
        response = await capturesAPI.getByDateAdmin(dateString)
      } else {
        // Regular users or admin viewing own data only
        response = await capturesAPI.getByDate(dateString)
      }

      // Group captures by station and type
      const stationMap = new Map<string, StationData>()

      response.captures.forEach((capture: any) => {
        
        const siteCode = capture.siteCode
        const typeName = capture.typeName
        const typeId = capture.typeId || capture._id || capture.id

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
            note: (capture as any).note || '',
            imageCount: 0,
            images: []
          }
          station.types.push(type)
        } else {
          // Update existing type with note if it has changed
          if ((capture as any).note !== undefined && type.note !== (capture as any).note) {
            type.note = (capture as any).note
          }
        }

        type.imageCount += capture.images.length
        type.images.push(...capture.images)
      })

      const stationsArray = Array.from(stationMap.values())
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
    // Handle both File objects and string URLs
    const fullImageUrls = images.map(image => {
      if (image instanceof File) {
        // For File objects, create object URL
        const objectUrl = URL.createObjectURL(image)
        return objectUrl
      } else {
        // For string URLs, use getImageUrl helper
        const fullUrl = getImageUrl(image as string)
        return fullUrl
      }
    })

    setModalImages(fullImageUrls)
    setModalCurrentIndex(startIndex)
    setIsModalOpen(true)
  }

  const closeImageModal = () => {
    // Cleanup object URLs before closing
    modalImages.forEach(url => {
      if (url.startsWith('blob:')) {
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
    
    // Format as YYYY-MM-DD in local timezone
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    setDateInput(`${year}-${month}-${day}`)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
    
    // Format as YYYY-MM-DD in local timezone
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    setDateInput(`${year}-${month}-${day}`)
  }

  const goToToday = () => {
    const today = new Date()
    // Set to start of day in local timezone
    today.setHours(0, 0, 0, 0)
    setSelectedDate(today)
    
    // Format as YYYY-MM-DD in local timezone
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    setDateInput(`${year}-${month}-${day}`)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    // Set to start of day in local timezone
    newDate.setHours(0, 0, 0, 0)
    setSelectedDate(newDate)
    setDateInput(e.target.value)
  }

  // Edit functions
  const startEditType = (typeId: string, currentName: string, currentNote: string) => {
    setEditingType({
      id: typeId,
      typeName: currentName,
      note: currentNote || ''
    })
    setEditModalOpen(true)
  }

  const startEditNote = (typeId: string, currentNote: string) => {
    // Find the current type to get its name
    let currentTypeName = ''
    let foundType = null
    
    for (const station of uploadedStations) {
      const type = station.types.find(t => t.id === typeId)
      if (type) {
        currentTypeName = type.typeName
        foundType = type
        break
      }
    }
    
    setEditingType({
      id: typeId,
      typeName: currentTypeName,
      note: currentNote || ''
    })
    setEditModalOpen(true)
  }

  const saveEditType = async (typeName: string, note: string) => {
    if (!editingType) return
    
    try {
      // Call API to update type in backend
      await typesAPI.update(editingType.id, typeName, note)
      
      // Update local state
      let updated = false
      
      const updatedStations = uploadedStations.map(station => {
        const updatedTypes = station.types.map(type => {
          if (type.id === editingType.id) {
            updated = true
            return { ...type, typeName, note }
          }
          return type
        })
        return { ...station, types: updatedTypes }
      })

      if (updated) {
        setUploadedStations(updatedStations)
        setMessage('Type updated successfully!')
        setMessageType('success')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error updating type:', error)
      setMessage('Failed to update type. Please try again.')
      setMessageType('error')
      setShowToast(true)
    } finally {
      setEditingType(null)
      setEditModalOpen(false)
    }
  }

  const cancelEdit = () => {
    setEditingType(null)
    setEditModalOpen(false)
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
    // Auto-uppercase for typeName field
    const processedValue = field === 'typeName' ? value.toUpperCase() : value
    
    setCaptureTypes(prev => prev.map(type =>
      type.id === id ? { ...type, [field]: processedValue } : type
    ))
  }

  const addImages = async (typeId: string, files: FileList) => {
    try {
      const fileArray = Array.from(files)
      
      // Optimize images before adding to state
      const optimizedFiles = await optimizeImages(fileArray)
      
      setCaptureTypes(prev => prev.map(type =>
        type.id === typeId
          ? { ...type, images: [...type.images, ...optimizedFiles] }
          : type
      ))
    } catch (error) {
      console.error('Error optimizing images:', error)
      // Fallback to original files if optimization fails
      const fileArray = Array.from(files)
      setCaptureTypes(prev => prev.map(type =>
        type.id === typeId
          ? { ...type, images: [...type.images, ...fileArray] }
          : type
      ))
    }
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

  // Add images to existing type in uploaded stations
  const addImagesToExistingType = async (typeId: string, files: FileList) => {
    try {
      setAddingImagesTypeId(typeId)
      const fileArray = Array.from(files)
      
      // Optimize images before uploading
      const optimizedFiles = await optimizeImages(fileArray)
      
      // Upload optimized images to backend
      await capturesAPI.upload(typeId, optimizedFiles)
      
      // Reload uploaded stations to show new images
      await loadUploadedStations()
      
      setMessage(`Đã thêm ${fileArray.length} hình ảnh thành công!`)
      setMessageType('success')
      setShowToast(true)
    } catch (error: any) {
      let errorMessage = 'Không thể thêm hình ảnh. Vui lòng thử lại.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setMessage(errorMessage)
      setMessageType('error')
      setShowToast(true)
    } finally {
      setAddingImagesTypeId(null)
    }
  }

  const handleUpload = async () => {
    // Clear previous errors
    setMessage('')

    // Validate station code using react-hook-form
    const stationResult = await stationForm.trigger()
    if (!stationResult) {
      setMessage('Vui lòng kiểm tra lại Station Code')
      setMessageType('error')
      setShowToast(true)
      return
    }

    if (captureTypes.length === 0) {
      setMessage('Vui lòng thêm ít nhất một Capture Type')
      setMessageType('error')
      setShowToast(true)
      return
    }

    // Validate all type names
    for (const type of captureTypes) {
      if (!type.typeName.trim()) {
        setMessage('Tất cả Type Name phải được nhập')
        setMessageType('error')
        setShowToast(true)
        return
      }
      if (type.typeName.includes(' ')) {
        setMessage('Type Name không được chứa khoảng trắng')
        setMessageType('error')
        setShowToast(true)
        return
      }
    }

    const hasImages = captureTypes.some(type => type.images.length > 0)
    if (!hasImages) {
      setMessage('Vui lòng chọn ít nhất một hình ảnh')
      setMessageType('error')
      setShowToast(true)
      return
    }

    try {
      setIsLoading(true)
      setMessage('Đang upload...')

      const stationCode = stationForm.getValues('stationCode').trim()

      // Tạo hoặc lấy site
      let site
      try {
        const response = await sitesAPI.create(stationCode)
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
      setMessageType('success')
      setShowToast(true)
      // Reset form after successful upload
      setCaptureTypes([])
      stationForm.reset()
      typeForm.reset()
      setStationCode('')

      // Reload uploaded stations
      await loadUploadedStations()
      
      // Also reload for today to ensure data appears immediately
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (today.getTime() !== selectedDate.getTime()) {
        setSelectedDate(today)
      }
    } catch (error: any) {
      let errorMessage = 'Upload thất bại. Vui lòng thử lại.'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      setMessage(errorMessage)
      setMessageType('error')
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Main Upload Form */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Image Upload Form</h2>
              <p className="text-xs text-gray-600">Fill in the details below to upload your images</p>
            </div>
          </div>
          

        </div>

        <div className="p-3 sm:p-4 space-y-6">
          {/* Station Code Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <label className="text-sm font-semibold text-gray-700">
                Station Code
              </label>
              <span className="text-red-500 text-lg">*</span>
              {stationCode && stationCode.trim() !== '' && !stationCode.includes(' ') ? null : (
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                  Required
                </span>
              )}
            </div>
            
            <div className="relative">
              <input
                {...stationForm.register('stationCode')}
                type="text"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-base font-medium ${
                  stationCode.includes(' ') 
                    ? 'border-red-300 bg-red-50' 
                    : stationCode.trim() === '' 
                      ? 'border-orange-300 bg-orange-50' 
                      : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                }`}
                placeholder="Enter station code (e.g., BTS001)"
                onChange={(e) => {
                  const value = e.target.value.toUpperCase()
                  stationForm.setValue('stationCode', value)
                  setStationCode(value)
                }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {stationCode.includes(' ') ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ) : stationCode.trim() === '' ? (
                  <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Validation Messages */}
            {stationCode.includes(' ') && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Station Code không được chứa khoảng trắng</span>
              </div>
            )}
            {stationCode.trim() === '' && (
              <div className="flex items-center space-x-2 text-orange-600 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Station Code là bắt buộc</span>
              </div>
            )}

          </div>

          {/* Capture Types Section */}
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-700">Capture Types</h3>
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {captureTypes.length} type{captureTypes.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {captureTypes.length === 0 && (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-2">Loading form...</p>
                <p className="text-sm text-gray-400">Please wait a moment</p>
              </div>
            )}

            <div className="space-y-4 lg:space-y-6">
              {captureTypes.map((type, index) => (
                <div key={type.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  {/* Type Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        index === 0 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-br from-blue-400 to-blue-500'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {index === 0 ? 'M' : index + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg truncate">
                          {index === 0 ? 'Main Type' : `Type ${index + 1}`}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {index === 0 ? 'Primary capture type' : 'Additional capture type'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeCaptureType(type.id)}
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 flex-shrink-0 ml-3 ${
                        captureTypes.length === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700'
                      }`}
                      disabled={captureTypes.length === 1}
                      title={captureTypes.length === 1 ? "Cannot remove the last type" : "Remove this type"}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                    {/* Left Column - Type Name & Note */}
                    <div className="space-y-4">
                      {/* Type Name */}
                      <div className="space-y-2 lg:space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Type Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={type.typeName}
                            onChange={(e) => {
                              updateCaptureType(type.id, 'typeName', e.target.value)
                            }}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-base font-medium ${
                              type.typeName.includes(' ') 
                                ? 'border-red-300 bg-red-50' 
                                : type.typeName.trim() === '' 
                                  ? 'border-orange-300 bg-orange-50' 
                                  : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                            }`}
                            placeholder="BTS, GPV, etc..."
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {type.typeName.includes(' ') ? (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            ) : type.typeName.trim() === '' ? (
                              <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Validation Messages */}
                        {type.typeName.includes(' ') && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Type Name không được chứa khoảng trắng</span>
                          </div>
                        )}
                        {type.typeName.trim() === '' && (
                          <div className="flex items-center space-x-2 text-orange-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>Type Name là bắt buộc</span>
                          </div>
                        )}

                      </div>

                      {/* Note */}
                      <div className="space-y-2 lg:space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Note <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={type.note}
                          onChange={(e) => updateCaptureType(type.id, 'note', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-base font-medium"
                          placeholder="Optional notes or descriptions..."
                        />
                      </div>
                    </div>

                    {/* Right Column - Images */}
                    <div className="space-y-4 lg:space-y-5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Images <span className="text-red-500">*</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${
                          type.images.length === 0 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {type.images.length === 0 
                            ? 'No images selected' 
                            : `${type.images.length} image${type.images.length !== 1 ? 's' : ''} selected`
                          }
                        </span>
                      </label>

                      {/* Image Upload Area */}
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 lg:p-6 text-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
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
                          className="cursor-pointer block"
                        >
                          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Upload className="h-8 w-8 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Click to select images
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, JPEG up to 10MB each
                          </p>
                        </label>
                      </div>

                      {/* Image Actions */}
                      {type.images.length > 0 && (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => clearAllImages(type.id)}
                            className="inline-flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Clear All</span>
                          </button>
                          <span className="text-sm text-gray-500">
                            Total: {(type.images.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}

                      {/* Image Previews */}
                      {type.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {type.images.map((image, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 transition-all duration-200">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Preview ${imageIndex + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => openImageModal([image], 0)}
                                />
                              </div>
                              <button
                                onClick={() => removeImage(type.id, imageIndex)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors duration-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="text-xs text-gray-500 mt-1 text-center truncate">
                                {(image.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Type Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={addCaptureType}
                className="inline-flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium text-sm">Add New Type</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Footer */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-4 border-t border-gray-100">
          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={isLoading || !isFormValid()}
              className={`inline-flex items-center justify-center space-x-3 px-12 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                isLoading || !isFormValid()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : !isFormValid() ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Complete Form First</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 text-center ${message.includes('thành công')
            ? 'bg-green-50 border border-green-200 text-green-800'
            : message.includes('Upload thất bại')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
          {message}
        </div>
      )}

      {/* Uploaded Images Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-4 border-b border-gray-100">
          <div className="flex flex-col space-y-4">
            {/* Title & Admin Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Uploaded Images</h2>
                  <p className="text-xs text-gray-600">View and manage your captures</p>
                </div>
              </div>
              
              {/* Admin Toggle */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAllData(!showAllData)}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showAllData
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 shadow-sm'
                  }`}
                >
                  {showAllData ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>All Users</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>My Data</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Date Navigation - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
              {/* Date Input - Compact on Mobile */}
              <div className="w-auto sm:flex-1">
                <input
                  type="date"
                  value={dateInput}
                  onChange={handleDateChange}
                  className="w-48 sm:w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>
              
                             {/* Navigation Buttons */}
               <div className="flex items-center justify-center gap-4">
                 <button
                   onClick={goToPreviousDay}
                   className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                   title="Ngày trước"
                 >
                   <ChevronLeft className="h-5 w-5" />
                 </button>
                 
                 <button
                   onClick={goToToday}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-colors"
                   title="Hôm nay"
                 >
                   Today
                 </button>
                 
                 <button
                   onClick={goToNextDay}
                   className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                   title="Ngày sau"
                 >
                   <ChevronRight className="h-5 w-5" />
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoadingStations ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading captures...</h3>
            <p className="text-gray-500 text-sm">Please wait while we fetch your data</p>
          </div>
        ) : uploadedStations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No captures found</h3>
            <p className="text-gray-500 text-sm mb-1">
              No stations were captured on {selectedDate.toLocaleDateString('vi-VN')}
            </p>
            <p className="text-gray-400 text-xs">Try uploading some images or select a different date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedStations.map((station) => (
              <div key={station.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Station Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleStationExpanded(station.siteCode)}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      expandedStations.has(station.siteCode) 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {expandedStations.has(station.siteCode) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-base truncate">Station: {station.siteCode}</h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">Created: {station.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                      {station.types.length} type{station.types.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                                {/* Station Types */}
                {expandedStations.has(station.siteCode) && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    {station.types.map((type) => (
                      <div key={type.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Type Header */}
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => toggleTypeExpanded(type.id)}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                              expandedTypes.has(type.id) 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {expandedTypes.has(type.id) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                <span className="font-medium text-gray-900 text-sm truncate">{type.typeName}</span>
                                <Edit3
                                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditType(type.id, type.typeName, type.note || '')
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap">
                              {type.imageCount} image{type.imageCount !== 1 ? 's' : ''}
                            </span>
                            <button 
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors duration-200 ${
                                addingImagesTypeId === type.id 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (addingImagesTypeId === type.id) return
                                // Trigger file input click
                                const fileInput = document.getElementById(`file-input-${type.id}`) as HTMLInputElement
                                if (fileInput) {
                                  fileInput.click()
                                }
                              }}
                              disabled={addingImagesTypeId === type.id}
                            >
                              {addingImagesTypeId === type.id ? 'Adding...' : '+ Add Images'}
                            </button>
                            <input
                              id={`file-input-${type.id}`}
                              type="file"
                              multiple
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => e.target.files && addImagesToExistingType(type.id, e.target.files)}
                            />
                          </div>
                        </div>

                        {/* Type Details */}
                        {expandedTypes.has(type.id) && (
                          <div className="border-t border-gray-100 p-4 space-y-4">
                            {/* Note Section */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                                <span className="text-sm font-medium text-gray-700 flex-shrink-0 italic">Note:</span>
                                <Edit3
                                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditNote(type.id, type.note || '')
                                  }}
                                />
                              </div>
                              <div className="ml-0 sm:ml-6">
                                <span className="text-sm text-gray-600 break-words italic">
                                  {type.note || 'No note added'}
                                </span>
                              </div>
                            </div>

                            {/* Images Section */}
                            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700">Images ({type.images.length})</h4>
                              </div>
                              
                              {/* Images Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {type.images.map((image, index) => (
                                  <div key={index} className="relative group aspect-square">
                                    <img
                                      src={getImageUrl(image)}
                                      alt={`Image ${index + 1}`}
                                      className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:scale-105"
                                      style={{ touchAction: 'manipulation' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openImageModal(type.images, index)
                                      }}
                                    />
                                    <button
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-red-600"
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

      {/* Toast Component */}
      <Toast
        message={message}
        type={messageType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />

      {/* Edit Type Modal */}
      {editingType && (
        <EditTypeModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingType(null)
          }}
          onSave={saveEditType}
          initialTypeName={editingType.typeName}
          initialNote={editingType.note}
        />
      )}
    </div>
  )
}
