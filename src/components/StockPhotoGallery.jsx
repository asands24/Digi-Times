import React, { useState } from 'react'
import { stockPhotos, getPhotosByCategory, getRandomPhotos, photoAttribution } from '../data/stockPhotos'

const StockPhotoGallery = ({ category = null, limit = 6 }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // Get photos based on category or random selection
  const photos = category
    ? getPhotosByCategory(category).slice(0, limit)
    : getRandomPhotos(limit)

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo)
  }

  const closeModal = () => {
    setSelectedPhoto(null)
  }

  return (
    <div className="stock-photo-gallery">
      <div className="gallery-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        padding: '1rem'
      }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="gallery-item"
            onClick={() => handlePhotoClick(photo)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src={photo.thumbnail}
              alt={photo.alt}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div style={{ padding: '0.5rem', background: '#f9f9f9' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                {photo.alt}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Attribution */}
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#999'
      }}>
        <p>
          {photoAttribution.attribution}.
          Photos from <a
            href={photoAttribution.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff' }}
          >
            {photoAttribution.source}
          </a>
        </p>
      </div>

      {/* Modal for enlarged photo */}
      {selectedPhoto && (
        <div
          className="photo-modal"
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.alt}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.5rem',
                lineHeight: '1'
              }}
            >
              ×
            </button>
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedPhoto.alt}</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
                Tags: {selectedPhoto.tags.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockPhotoGallery

// Example usage:
// <StockPhotoGallery category="family" limit={6} />
// <StockPhotoGallery category="wedding" limit={4} />
// <StockPhotoGallery limit={9} /> {/* Random photos */}
