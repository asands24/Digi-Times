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
  // Calendar,
  Camera,
  UserPlus,
  Copy,
  ExternalLink
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import TemplatesShowcase from '../components/TemplatesShowcase'
import TemplateGuide from '../components/TemplateGuide'
import { getRandomPhotos } from '../data/stockPhotos'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const { user, profile, signOut } = useAuth()
  const { groups, loading: groupsLoading, createGroup } = useGroups()
  const { joinGroupWithInvite } = useInvite()
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showTemplateGuide, setShowTemplateGuide] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  // Get sample photos for visual interest
  const samplePhotos = getRandomPhotos(3)

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

  const handleSelectTemplate = (template) => {
    setGroupName(template.name)
    setGroupDescription(template.description)
    setShowCreateGroup(true)
    toast.success(`Template "${template.name}" loaded! Feel free to customize.`)
  }

  if (groupsLoading) {
    return <LoadingSpinner message="Loading your groups..." />
  }

  return (
    <div className="min-h-screen page-transition" style={{ backgroundColor: 'var(--paper-cream)' }}>
      {/* Newspaper Masthead Header */}
      <header style={{
        backgroundColor: 'var(--paper-white)',
        borderBottom: '4px double var(--ink-black)',
        boxShadow: '0 2px 0 rgba(0,0,0,0.1)'
      }}>
        <div className="container mx-auto py-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-gray)' }}>
            <div style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em'
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-3">
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
                letterSpacing: '0.05em'
              }}>
                {profile?.display_name || user?.email}
              </span>
              <button
                style={{ color: 'var(--ink-gray)' }}
                className="hover:opacity-70 transition-opacity"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleSignOut}
                style={{ color: 'var(--ink-gray)' }}
                className="hover:opacity-70 transition-opacity"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Masthead */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Camera style={{ width: '2rem', height: '2rem', color: 'var(--accent-gold)' }} />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 'clamp(2rem, 8vw, 3.5rem)',
              fontWeight: 900,
              color: 'var(--ink-black)',
              letterSpacing: '0.02em',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              lineHeight: 1
            }}>
              DigiTimes
            </h1>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.15em',
              fontStyle: 'italic',
              borderTop: '1px solid var(--border-gray)',
              borderBottom: '1px solid var(--border-gray)',
              padding: '0.5rem 0',
              marginTop: '1rem'
            }}>
              "Your Family Stories, Beautifully Preserved"
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
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
          <button
            onClick={() => setShowTemplateGuide(true)}
            className="btn"
            style={{
              border: '2px solid var(--accent-gold)',
              backgroundColor: 'var(--paper-cream)',
              color: 'var(--ink-black)'
            }}
          >
            <Users className="w-4 h-4" />
            Find Template
          </button>
        </div>

        {/* Sample Photos Banner for New Users */}
        {groups.length === 0 && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--paper-white)',
            border: '2px solid var(--border-gray)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <h3 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--ink-black)',
                marginBottom: '0.5rem'
              }}>
                Not sure where to start?
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
              }}>
                Try our template wizard to find the perfect group setup for your needs!
              </p>
              <button
                onClick={() => setShowTemplateGuide(true)}
                className="btn btn-sm"
                style={{
                  border: '2px solid var(--accent-gold)',
                  backgroundColor: 'var(--accent-gold)',
                  color: 'var(--ink-black)'
                }}
              >
                Get Started →
              </button>
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {samplePhotos.map((photo) => (
                <div key={photo.id} style={{
                  width: '100px',
                  height: '100px',
                  border: '2px solid var(--ink-black)',
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  borderRadius: '4px'
                }}>
                  <img
                    src={photo.thumbnail}
                    alt={photo.alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Templates prominently when no groups */}
        {groups.length === 0 && (
          <>
            <div style={{
              textAlign: 'center',
              marginBottom: '3rem',
              padding: '2rem 1rem',
              backgroundColor: 'var(--paper-white)',
              border: '3px double var(--ink-black)',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
            }}>
              <Users style={{ width: '3rem', height: '3rem', color: 'var(--accent-gold)' }} className="mx-auto mb-3" />
              <h3 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--ink-black)',
                marginBottom: '0.5rem'
              }}>
                Welcome to DigiTimes!
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Start by creating your first group or browse our template gallery for inspiration
              </p>
            </div>
            <TemplatesShowcase onSelectTemplate={handleSelectTemplate} />
          </>
        )}

        {/* Show Templates as collapsible section when user has groups */}
        {groups.length > 0 && (
          <details style={{ marginBottom: '2rem' }}>
            <summary style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--ink-black)',
              cursor: 'pointer',
              padding: '1rem',
              backgroundColor: 'var(--paper-white)',
              border: '2px solid var(--ink-black)',
              listStyle: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}>
              <span style={{ color: 'var(--accent-gold)' }}>▶</span>
              Browse Template Gallery for New Ideas
            </summary>
            <div style={{ marginTop: '2rem' }}>
              <TemplatesShowcase onSelectTemplate={handleSelectTemplate} />
            </div>
          </details>
        )}

        {/* Groups Section Header */}
        {groups.length > 0 && (
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--ink-black)',
            textTransform: 'uppercase',
            borderBottom: '3px double var(--ink-black)',
            paddingBottom: '0.5rem',
            marginBottom: '1.5rem',
            letterSpacing: '0.05em'
          }}>
            Your Groups
          </h2>
        )}

        {/* Groups Grid */}
        {groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => {
              // Get a random photo for this group's visual
              const groupPhoto = samplePhotos[index % samplePhotos.length]

              return (
                <div
                  key={group.id}
                  className={`card hover-lift gesture-smooth animate-slide-up animate-delay-${Math.min(index, 3)}`}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Group Photo Header */}
                  <div style={{
                    width: '100%',
                    height: '120px',
                    marginBottom: '1rem',
                    overflow: 'hidden',
                    border: '2px solid var(--border-gray)',
                    borderRadius: '4px',
                    position: 'relative'
                  }}>
                    <img
                      src={groupPhoto.thumbnail}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.7)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.3)'
                    }}>
                      <Users style={{
                        width: '3rem',
                        height: '3rem',
                        color: 'white',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                      }} />
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-3">
                  <h3 style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--ink-black)'
                  }}>
                    {group.name}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '2px solid var(--ink-black)',
                    backgroundColor: group.memberRole === 'admin' ? 'var(--accent-gold)' : 'var(--paper-cream)',
                    color: group.memberRole === 'admin' ? 'var(--ink-black)' : 'var(--text-secondary)'
                  }}>
                    {group.memberRole}
                  </span>
                </div>

                {group.description && (
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    fontStyle: 'italic'
                  }}>
                    {group.description}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: 'var(--paper-cream)',
                  border: '1px solid var(--border-gray)',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.1em'
                  }}>
                    CODE: {group.invite_code}
                  </span>
                  <button
                    onClick={() => copyInviteCode(group.invite_code)}
                    style={{ color: 'var(--ink-black)' }}
                    className="hover:opacity-70 transition-opacity"
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
            )
            })}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
            <div className="bg-white max-w-md w-full p-6 modal-content">
              <h2 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--ink-black)',
                textTransform: 'uppercase',
                borderBottom: '3px double var(--ink-black)',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
                letterSpacing: '0.05em'
              }}>
                Create New Group
              </h2>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
            <div className="bg-white max-w-md w-full p-6 modal-content">
              <h2 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--ink-black)',
                textTransform: 'uppercase',
                borderBottom: '3px double var(--ink-black)',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
                letterSpacing: '0.05em'
              }}>
                Join Group
              </h2>
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

        {/* Template Guide Modal */}
        {showTemplateGuide && (
          <TemplateGuide
            onSelectTemplate={(template) => {
              handleSelectTemplate(template)
              setShowTemplateGuide(false)
            }}
            onClose={() => setShowTemplateGuide(false)}
          />
        )}
      </main>
    </div>
  )
}

export default DashboardPage