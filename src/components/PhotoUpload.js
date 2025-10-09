import { useState, useRef } from 'react'
import { usePhotos } from '../hooks/usePhotos'
import { validateImage, formatFileSize } from '../utils/imageUtils'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'

const PhotoUpload = ({ eventId, onUploadComplete, multiple = true }) => {
  const { uploadPhoto, uploadMultiplePhotos, uploading, uploadProgress } = usePhotos()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const fileInputRef = useRef(null)

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const errors = []
    const validFiles = []

    fileArray.forEach((file, index) => {
      const validation = validateImage(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        errors.push({
          fileName: file.name,
          errors: validation.errors
        })
      }
    })

    setSelectedFiles(validFiles)
    setValidationErrors(errors)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    let result
    if (multiple && selectedFiles.length > 1) {
      result = await uploadMultiplePhotos(selectedFiles, eventId)
    } else {
      result = await uploadPhoto(selectedFiles[0], eventId)
    }

    if (!result.error) {
      setSelectedFiles([])
      setValidationErrors([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (onUploadComplete) {
        onUploadComplete()
      }
    }
  }

  const reset = () => {
    setSelectedFiles([])
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center drag-zone ${
          dragActive
            ? 'border-blue-400 bg-blue-50 drag-active'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="w-12 h-12 text-gray-400" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Photos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your photos here, or click to select files
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              disabled={uploading}
            >
              <ImageIcon className="w-4 h-4" />
              Choose Photos
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Supported formats: JPEG, PNG, WebP, GIF (max 10MB each)
          </p>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Some files couldn't be uploaded:
              </h4>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    <strong>{error.fileName}:</strong> {error.errors.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover-lift gesture-smooth"
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-600 gesture-smooth hover-scale"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="btn btn-primary"
            >
              {uploading ? (
                <>
                  <div className="loading w-4 h-4" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </button>
            <button
              onClick={reset}
              disabled={uploading}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload