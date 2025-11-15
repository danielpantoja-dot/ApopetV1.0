/**
 * useFollows Hook
 * 
 * Hook personalizado para gestionar el sistema de seguimiento (follows)
 * Permite seguir/dejar de seguir usuarios y obtener estadísticas de seguidores
 * 
 * @hook
 */

import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface FollowStats {
  followers: number
  following: number
  isFollowing: boolean
}

export const useFollows = (userId: string, currentUserId?: string) => {
  const [stats, setStats] = useState<FollowStats>({
    followers: 0,
    following: 0,
    isFollowing: false
  })
  const [loading, setLoading] = useState(true)

  /**
   * Carga las estadísticas de seguimiento de un usuario
   */
  const fetchFollowStats = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Obtener número de seguidores (personas que siguen a este usuario)
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      if (followersError) throw followersError

      // Obtener número de seguidos (personas que este usuario sigue)
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      if (followingError) throw followingError

      // Verificar si el usuario actual sigue a este usuario
      let isFollowing = false
      if (currentUserId && currentUserId !== userId) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .single()

        if (!followError && followData) {
          isFollowing = true
        }
      }

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        isFollowing
      })
    } catch (err: any) {
      console.error('Error fetching follow stats:', err)
      // No mostramos error al usuario para no interferir con la UX
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowStats()
  }, [userId, currentUserId])

  /**
   * Seguir a un usuario
   */
  const followUser = async (targetUserId: string) => {
    if (!currentUserId) {
      toast.error('Debes iniciar sesión para seguir usuarios')
      return false
    }

    if (currentUserId === targetUserId) {
      toast.error('No puedes seguirte a ti mismo')
      return false
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert([{
          follower_id: currentUserId,
          following_id: targetUserId
        }])

      if (error) throw error

      // Actualizar estado local
      setStats(prev => ({
        ...prev,
        followers: prev.followers + 1,
        isFollowing: true
      }))

      // Crear notificación para el usuario seguido
      await supabase
        .from('notifications')
        .insert([{
          user_id: targetUserId,
          type: 'follow',
          content: 'te ha comenzado a seguir',
          sender_id: currentUserId
        }])

      toast.success('Ahora sigues a este usuario')
      return true
    } catch (err: any) {
      console.error('Error following user:', err)
      
      // Si el error es de duplicado, significa que ya sigue al usuario
      if (err.code === '23505') {
        toast.info('Ya sigues a este usuario')
      } else {
        toast.error('Error al seguir usuario')
      }
      return false
    }
  }

  /**
   * Dejar de seguir a un usuario
   */
  const unfollowUser = async (targetUserId: string) => {
    if (!currentUserId) {
      toast.error('Debes iniciar sesión')
      return false
    }

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)

      if (error) throw error

      // Actualizar estado local
      setStats(prev => ({
        ...prev,
        followers: Math.max(0, prev.followers - 1),
        isFollowing: false
      }))

      toast.success('Has dejado de seguir a este usuario')
      return true
    } catch (err: any) {
      console.error('Error unfollowing user:', err)
      toast.error('Error al dejar de seguir')
      return false
    }
  }

  /**
   * Toggle follow/unfollow
   */
  const toggleFollow = async (targetUserId: string) => {
    if (stats.isFollowing) {
      return await unfollowUser(targetUserId)
    } else {
      return await followUser(targetUserId)
    }
  }

  return {
    followers: stats.followers,
    following: stats.following,
    isFollowing: stats.isFollowing,
    loading,
    followUser,
    unfollowUser,
    toggleFollow,
    refresh: fetchFollowStats
  }
}
