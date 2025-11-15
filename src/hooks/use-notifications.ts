// hooks/use-notifications.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

export interface NotificationData {
  id: string
  user_id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  content: string
  read: boolean
  sender_id: string | null
  post_id: string | null
  created_at: string
  sender?: {
    id: string
    name: string
    avatar_url: string | null
  }
  post?: {
    id: string
    content: string
  }
}

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(id, name, avatar_url),
          post:posts(id, content)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      const notificationsData = (data || []).map(notification => ({
        ...notification,
        sender: Array.isArray(notification.sender) 
          ? notification.sender[0] 
          : notification.sender,
        post: Array.isArray(notification.post)
          ? notification.post[0]
          : notification.post
      }))

      setNotifications(notificationsData as NotificationData[])
      
      // Contar no leídas
      const unread = notificationsData.filter(n => !n.read).length
      setUnreadCount(unread)

    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      setError(err.message)
      toast.error('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchNotifications()

    // Suscripción en tiempo real a nuevas notificaciones
    if (userId) {
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            // Obtener datos completos de la nueva notificación
            const { data: newNotification } = await supabase
              .from('notifications')
              .select(`
                *,
                sender:profiles!notifications_sender_id_fkey(id, name, avatar_url),
                post:posts(id, content)
              `)
              .eq('id', payload.new.id)
              .single()

            if (newNotification) {
              const formattedNotification = {
                ...newNotification,
                sender: Array.isArray(newNotification.sender)
                  ? newNotification.sender[0]
                  : newNotification.sender,
                post: Array.isArray(newNotification.post)
                  ? newNotification.post[0]
                  : newNotification.post
              }

              setNotifications(prev => [formattedNotification as NotificationData, ...prev])
              setUnreadCount(prev => prev + 1)
              
              // Mostrar toast con la nueva notificación
              toast.info(`Nueva notificación: ${newNotification.content}`)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchNotifications, userId])

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      toast.error('Error al marcar como leída')
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (err: any) {
      console.error('Error marking all as read:', err)
      toast.error('Error al marcar todas como leídas')
    }
  }

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notificación eliminada')
    } catch (err: any) {
      console.error('Error deleting notification:', err)
      toast.error('Error al eliminar notificación')
    }
  }

  // Crear notificación (helper para uso interno de la app)
  const createNotification = async (data: {
    user_id: string
    type: 'like' | 'comment' | 'follow' | 'mention'
    content: string
    sender_id?: string
    post_id?: string
  }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([data])

      if (error) throw error
    } catch (err: any) {
      console.error('Error creating notification:', err)
      // No mostrar toast aquí porque es una operación de fondo
    }
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications: fetchNotifications
  }
}
