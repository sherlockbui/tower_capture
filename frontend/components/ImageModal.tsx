'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '@/lib/config'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onPrevious, 
  onNext 
}: ImageModalProps) {
  console.log('ImageModal props:', { isOpen, images, currentIndex })
  
  if (!isOpen) return null

  const currentImage = images[currentIndex]
  console.log('Current image:', currentImage)
  console.log('Images array:', images)
  
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  // Helper function to get the correct image URL
  const getImageSrc = (imageUrl: string) => {
    // If it's already a blob URL (from File object), use it directly
    if (imageUrl.startsWith('blob:')) {
      console.log('Using blob URL directly:', imageUrl)
      return imageUrl
    }
    
    // If it's a relative path, use getImageUrl helper
    if (imageUrl.startsWith('/')) {
      const fullUrl = getImageUrl(imageUrl)
      console.log('Using getImageUrl for relative path:', fullUrl)
      return fullUrl
    }
    
    // If it's already a full URL, use it directly
    if (imageUrl.startsWith('http')) {
      console.log('Using full URL directly:', imageUrl)
      return imageUrl
    }
    
    // Fallback: try getImageUrl
    const fallbackUrl = getImageUrl(imageUrl)
    console.log('Using getImageUrl fallback:', fallbackUrl)
    return fallbackUrl
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowLeft' && hasPrevious) {
      onPrevious()
    } else if (e.key === 'ArrowRight' && hasNext) {
      onNext()
    }
  }

  // Touch/swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && hasNext) {
      onNext()
    } else if (isRightSwipe && hasPrevious) {
      onPrevious()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Navigation buttons */}
      {hasPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrevious()
          }}
          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      )}

      {/* Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center" 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentImage ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <img
              src={getImageSrc(currentImage)}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                maxWidth: 'calc(100vw - 32px)'
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', currentImage);
                console.log('✅ Final src:', getImageSrc(currentImage));
              }}
              onError={(e) => {
                console.error('❌ Image failed to load:', currentImage);
                console.error('❌ Final src was:', getImageSrc(currentImage));
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Debug info */}
            <div className="text-white text-xs bg-black bg-opacity-50 p-2 mt-2 rounded text-center">
              <p>Original: {currentImage}</p>
              <p>Final Src: {getImageSrc(currentImage)}</p>
              <p>Type: {currentImage.startsWith('blob:') ? 'Blob URL' : 'File Path'}</p>
            </div>
          </div>
        ) : (
          <div className="text-white text-center p-4">
            <p>No image available</p>
            <p className="text-sm text-gray-400 break-all">Image URL: {currentImage}</p>
          </div>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Keyboard instructions */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
        <span className="hidden sm:inline">Use ← → arrows or ESC to close</span>
        <span className="sm:hidden">Swipe or tap to navigate</span>
      </div>
    </div>
  )
}
