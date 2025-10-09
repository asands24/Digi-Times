import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useNewsletters = (groupId) => {
  const { user } = useAuth()
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNewsletters = async () => {
    if (!groupId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('newsletters')
        .select(`
          *,
          profiles!newsletters_created_by_fkey (
            display_name,
            avatar_url
          ),
          newsletter_collaborators (
            user_id,
            role,
            profiles (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching newsletters:', error)
        toast.error('Failed to load newsletters')
        return
      }

      setNewsletters(data)
    } catch (error) {
      console.error('Error fetching newsletters:', error)
      toast.error('Failed to load newsletters')
    } finally {
      setLoading(false)
    }
  }

  const createNewsletter = async (newsletterData) => {
    if (!user || !groupId) return { error: new Error('Missing required data') }

    try {
      setLoading(true)

      const { data: newsletter, error: newsletterError } = await supabase
        .from('newsletters')
        .insert({
          ...newsletterData,
          group_id: groupId,
          created_by: user.id
        })
        .select()
        .single()

      if (newsletterError) {
        toast.error('Failed to create newsletter')
        return { error: newsletterError }
      }

      const { error: collaboratorError } = await supabase
        .from('newsletter_collaborators')
        .insert({
          newsletter_id: newsletter.id,
          user_id: user.id,
          role: 'owner'
        })

      if (collaboratorError) {
        console.error('Failed to add creator as collaborator:', collaboratorError)
      }

      toast.success('Newsletter created successfully!')
      await fetchNewsletters()
      return { data: newsletter, error: null }
    } catch (error) {
      toast.error('Failed to create newsletter')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateNewsletter = async (newsletterId, updates) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('newsletters')
        .update(updates)
        .eq('id', newsletterId)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update newsletter')
        return { error }
      }

      toast.success('Newsletter updated successfully!')
      await fetchNewsletters()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to update newsletter')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const publishNewsletter = async (newsletterId) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('newsletters')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', newsletterId)
        .select()
        .single()

      if (error) {
        toast.error('Failed to publish newsletter')
        return { error }
      }

      toast.success('Newsletter published successfully!')
      await fetchNewsletters()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to publish newsletter')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const deleteNewsletter = async (newsletterId) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', newsletterId)

      if (error) {
        toast.error('Failed to delete newsletter')
        return { error }
      }

      toast.success('Newsletter deleted successfully!')
      await fetchNewsletters()
      return { error: null }
    } catch (error) {
      toast.error('Failed to delete newsletter')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const addCollaborator = async (newsletterId, userId, role = 'collaborator') => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('newsletter_collaborators')
        .insert({
          newsletter_id: newsletterId,
          user_id: userId,
          role
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to add collaborator')
        return { error }
      }

      toast.success('Collaborator added successfully!')
      await fetchNewsletters()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to add collaborator')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsletters()
  }, [fetchNewsletters, groupId])

  return {
    newsletters,
    loading,
    fetchNewsletters,
    createNewsletter,
    updateNewsletter,
    publishNewsletter,
    deleteNewsletter,
    addCollaborator
  }
}