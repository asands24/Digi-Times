import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const usePhotos = () => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadPhoto = async (file, eventId, caption = '') => {
    if (!user || !file || !eventId) {
      return { error: new Error('Missing required data') }
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return { error: new Error('Invalid file type') }
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB')
        return { error: new Error('File too large') }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        toast.error('Failed to upload photo')
        return { error: uploadError }
      }

      setUploadProgress(50)

      // Save photo metadata to database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          event_id: eventId,
          file_path: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          caption: caption,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('photos')
          .remove([uploadData.path])

        toast.error('Failed to save photo metadata')
        return { error: dbError }
      }

      setUploadProgress(100)
      toast.success('Photo uploaded successfully!')

      return { data: photoData, error: null }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
      return { error }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const uploadMultiplePhotos = async (files, eventId) => {
    if (!files || files.length === 0) {
      return { error: new Error('No files selected') }
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await uploadPhoto(file, eventId)

      results.push(result)

      if (result.error) {
        errorCount++
      } else {
        successCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo(s) uploaded successfully!`)
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} photo(s) failed to upload`)
    }

    return { results, successCount, errorCount }
  }

  const deletePhoto = async (photoId, filePath) => {
    try {
      setUploading(true)

      // Delete from database first
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (dbError) {
        toast.error('Failed to delete photo')
        return { error: dbError }
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Don't return error as the database record is already deleted
      }

      toast.success('Photo deleted successfully!')
      return { error: null }
    } catch (error) {
      toast.error('Failed to delete photo')
      return { error }
    } finally {
      setUploading(false)
    }
  }

  const updatePhotoCaption = async (photoId, caption) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ caption })
        .eq('id', photoId)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update caption')
        return { error }
      }

      toast.success('Caption updated successfully!')
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to update caption')
      return { error }
    }
  }

  const getPhotoUrl = (filePath) => {
    if (!filePath) return null

    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const downloadPhoto = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .download(filePath)

      if (error) {
        toast.error('Failed to download photo')
        return { error }
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { error: null }
    } catch (error) {
      toast.error('Failed to download photo')
      return { error }
    }
  }

  return {
    uploading,
    uploadProgress,
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    updatePhotoCaption,
    getPhotoUrl,
    downloadPhoto
  }
}