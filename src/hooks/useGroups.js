import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useGroups = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchGroups = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          joined_at,
          friend_groups (
            id,
            name,
            description,
            invite_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching groups:', error)
        toast.error('Failed to load groups')
        return
      }

      const formattedGroups = data.map(item => ({
        ...item.friend_groups,
        memberRole: item.role,
        joinedAt: item.joined_at
      }))

      setGroups(formattedGroups)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async (groupData) => {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      setLoading(true)

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .insert({
          ...groupData,
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single()

      if (groupError) {
        toast.error('Failed to create group')
        return { error: groupError }
      }

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memberError) {
        toast.error('Failed to add you as admin')
        return { error: memberError }
      }

      toast.success('Group created successfully!')
      await fetchGroups()
      return { data: group, error: null }
    } catch (error) {
      toast.error('Failed to create group')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateGroup = async (groupId, updates) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('friend_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update group')
        return { error }
      }

      toast.success('Group updated successfully!')
      await fetchGroups()
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to update group')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const deleteGroup = async (groupId) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', groupId)

      if (error) {
        toast.error('Failed to delete group')
        return { error }
      }

      toast.success('Group deleted successfully!')
      await fetchGroups()
      return { error: null }
    } catch (error) {
      toast.error('Failed to delete group')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const leaveGroup = async (groupId) => {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      if (error) {
        toast.error('Failed to leave group')
        return { error }
      }

      toast.success('Left group successfully!')
      await fetchGroups()
      return { error: null }
    } catch (error) {
      toast.error('Failed to leave group')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [user])

  return {
    groups,
    loading,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    leaveGroup
  }
}