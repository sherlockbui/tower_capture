'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { sitesAPI, typesAPI, capturesAPI } from '@/lib/api'
import { User, Site, Type } from '@/types'
import { Upload, Plus, X, Camera } from 'lucide-react'

interface UploadFormProps {
  user: User
}

interface UploadFormData {
  siteCode: string
  typeName: string
}

export default function UploadForm({ user }: UploadFormProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [types, setTypes] = useState<Type[]>([])
  const [selectedType, setSelectedType] = useState<Type | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>()

  const [images, setImages] = useState<File[]>([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      setImages(prev => [...prev, ...acceptedFiles])
    }
  })

  // Load user's sites on component mount
  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async () => {
    try {
      const userSites = await sitesAPI.getAll()
      setSites(userSites)
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const loadTypes = async (siteId: string) => {
    try {
      const siteTypes = await typesAPI.getBySite(siteId)
      setTypes(siteTypes)
    } catch (error) {
      console.error('Failed to load types:', error)
    }
  }

  const handleSiteSubmit = async (data: UploadFormData) => {
    try {
      setIsLoading(true)
      setMessage('')
      
      const newSiteResponse = await sitesAPI.create(data.siteCode)
      const newSite = newSiteResponse.site
      setSites(prev => [newSite, ...prev])
      setSelectedSite(newSite)
      reset()
      setMessage('Site created successfully!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create site')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTypeSubmit = async (data: UploadFormData) => {
    if (!selectedSite) return

    try {
      setIsLoading(true)
      setMessage('')
      
      const newTypeResponse = await typesAPI.create(selectedSite.id, data.typeName)
      const newType = newTypeResponse.type
      setTypes(prev => [newType, ...prev])
      setSelectedType(newType)
      reset()
      setMessage('Type created successfully!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create type')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedType || images.length === 0) return

    try {
      setIsLoading(true)
      setMessage('')
      
      await capturesAPI.upload(selectedType.id, images)
      setImages([])
      setMessage('Images uploaded successfully!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to upload images')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site)
    setSelectedType(null)
    setTypes([])
    loadTypes(site.id)
  }

  const handleTypeSelect = (type: Type) => {
    setSelectedType(type)
  }

  return (
    <div className="space-y-8">
      {/* Site Creation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Site</h3>
        <form onSubmit={handleSubmit(handleSiteSubmit)} className="space-y-4">
          <div>
            <label htmlFor="siteCode" className="block text-sm font-medium text-gray-700 mb-1">
              Site Code
            </label>
            <input
              {...register('siteCode', { required: 'Site code is required' })}
              type="text"
              id="siteCode"
              className="input-field"
              placeholder="Enter site code"
            />
            {errors.siteCode && (
              <p className="text-red-600 text-sm mt-1">{errors.siteCode.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Site</span>
          </button>
        </form>
      </div>

      {/* Site Selection */}
      {sites.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Site</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => handleSiteSelect(site)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedSite?.id === site.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{site.siteCode}</div>
                <div className="text-sm text-gray-500">
                  {new Date(site.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type Creation */}
      {selectedSite && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Type for {selectedSite.siteCode}
          </h3>
          <form onSubmit={handleSubmit(handleTypeSubmit)} className="space-y-4">
            <div>
              <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">
                Type Name
              </label>
              <input
                {...register('typeName', { required: 'Type name is required' })}
                type="text"
                id="typeName"
                className="input-field"
                placeholder="Enter type name"
              />
              {errors.typeName && (
                <p className="text-red-600 text-sm mt-1">{errors.typeName.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Type</span>
            </button>
          </form>
        </div>
      )}

      {/* Type Selection */}
      {types.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedType?.id === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{type.typeName}</div>
                <div className="text-sm text-gray-500">
                  {new Date(type.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Upload */}
      {selectedType && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Images for {selectedType.typeName}
          </h3>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag & drop images here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: JPEG, PNG, GIF, WebP (Max 10 files)
            </p>
          </div>

          {images.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Selected Images ({images.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImageUpload}
                disabled={isLoading || images.length === 0}
                className="btn-primary mt-4 flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{isLoading ? 'Uploading...' : `Upload ${images.length} Images`}</span>
              </button>
            </div>
          )}
        </div>
      )}

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
