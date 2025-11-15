/**
 * usePetLikes Hook - VERSIÓN CORREGIDA CON likes_count
 */
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface PetLikeStats {
  likesCount: number
  isLiked: boolean
}

export const usePetLikes = (petId: string) => {
  const [stats, setStats] = useState<PetLikeStats>({
    likesCount: 0,
    isLiked: false
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const getVisitorId = (): string => {
    let visitorId = localStorage.getItem('visitor_id')
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('visitor_id', visitorId)
    }
    return visitorId
  }

  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      visitorId: getVisitorId()
    }
  }

  /**
   * Carga el contador de likes y verifica si el visitante ya dio like
   */
  const fetchLikeStats = async () => {
    if (!petId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { visitorId } = getBrowserInfo()

      // 1. Obtener contador total de likes DESDE LA TABLA PETS
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('likes_count') // ✅ CORREGIDO: likes_count en lugar de likes
        .eq('id', petId)
        .single()

      if (petError) throw petError

      // 2. Verificar si este visitante ya dio like
      const { data: existingLike, error: likeError } = await supabase
        .from('pet_likes')
        .select('id')
        .eq('pet_id', petId)
        .eq('ip_address', visitorId)
        .maybeSingle()

      if (likeError && likeError.code !== 'PGRST116') {
        console.error('Error checking like:', likeError)
      }

      setStats({
        likesCount: pet?.likes_count || 0, // ✅ CORREGIDO: likes_count en lugar de likes
        isLiked: !!existingLike
      })

    } catch (err: any) {
      console.error('Error fetching like stats:', err)
      toast.error('Error al cargar información de likes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLikeStats()
  }, [petId])

  /**
   * ✅ YA NO ES NECESARIO - EL TRIGGER DE LA BASE DE DATOS LO HACE AUTOMÁTICAMENTE
   * El trigger se ejecuta automáticamente cuando se inserta/elimina en pet_likes
   * 
   * Mantenemos esta función por compatibilidad pero ya no se usa
   */

  /**
   * Dar like a una mascota - ✅ VERSIÓN CON TRIGGER AUTOMÁTICO
   */
  const likePet = async (): Promise<boolean> => {
    if (!petId) {
      toast.error('ID de mascota no válido')
      return false
    }

    try {
      setProcessing(true)
      const { visitorId, userAgent } = getBrowserInfo()

      // 1. Insertar like en la tabla pet_likes
      // El trigger automáticamente actualizará likes_count en pets
      const { error: likeError } = await supabase
        .from('pet_likes')
        .insert([{
          pet_id: petId,
          visitor_id: visitorId,
          ip_address: visitorId,
          user_agent: userAgent
        }])

      if (likeError) {
        if (likeError.code === '23505') {
          toast.info('Ya has dado like a esta mascota')
          setStats(prev => ({ ...prev, isLiked: true }))
          return false
        }
        throw likeError
      }

      // 2. Actualizar estado local
      setStats(prev => ({
        likesCount: prev.likesCount + 1,
        isLiked: true
      }))

      toast.success('¡Like dado! 💖')
      return true

    } catch (err: any) {
      console.error('Error giving like:', err)
      toast.error('Error al dar like')
      return false
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Quitar like de una mascota - ✅ VERSIÓN CON TRIGGER AUTOMÁTICO
   */
  const unlikePet = async (): Promise<boolean> => {
    if (!petId) {
      toast.error('ID de mascota no válido')
      return false
    }

    try {
      setProcessing(true)
      const { visitorId } = getBrowserInfo()

      // 1. Eliminar like de la tabla pet_likes
      // El trigger automáticamente actualizará likes_count en pets
      const { error: deleteError } = await supabase
        .from('pet_likes')
        .delete()
        .eq('pet_id', petId)
        .eq('ip_address', visitorId)

      if (deleteError) throw deleteError

      // 2. Actualizar estado local
      setStats(prev => ({
        likesCount: Math.max(0, prev.likesCount - 1),
        isLiked: false
      }))

      toast.success('Like removido')
      return true

    } catch (err: any) {
      console.error('Error removing like:', err)
      toast.error('Error al quitar like')
      return false
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Toggle entre like/unlike
   */
  const toggleLike = async (): Promise<boolean> => {
    if (processing) return false

    if (stats.isLiked) {
      return await unlikePet()
    } else {
      return await likePet()
    }
  }

  return {
    likesCount: stats.likesCount,
    isLiked: stats.isLiked,
    loading,
    processing,
    likePet,
    unlikePet,
    toggleLike,
    refresh: fetchLikeStats
  }
}