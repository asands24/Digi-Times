import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useInvite = () => {
  const [loading, setLoading] = useState(false)

  const joinGroupWithInvite = async (inviteCode, userId) => {
    try {
      setLoading(true)

      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (groupError) {
        toast.error('Invalid invite code')
        return { error: groupError }
      }

      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        toast.error('You are already a member of this group')
        return { error: new Error('Already a member') }
      }

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member'
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to join group')
        return { error }
      }

      toast.success(`Joined ${group.name}!`)
      return { data: { ...data, group }, error: null }
    } catch (error) {
      toast.error('Failed to join group')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  return {
    loading,
    joinGroupWithInvite,
    generateInviteCode
  }
}