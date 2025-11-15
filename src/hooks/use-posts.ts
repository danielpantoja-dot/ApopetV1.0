// hooks/use-posts.ts - VERSION MEJORADA
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase/client'
import { Post, PostWithDetails, Comment } from '../lib/types'
import { toast } from 'sonner@2.0.3'

export const usePosts = (userId?: string) => {
  const [posts, setPosts] = useState<PostWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función optimizada para fetch de posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch posts con author y pet information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, name, avatar_url),
          pet:pets(name, species)
        `)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch likes y comments counts para cada post
      const postsWithDetails = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          // Check if current user liked this post
          let isLiked = false
          if (userId) {
            const { data: userLike } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', userId)
              .single()
            
            isLiked = !!userLike
          }

          // Get comments con información del autor
          const { data: commentsData } = await supabase
            .from('comments')
            .select(`
              *,
              author:profiles(id, name, avatar_url)
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: true })

          return {
            ...post,
            likes_count: likesCount || 0,
            is_liked: isLiked,
            comments: commentsData || []
          }
        })
      )

      setPosts(postsWithDetails as PostWithDetails[])
    } catch (err: any) {
      console.error('Error fetching posts:', err)
      setError(err.message)
      toast.error('Error al cargar las publicaciones')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Crear post
  const createPost = async (postData: Partial<Post>) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, name, avatar_url),
          pet:pets(name, species)
        `)
        .single()

      if (error) throw error

      // Add to local state
      const newPost: PostWithDetails = {
        ...data,
        likes_count: 0,
        is_liked: false,
        comments: []
      }

      setPosts(prev => [newPost, ...prev])
      toast.success('Publicación creada exitosamente')
      
      return newPost
    } catch (err: any) {
      console.error('Error creating post:', err)
      toast.error('Error al crear la publicación')
      throw err
    }
  }

  // Toggle like
  const toggleLike = async (postId: string) => {
    if (!userId) {
      toast.error('Debes iniciar sesión para dar like')
      return
    }

    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      if (post.is_liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        if (error) throw error

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ))
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: userId }])

        if (error) throw error

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ))
      }
    } catch (err: any) {
      console.error('Error toggling like:', err)
      toast.error('Error al procesar el like')
    }
  }

  // Agregar comentario
  const addComment = async (postId: string, content: string) => {
    if (!userId) {
      toast.error('Debes iniciar sesión para comentar')
      return
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            author_id: userId,
            content: content.trim()
          }
        ])
        .select(`
          *,
          author:profiles(id, name, avatar_url)
        `)
        .single()

      if (error) throw error

      // Add comment to local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments: [...p.comments, data as Comment] }
          : p
      ))

      toast.success('Comentario agregado')
    } catch (err: any) {
      console.error('Error adding comment:', err)
      toast.error('Error al agregar el comentario')
    }
  }

  // 🆕 FUNCIÓN PARA BORRAR COMENTARIO
  const deleteComment = async (commentId: string, postId: string) => {
    if (!userId) {
      toast.error('Debes iniciar sesión para eliminar comentarios')
      return
    }

    try {
      // Verificar que el comentario pertenece al usuario
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', commentId)
        .single()

      if (fetchError) throw fetchError

      if (comment.author_id !== userId) {
        toast.error('No puedes eliminar comentarios de otros usuarios')
        return
      }

      // Eliminar comentario
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // Actualizar estado local
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              comments: p.comments.filter(c => c.id !== commentId) 
            }
          : p
      ))

      toast.success('Comentario eliminado')
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      toast.error('Error al eliminar el comentario')
    }
  }

  // Borrar post (MEJORADA con verificación de autor)
  const deletePost = async (postId: string) => {
    try {
      // Verificar que el post pertenece al usuario
      const post = posts.find(p => p.id === postId)
      if (!post) {
        toast.error('Publicación no encontrada')
        return
      }

      if (post.author_id !== userId) {
        toast.error('No puedes eliminar publicaciones de otros usuarios')
        return
      }

      // Eliminar post de la base de datos
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      // Eliminar de estado local
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Publicación eliminada')
    } catch (err: any) {
      console.error('Error deleting post:', err)
      toast.error('Error al eliminar la publicación')
    }
  }

  return {
    posts,
    loading,
    error,
    createPost,
    toggleLike,
    addComment,
    deleteComment, // 🆕 Nueva función
    deletePost,
    refreshPosts: fetchPosts
  }
}