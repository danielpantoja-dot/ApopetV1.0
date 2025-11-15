import { useState } from 'react'
import { uploadImage, deleteImage, fileToBase64, StorageBucket } from '../lib/supabase/storage'
import { toast } from 'sonner@2.0.3'

export const useStorage = () => {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File, bucket: StorageBucket, path: string): Promise<string | null> => {
    setUploading(true)
    setProgress(0)

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const url = await uploadImage({ bucket, path, file })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      toast.success('Imagen subida exitosamente')
      return url
    } catch (error: any) {
      toast.error(error.message || 'Error al subir la imagen')
      return null
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const remove = async (bucket: StorageBucket, path: string): Promise<boolean> => {
    setDeleting(true)

    try {
      await deleteImage(bucket, path)
      toast.success('Imagen eliminada')
      return true
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la imagen')
      return false
    } finally {
      setDeleting(false)
    }
  }

  const getPreview = async (file: File): Promise<string | null> => {
    try {
      return await fileToBase64(file)
    } catch (error) {
      console.error('Error getting preview:', error)
      return null
    }
  }

  return {
    upload,
    remove,
    getPreview,
    uploading,
    deleting,
    progress
  }
}
