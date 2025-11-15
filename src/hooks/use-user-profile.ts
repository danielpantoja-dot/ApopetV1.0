/**
 * useUserProfile Hook
 * 
 * Hook personalizado para cargar el perfil completo de un usuario
 * incluyendo sus mascotas, posts y estadísticas
 * 
 * @hook
 */

import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/client'
import { UserProfile, Pet, Post } from '../lib/types'
import { toast } from 'sonner@2.0.3'

interface UserProfileData {
  profile: UserProfile | null
  pets: Pet[]
  posts: Post[]
  postsCount: number
}

export const useUserProfile = (userId: string) => {
  const [data, setData] = useState<UserProfileData>({
    profile: null,
    pets: [],
    posts: [],
    postsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carga todos los datos del perfil de usuario
   */
  const fetchUserProfile = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Cargar perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // 2. Cargar mascotas del usuario
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (petsError && petsError.code !== 'PGRST116') {
        // PGRST116 = no rows found, que es aceptable
        throw petsError
      }

      // 3. Cargar posts del usuario
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })

      if (postsError && postsError.code !== 'PGRST116') {
        throw postsError
      }

      // 4. Contar total de posts
      const { count: postsCount, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)

      if (countError) {
        console.error('Error counting posts:', countError)
      }

      setData({
        profile: profileData as UserProfile,
        pets: (petsData || []) as Pet[],
        posts: (postsData || []) as Post[],
        postsCount: postsCount || 0
      })

    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      setError(err.message)
      toast.error('Error al cargar el perfil del usuario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  /**
   * Obtener estadísticas de likes de todos los posts del usuario
   */
  const getTotalLikes = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('likes')
        .eq('author_id', userId)

      if (error) throw error

      const totalLikes = data?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0
      return totalLikes
    } catch (err) {
      console.error('Error getting total likes:', err)
      return 0
    }
  }

  /**
   * Cargar posts con información completa (autor, comentarios, likes)
   */
  const fetchPostsWithDetails = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, name, avatar_url),
          pet:pets(id, name, image_url, species),
          comments(
            id,
            content,
            created_at,
            author:profiles!comments_author_id_fkey(id, name, avatar_url)
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return postsData || []
    } catch (err) {
      console.error('Error fetching posts with details:', err)
      return []
    }
  }

  return {
    profile: data.profile,
    pets: data.pets,
    posts: data.posts,
    postsCount: data.postsCount,
    loading,
    error,
    refresh: fetchUserProfile,
    getTotalLikes,
    fetchPostsWithDetails
  }
}
