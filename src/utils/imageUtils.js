export const resizeImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(resizedFile)
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

export const generateThumbnail = (file, size = 200) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Create square thumbnail
      const minDimension = Math.min(img.width, img.height)
      const startX = (img.width - minDimension) / 2
      const startY = (img.height - minDimension) / 2

      canvas.width = size
      canvas.height = size

      ctx.drawImage(
        img,
        startX,
        startY,
        minDimension,
        minDimension,
        0,
        0,
        size,
        size
      )

      canvas.toBlob(
        (blob) => {
          const thumbnailFile = new File([blob], `thumb_${file.name}`, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(thumbnailFile)
        },
        file.type,
        0.7
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

export const validateImage = (file) => {
  const errors = []

  // Check file type
  if (!file.type.startsWith('image/')) {
    errors.push('File must be an image')
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB')
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!supportedTypes.includes(file.type)) {
    errors.push('Supported formats: JPEG, PNG, WebP, GIF')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      })
    }
    img.src = URL.createObjectURL(file)
  })
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}