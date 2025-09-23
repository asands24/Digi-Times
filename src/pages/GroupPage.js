import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNewsletters } from '../hooks/useNewsletters'
import { useGroups } from '../hooks/useGroups'
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Users,
  Copy,
  Settings,
  ExternalLink
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const GroupPage = () => {
  const { groupId } = useParams()
  const { groups } = useGroups()
  const { newsletters, loading, createNewsletter } = useNewsletters(groupId)
  const [showCreateNewsletter, setShowCreateNewsletter] = useState(false)
  const [newsletterTitle, setNewsletterTitle] = useState('')
  const [newsletterDescription, setNewsletterDescription] = useState('')
  const [selectedLayout, setSelectedLayout] = useState('grid')

  const group = groups.find(g => g.id === groupId)

  const handleCreateNewsletter = async (e) => {
    e.preventDefault()
    if (!newsletterTitle.trim()) return

    const { error } = await createNewsletter({
      title: newsletterTitle,
      description: newsletterDescription,
      layout: selectedLayout
    })

    if (!error) {
      setNewsletterTitle('')
      setNewsletterDescription('')
      setSelectedLayout('grid')
      setShowCreateNewsletter(false)
    }
  }

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code)
      toast.success('Invite code copied to clipboard!')
    }
  }

  const layoutOptions = [
    { value: 'grid', label: 'Grid Layout' },
    { value: 'timeline', label: 'Timeline' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'polaroid', label: 'Polaroid' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'scrapbook', label: 'Scrapbook' }
  ]

  if (loading || !group) {
    return <LoadingSpinner message="Loading group..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-sm text-gray-600">{group.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Invite: {group.invite_code}</span>
                <button
                  onClick={copyInviteCode}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {group.memberRole === 'admin' && (
                <button className="text-gray-600 hover:text-gray-900">
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCreateNewsletter(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Newsletter
          </button>
        </div>

        {/* Newsletters Grid */}
        {newsletters.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No newsletters yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first newsletter to start collecting and sharing photos.
            </p>
            <button
              onClick={() => setShowCreateNewsletter(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Your First Newsletter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{newsletter.title}</h3>
                  <div className="flex gap-1">
                    {newsletter.is_published && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Published
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {newsletter.layout}
                    </span>
                  </div>
                </div>

                {newsletter.description && (
                  <p className="text-gray-600 text-sm mb-4">{newsletter.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      Created by {newsletter.profiles?.display_name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(newsletter.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {newsletter.newsletter_collaborators && newsletter.newsletter_collaborators.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {newsletter.newsletter_collaborators.length} collaborator
                        {newsletter.newsletter_collaborators.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/newsletter/${newsletter.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Edit Newsletter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Newsletter Modal */}
        {showCreateNewsletter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Create New Newsletter</h2>
              <form onSubmit={handleCreateNewsletter} className="space-y-4">
                <div>
                  <label className="label">Newsletter Title</label>
                  <input
                    type="text"
                    value={newsletterTitle}
                    onChange={(e) => setNewsletterTitle(e.target.value)}
                    placeholder="Enter newsletter title"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea
                    value={newsletterDescription}
                    onChange={(e) => setNewsletterDescription(e.target.value)}
                    placeholder="What's this newsletter about?"
                    className="input"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="label">Layout Style</label>
                  <select
                    value={selectedLayout}
                    onChange={(e) => setSelectedLayout(e.target.value)}
                    className="input"
                  >
                    {layoutOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Create Newsletter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateNewsletter(false)}
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

export default GroupPage