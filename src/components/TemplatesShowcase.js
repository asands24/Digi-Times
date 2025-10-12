import { useState } from 'react'
import { groupTemplates, getTemplatesByCategory } from '../data/templates'
import { Sparkles, ChevronRight } from 'lucide-react'

const TemplatesShowcase = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expandedTemplate, setExpandedTemplate] = useState(null)

  const categories = ['All', ...new Set(groupTemplates.map(t => t.category))]
  const filteredTemplates = selectedCategory === 'All'
    ? groupTemplates
    : groupTemplates.filter(t => t.category === selectedCategory)

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Section Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '3px double var(--ink-black)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent-gold)' }} />
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--ink-black)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0
          }}>
            Template Gallery
          </h2>
          <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent-gold)' }} />
        </div>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          letterSpacing: '0.05em'
        }}>
          Get inspired with these pre-designed group ideas
        </p>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${selectedCategory === category ? 'var(--ink-black)' : 'var(--border-gray)'}`,
              background: selectedCategory === category ? 'var(--accent-gold)' : 'var(--paper-white)',
              color: 'var(--ink-black)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === category ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <div
            key={template.id}
            className={`card gesture-smooth animate-slide-up animate-delay-${Math.min(index % 3, 3)}`}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Template Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--border-gray)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                lineHeight: 1
              }}>
                {template.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--ink-black)',
                  marginBottom: '0.25rem',
                  lineHeight: 1.2
                }}>
                  {template.name}
                </h3>
                <span style={{
                  display: 'inline-block',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid var(--ink-black)',
                  backgroundColor: 'var(--paper-cream)',
                  color: 'var(--text-secondary)'
                }}>
                  {template.category}
                </span>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: 1.6
            }}>
              {template.description}
            </p>

            {/* Example Use Case */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--paper-cream)',
              border: '1px solid var(--border-gray)',
              marginBottom: '1rem'
            }}>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: 'var(--ink-gray)',
                fontStyle: 'italic',
                lineHeight: 1.5
              }}>
                <strong style={{ fontStyle: 'normal', color: 'var(--ink-black)' }}>Example:</strong> {template.example}
              </p>
            </div>

            {/* Suggested Events */}
            {expandedTemplate === template.id ? (
              <div style={{
                marginBottom: '1rem',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <h4 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-black)',
                  marginBottom: '0.5rem'
                }}>
                  Suggested Events:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {template.suggestedEvents.map((event, i) => (
                    <li key={i} style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      padding: '0.25rem 0',
                      paddingLeft: '1rem',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--accent-gold)'
                      }}>▸</span>
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexDirection: 'column'
            }}>
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                style={{
                  padding: '0.5rem',
                  border: '2px solid var(--ink-black)',
                  background: 'var(--paper-white)',
                  color: 'var(--ink-black)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {expandedTemplate === template.id ? 'Show Less' : 'See Details'}
                <ChevronRight
                  style={{
                    width: '1rem',
                    height: '1rem',
                    transform: expandedTemplate === template.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>
              <button
                onClick={() => onSelectTemplate(template)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
              >
                Use This Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-secondary)'
        }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem'
          }}>
            No templates found in this category
          </p>
        </div>
      )}
    </div>
  )
}

export default TemplatesShowcase
