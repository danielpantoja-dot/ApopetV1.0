import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner@2.0.3'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event)
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          console.log('✅ Usuario autenticado:', currentSession?.user?.id)
          
          // Verificar si hay una ruta guardada para redirección
          const redirectPath = sessionStorage.getItem('auth_redirect_path')
          if (redirectPath && redirectPath !== '/' && redirectPath.startsWith('/pet/')) {
            // Si estamos en un perfil QR, NO redirigir - permanecer en la página
            console.log('📍 Manteniendo usuario en perfil QR:', redirectPath)
            // La página ya está mostrando el perfil, solo actualizar el estado
          } else {
            // Limpiar el redirect path si ya no es necesario
            sessionStorage.removeItem('auth_redirect_path')
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario desconectado')
          // Limpiar cualquier dato de redirección
          sessionStorage.removeItem('auth_redirect_path')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
    } catch (error: any) {
      console.error('Error signing out:', error)
      toast.error('Error al cerrar sesión')
      throw error
    }
  }

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  }
}