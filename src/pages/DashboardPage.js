import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGroups } from '../hooks/useGroups'
import { useInvite } from '../hooks/useInvite'
import {
  Users,
  Plus,
  LogOut,
  Settings,
  Calendar,
  Camera,
  UserPlus,
  Copy,
  ExternalLink
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const { user, profile, signOut } = useAuth()
  const { groups, loading: groupsLoading, createGroup } = useGroups()
  const { joinGroupWithInvite, generateInviteCode } = useInvite()
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) return

    const { error } = await createGroup({
      name: groupName,
      description: groupDescription
    })

    if (!error) {
      setGroupName('')
      setGroupDescription('')
      setShowCreateGroup(false)
    }
  }

  const handleJoinGroup = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim() || !user) return

    const { error } = await joinGroupWithInvite(inviteCode, user.id)

    if (!error) {
      setInviteCode('')
      setShowJoinGroup(false)
    }
  }

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Invite code copied to clipboard!')
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (groupsLoading) {
    return <LoadingSpinner message="Loading your groups..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Photo Newsletter
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile?.display_name || user?.email}
              </span>
              <button className="text-gray-600 hover:text-gray-900">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
          <button
            onClick={() => setShowJoinGroup(true)}
            className="btn btn-secondary"
          >
            <UserPlus className="w-4 h-4" />
            Join Group
          </button>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No groups yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first group or join an existing one to start sharing photos.
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    group.memberRole === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.memberRole}
                  </span>
                </div>

                {group.description && (
                  <p className="text-gray-600 text-sm mb-4">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Invite code: {group.invite_code}</span>
                  <button
                    onClick={() => copyInviteCode(group.invite_code)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/group/${group.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Group
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="label">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What's this group about?"
                    className="input"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Create Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Join Group</h2>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="label">Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    className="input uppercase"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Join Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJoinGroup(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage