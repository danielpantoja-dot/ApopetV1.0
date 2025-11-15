import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/client'
import { UserProfile, Pet } from '../lib/types'
import { toast } from 'sonner@2.0.3'

interface ProfileData {
  profile: UserProfile | null
  pet: Pet | null
}

export const useProfile = (userId?: string) => {
  const [profileData, setProfileData] = useState<ProfileData>({ profile: null, pet: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (id?: string) => {
    if (!id && !userId) {
      setLoading(false)
      return
    }

    const targetId = id || userId

    try {
      setLoading(true)

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()

      if (profileError) throw profileError

      // Fetch user's pet
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', targetId)
        .single()

      // Pet might not exist yet, so we don't throw error
      
      setProfileData({
        profile: profileData as UserProfile,
        pet: petData as Pet || null
      })
      setError(null)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.message)
      // Don't show toast for profile not found
      if (!err.message.includes('not found')) {
        toast.error('Error al cargar el perfil')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchProfile(userId)
    } else {
      setLoading(false)
    }
  }, [userId])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      setProfileData(prev => ({
        ...prev,
        profile: data as UserProfile
      }))

      toast.success('Perfil actualizado')
      return data
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast.error('Error al actualizar el perfil')
      throw err
    }
  }

  const updatePet = async (petUpdates: Partial<Pet>) => {
    if (!userId) return

    try {
      // Check if pet exists
      const { data: existingPet } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', userId)
        .single()

      let data
      if (existingPet) {
        // Update existing pet
        const { data: updatedPet, error } = await supabase
          .from('pets')
          .update(petUpdates)
          .eq('id', existingPet.id)
          .select()
          .single()

        if (error) throw error
        data = updatedPet
      } else {
        // Create new pet
        const { data: newPet, error } = await supabase
          .from('pets')
          .insert([{ ...petUpdates, owner_id: userId }])
          .select()
          .single()

        if (error) throw error
        data = newPet
      }

      setProfileData(prev => ({
        ...prev,
        pet: data as Pet
      }))

      toast.success('Perfil de mascota actualizado')
      return data
    } catch (err: any) {
      console.error('Error updating pet:', err)
      toast.error('Error al actualizar el perfil de la mascota')
      throw err
    }
  }

  const createPet = async (petData: Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('pets')
        .insert([{ ...petData, owner_id: userId }])
        .select()
        .single()

      if (error) throw error

      setProfileData(prev => ({
        ...prev,
        pet: data as Pet
      }))

      toast.success('Perfil de mascota creado')
      return data
    } catch (err: any) {
      console.error('Error creating pet:', err)
      toast.error('Error al crear el perfil de la mascota')
      throw err
    }
  }

  return {
    profile: profileData.profile,
    pet: profileData.pet,
    loading,
    error,
    updateProfile,
    updatePet,
    createPet,
    refreshProfile: fetchProfile
  }
}
