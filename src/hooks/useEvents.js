import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useEvents = (newsletterId) => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    if (!newsletterId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_created_by_fkey (
            display_name,
            avatar_url
          ),
          event_attendees (
            user_id,
            profiles (
              display_name,
              avatar_url
            )
          ),
          photos (
            id,
            file_path,
            file_name,
            caption,
            uploaded_by,
            created_at
          )
        `)
        .eq('newsletter_id', newsletterId)
        .order('event_date', { ascending: false })

      if (error) {
        console.error('Error fetching events:', error)
        toast.error('Failed to load events')
        return
      }

      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [newsletterId])

  const createEvent = async (eventData) => {
    if (!user || !newsletterId) return { error: new Error('Missing required data') }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          newsletter_id: newsletterId,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create event')
        return { error }
      }

      toast.success('Event created successfully!')
      await fetchEvents()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to create event')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateEvent = async (eventId, updates) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update event')
        return { error }
      }

      toast.success('Event updated successfully!')
      await fetchEvents()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to update event')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        toast.error('Failed to delete event')
        return { error }
      }

      toast.success('Event deleted successfully!')
      await fetchEvents()
      return { error: null }
    } catch (error) {
      toast.error('Failed to delete event')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const addAttendee = async (eventId, userId) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already attending this event')
        } else {
          toast.error('Failed to add attendee')
        }
        return { error }
      }

      toast.success('Attendee added successfully!')
      await fetchEvents()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to add attendee')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const removeAttendee = async (eventId, userId) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (error) {
        toast.error('Failed to remove attendee')
        return { error }
      }

      toast.success('Attendee removed successfully!')
      await fetchEvents()
      return { error: null }
    } catch (error) {
      toast.error('Failed to remove attendee')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const toggleAttendance = async (eventId) => {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      const event = events.find(e => e.id === eventId)
      if (!event) return { error: new Error('Event not found') }

      const isAttending = event.event_attendees.some(a => a.user_id === user.id)

      if (isAttending) {
        return await removeAttendee(eventId, user.id)
      } else {
        return await addAttendee(eventId, user.id)
      }
    } catch (error) {
      toast.error('Failed to toggle attendance')
      return { error }
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    addAttendee,
    removeAttendee,
    toggleAttendance
  }
}