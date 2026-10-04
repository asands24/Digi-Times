import { format } from 'date-fns'
import { Calendar, MapPin, Users } from 'lucide-react'

const NewsletterPreview = ({ newsletter, events, getPhotoUrl }) => {
  const renderGridLayout = () => (
    <div className="space-y-8">
      {events.map((event) => (
        <div key={event.id} className="border rounded-lg p-6 bg-white">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-gray-600 mb-3">{event.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {event.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(event.event_date), 'MMMM d, yyyy')}</span>
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
                <span>{event.event_attendees?.length || 0} attendees</span>
              </div>
            </div>
          </div>

          {event.photos && event.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {event.photos.map((photo) => (
                <div key={photo.id} className="aspect-square">
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.caption || photo.file_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {photo.caption && (
                    <p className="text-sm text-gray-600 mt-2">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderTimelineLayout = () => (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
      <div className="space-y-8">
        {events
          .sort((a, b) => new Date(a.event_date || a.created_at) - new Date(b.event_date || b.created_at))
          .map((event, index) => (
            <div key={event.id} className="relative flex gap-6">
              <div className="flex-shrink-0 w-16 flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow"></div>
                {event.event_date && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    {format(new Date(event.event_date), 'MMM d')}
                  </div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-gray-600 mb-4">{event.description}</p>
                )}

                {event.photos && event.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {event.photos.slice(0, 6).map((photo) => (
                      <div key={photo.id} className="aspect-square">
                        <img
                          src={getPhotoUrl(photo.file_path)}
                          alt={photo.caption || photo.file_name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    ))}
                    {event.photos.length > 6 && (
                      <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          +{event.photos.length - 6} more
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  const renderMagazineLayout = () => (
    <div className="space-y-12">
      {events.map((event, eventIndex) => (
        <div key={event.id} className="page-break">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {event.title}
            </h3>
            {event.event_date && (
              <p className="text-gray-600 text-lg">
                {format(new Date(event.event_date), 'MMMM d, yyyy')}
              </p>
            )}
            {event.location && (
              <p className="text-gray-500">{event.location}</p>
            )}
          </div>

          {event.description && (
            <div className="max-w-3xl mx-auto mb-8">
              <p className="text-gray-700 text-lg leading-relaxed text-center">
                {event.description}
              </p>
            </div>
          )}

          {event.photos && event.photos.length > 0 && (
            <div className="space-y-6">
              {eventIndex % 2 === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.photos.map((photo, photoIndex) => (
                    <div
                      key={photo.id}
                      className={photoIndex === 0 ? "md:col-span-2" : ""}
                    >
                      <img
                        src={getPhotoUrl(photo.file_path)}
                        alt={photo.caption || photo.file_name}
                        className="w-full h-auto rounded-lg"
                      />
                      {photo.caption && (
                        <p className="text-sm text-gray-600 mt-2 text-center italic">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {event.photos.map((photo) => (
                    <div key={photo.id}>
                      <img
                        src={getPhotoUrl(photo.file_path)}
                        alt={photo.caption || photo.file_name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {photo.caption && (
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderPolaroidLayout = () => (
    <div className="space-y-8">
      {events.map((event) => (
        <div key={event.id} className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {event.title}
          </h3>

          {event.photos && event.photos.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6">
              {event.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="bg-white p-4 shadow-lg transform hover:scale-105 transition-transform"
                  style={{
                    transform: `rotate(${(index % 3 - 1) * 3}deg)`,
                  }}
                >
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.caption || photo.file_name}
                    className="w-48 h-48 object-cover"
                  />
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-700 font-handwriting">
                      {photo.caption || event.title}
                    </p>
                    {event.event_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(event.event_date), 'M/d/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderMinimalLayout = () => (
    <div className="max-w-4xl mx-auto space-y-16">
      {events.map((event) => (
        <div key={event.id} className="border-b border-gray-200 pb-16 last:border-b-0">
          <div className="mb-8">
            <h3 className="text-3xl font-light text-gray-900 mb-2">
              {event.title}
            </h3>
            {event.event_date && (
              <p className="text-gray-500 uppercase tracking-wide text-sm">
                {format(new Date(event.event_date), 'MMMM d, yyyy')}
              </p>
            )}
          </div>

          {event.description && (
            <p className="text-gray-700 mb-8 text-lg leading-relaxed">
              {event.description}
            </p>
          )}

          {event.photos && event.photos.length > 0 && (
            <div className="space-y-4">
              {event.photos.map((photo) => (
                <div key={photo.id} className="w-full">
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.caption || photo.file_name}
                    className="w-full h-auto"
                  />
                  {photo.caption && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderScrapbookLayout = () => (
    <div className="bg-yellow-50 min-h-screen p-8">
      <div className="space-y-12">
        {events.map((event) => (
          <div key={event.id} className="bg-white p-8 shadow-lg border-8 border-white">
            <div className="border-b-2 border-dashed border-gray-300 pb-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-handwriting">
                {event.title}
              </h3>
              {event.event_date && (
                <p className="text-gray-600 font-handwriting">
                  {format(new Date(event.event_date), 'MMMM d, yyyy')}
                </p>
              )}
              {event.location && (
                <p className="text-gray-500 font-handwriting">{event.location}</p>
              )}
            </div>

            {event.description && (
              <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-400">
                <p className="text-gray-700 font-handwriting italic">
                  "{event.description}"
                </p>
              </div>
            )}

            {event.photos && event.photos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative"
                    style={{
                      transform: `rotate(${(index % 5 - 2) * 2}deg)`,
                    }}
                  >
                    <img
                      src={getPhotoUrl(photo.file_path)}
                      alt={photo.caption || photo.file_name}
                      className="w-full aspect-square object-cover border-4 border-white shadow-md"
                    />
                    {photo.caption && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-200 p-2 rotate-12 shadow-sm">
                        <p className="text-xs text-gray-700 font-handwriting">
                          {photo.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderLayout = () => {
    switch (newsletter.layout) {
      case 'timeline':
        return renderTimelineLayout()
      case 'magazine':
        return renderMagazineLayout()
      case 'polaroid':
        return renderPolaroidLayout()
      case 'minimal':
        return renderMinimalLayout()
      case 'scrapbook':
        return renderScrapbookLayout()
      default:
        return renderGridLayout()
    }
  }

  return (
    <div className="newsletter-preview">
      {/* Header */}
      <div className="text-center mb-12 pb-8 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {newsletter.title}
        </h1>
        {newsletter.description && (
          <p className="text-xl text-gray-600 mb-4">{newsletter.description}</p>
        )}
        <p className="text-gray-500">
          Created on {format(new Date(newsletter.created_at), 'MMMM d, yyyy')}
        </p>
        {newsletter.is_published && newsletter.published_at && (
          <p className="text-green-600 mt-2">
            Published on {format(new Date(newsletter.published_at), 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Content */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No events to display in this newsletter.</p>
        </div>
      ) : (
        renderLayout()
      )}

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500">
        <p>Created with Photo Newsletter App</p>
      </div>

      <style jsx>{`
        .font-handwriting {
          font-family: 'Kalam', cursive;
        }
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');
      `}</style>
    </div>
  )
}

export default NewsletterPreview