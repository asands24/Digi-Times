const LoadingSpinner = ({ size = 'md', message = 'Loading...', fullScreen = true }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const containerClass = fullScreen
    ? "flex flex-col items-center justify-center min-h-screen"
    : "flex flex-col items-center justify-center p-8"

  return (
    <div className={containerClass} style={{ backgroundColor: 'var(--paper-cream)' }}>
      {/* Newspaper-themed loading animation */}
      <div className="relative" style={{ width: sizeClasses[size].split(' ')[0].replace('w-', '') + 'rem', height: sizeClasses[size].split(' ')[1].replace('h-', '') + 'rem' }}>
        <div style={{
          width: '100%',
          height: '100%',
          border: '3px solid var(--ink-black)',
          borderTop: '3px solid var(--accent-gold)',
          animation: 'spin 1s linear infinite',
          background: 'var(--paper-white)',
          boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size === 'sm' ? '0.5rem' : size === 'md' ? '0.75rem' : '1rem',
          fontFamily: 'var(--font-headline)',
          fontWeight: 900,
          color: 'var(--ink-black)'
        }}>
          📰
        </div>
      </div>
      {message && (
        <p style={{
          marginTop: '1.5rem',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
          textAlign: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {message}
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner