import { supabase } from '../../utils/supabase/client'

export type StorageBucket = 'avatars' | 'pet-images' | 'post-images'

interface UploadOptions {
  bucket: StorageBucket
  path: string
  file: File
  upsert?: boolean
}

export const uploadImage = async ({ bucket, path, file, upsert = false }: UploadOptions): Promise<string> => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen')
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('La imagen debe ser menor a 5MB')
    }

    // Create unique file name
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${path}-${timestamp}-${randomStr}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error: any) {
    console.error('Error uploading image:', error)
    throw new Error(error.message || 'Error al subir la imagen')
  }
}

export const deleteImage = async (bucket: StorageBucket, path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  } catch (error: any) {
    console.error('Error deleting image:', error)
    throw new Error('Error al eliminar la imagen')
  }
}

export const getPublicUrl = (bucket: StorageBucket, path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return publicUrl
}

// Helper to convert File to base64 for preview
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}
