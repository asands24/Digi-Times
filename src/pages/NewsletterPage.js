import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import { useNewsletters } from '../hooks/useNewsletters'
import { usePhotos } from '../hooks/usePhotos'
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Users,
  Camera,
  Edit,
  Trash2,
  Eye,
  Send,
  Settings
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import PhotoUpload from '../components/PhotoUpload'
import NewsletterPreview from '../components/NewsletterPreview'
import { format } from 'date-fns'

const NewsletterPage = () => {
  const { newsletterId } = useParams()
  const { newsletters, updateNewsletter, publishNewsletter } = useNewsletters()
  const { events, loading: eventsLoading, createEvent, toggleAttendance } = useEvents(newsletterId)
  const { getPhotoUrl } = usePhotos()

  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  // Event form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventCategory, setEventCategory] = useState('social')

  const newsletter = newsletters.find(n => n.id === newsletterId)

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!eventTitle.trim()) return

    const { error } = await createEvent({
      title: eventTitle,
      description: eventDescription,
      event_date: eventDate || null,
      location: eventLocation,
      category: eventCategory
    })

    if (!error) {
      setEventTitle('')
      setEventDescription('')
      setEventDate('')
      setEventLocation('')
      setEventCategory('social')
      setShowCreateEvent(false)
    }
  }

  const handleLayoutChange = async (newLayout) => {
    if (!newsletter) return

    await updateNewsletter(newsletter.id, { layout: newLayout })
  }

  const handlePublish = async () => {
    if (!newsletter) return

    if (window.confirm('Are you sure you want to publish this newsletter? This action cannot be undone.')) {
      await publishNewsletter(newsletter.id)
    }
  }

  const categoryOptions = [
    { value: 'social', label: 'Social' },
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' }
  ]

  const layoutOptions = [
    { value: 'grid', label: 'Grid Layout' },
    { value: 'timeline', label: 'Timeline' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'polaroid', label: 'Polaroid' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'scrapbook', label: 'Scrapbook' }
  ]

  if (eventsLoading || !newsletter) {
    return <LoadingSpinner message="Loading newsletter..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to={`/group/${newsletter.group_id}`} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {newsletter.title}
                </h1>
                {newsletter.description && (
                  <p className="text-sm text-gray-600">{newsletter.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="layout-select" className="text-sm text-gray-600">
                  Layout:
                </label>
                <select
                  id="layout-select"
                  value={newsletter.layout}
                  onChange={(e) => handleLayoutChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {layoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowPreview(true)}
                className="btn btn-secondary btn-sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>

              {!newsletter.is_published && (
                <button
                  onClick={handlePublish}
                  className="btn btn-primary btn-sm"
                >
                  <Send className="w-4 h-4" />
                  Publish
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
            onClick={() => setShowCreateEvent(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No events yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first event to start collecting photos for this newsletter.
            </p>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {event.event_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.event_attendees?.length || 0} attending</span>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {event.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAttendance(event.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Users className="w-4 h-4" />
                      {event.event_attendees?.some(a => a.user_id === newsletter.created_by) ? 'Leave' : 'Join'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowPhotoUpload(true)
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Add Photos
                    </button>
                  </div>
                </div>

                {/* Photos Grid */}
                {event.photos && event.photos.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Photos ({event.photos.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {event.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                        >
                          <img
                            src={getPhotoUrl(photo.file_path)}
                            alt={photo.caption || photo.file_name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="label">Event Title</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="What happened at this event?"
                    className="input"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="label">Date (Optional)</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Location (Optional)</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Where did this happen?"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="input"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateEvent(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Photo Upload Modal */}
        {showPhotoUpload && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Add Photos to {selectedEvent.title}
                </h2>
                <button
                  onClick={() => {
                    setShowPhotoUpload(false)
                    setSelectedEvent(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <PhotoUpload
                eventId={selectedEvent.id}
                onUploadComplete={() => {
                  setShowPhotoUpload(false)
                  setSelectedEvent(null)
                  // Refresh events to show new photos
                  window.location.reload()
                }}
              />
            </div>
          </div>
        )}

        {/* Newsletter Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Newsletter Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <NewsletterPreview
                  newsletter={newsletter}
                  events={events}
                  getPhotoUrl={getPhotoUrl}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default NewsletterPage