export function NewspaperHeader() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="pb-2 mb-3">
      {/* Top decorative lines */}
      <div style={{
        borderTop: '3px solid black',
        borderBottom: '1px solid black',
        height: '4px',
        marginBottom: '4px'
      }}></div>
      
      {/* Top details line */}
      <div className="flex justify-between items-center mb-1 px-1" style={{ 
        fontFamily: "'Libre Baskerville', serif",
        fontSize: '7px',
        fontWeight: 400,
        letterSpacing: '0.5px'
      }}>
        <span>VOL. CXLVII....NO. 51,234</span>
        <span>NEW YORK, {formattedDate.toUpperCase()}</span>
        <span>PRICE 25 CENTS</span>
      </div>

      <div style={{
        borderTop: '1px solid black',
        marginBottom: '6px'
      }}></div>
      
      {/* Masthead */}
      <div className="text-center mb-2">
        <div style={{ 
          fontFamily: "'Old Standard TT', serif",
          fontSize: '7.5px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '4px'
        }}>
          Copyright 2025 The New York Times Company
        </div>
        
        <h1 style={{ 
          fontFamily: "'Old English Text MT', 'Playfair Display', serif", 
          fontSize: '72px',
          fontWeight: 400,
          letterSpacing: '2px',
          lineHeight: 0.85,
          margin: '8px 0'
        }}>
          The New York Times
        </h1>
        
        <div style={{ 
          fontFamily: "'Old Standard TT', serif",
          fontSize: '9px',
          fontStyle: 'italic',
          letterSpacing: '1px',
          marginTop: '4px'
        }}>
          "All the News That's Fit to Print"
        </div>
      </div>

      {/* Bottom line with weather */}
      <div style={{
        borderTop: '2px solid black',
        borderBottom: '1px solid black',
        padding: '3px 0',
        marginTop: '8px'
      }}>
        <div className="flex justify-between items-center px-1" style={{ 
          fontFamily: "'Libre Baskerville', serif",
          fontSize: '7px',
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          <span>LATE EDITION</span>
          <span>TODAY: PARTLY CLOUDY, HIGH 72°</span>
          <span>TOMORROW: SUNNY, HIGH 75°</span>
        </div>
      </div>
    </div>
  );
}
