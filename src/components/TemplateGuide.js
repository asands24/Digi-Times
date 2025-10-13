import { useState } from 'react'
import { groupTemplates } from '../data/templates'
import { getPhotosByCategory } from '../data/stockPhotos'
import { ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react'

/**
 * TemplateGuide - An interactive wizard to help users choose the perfect template
 * Guides users through questions to recommend the best template for their needs
 */
const TemplateGuide = ({ onSelectTemplate, onClose }) => {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    purpose: null,
    frequency: null,
    audience: null
  })

  const questions = [
    {
      id: 'purpose',
      question: "What's the main purpose of your photo group?",
      options: [
        { value: 'family', label: 'Family Memories', icon: '👨‍👩‍👧‍👦', categories: ['Family', 'Milestones'] },
        { value: 'events', label: 'Special Events', icon: '🎉', categories: ['Special Events', 'Milestones'] },
        { value: 'hobbies', label: 'Hobbies & Projects', icon: '🎨', categories: ['Hobbies', 'Projects'] },
        { value: 'travel', label: 'Travel & Adventures', icon: '✈️', categories: ['Travel'] },
        { value: 'education', label: 'Education & Growth', icon: '📚', categories: ['Education'] }
      ]
    },
    {
      id: 'frequency',
      question: 'How often will you share photos?',
      options: [
        { value: 'daily', label: 'Daily or Weekly', icon: '📅' },
        { value: 'events', label: 'Only for Special Events', icon: '🎊' },
        { value: 'monthly', label: 'Monthly Updates', icon: '📆' },
        { value: 'whenever', label: 'Whenever I Feel Like It', icon: '🌟' }
      ]
    },
    {
      id: 'audience',
      question: 'Who will be in your group?',
      options: [
        { value: 'close-family', label: 'Close Family Only', icon: '👪' },
        { value: 'extended-family', label: 'Extended Family', icon: '👨‍👩‍👧‍👦' },
        { value: 'friends', label: 'Friends', icon: '🤝' },
        { value: 'mixed', label: 'Mix of Family & Friends', icon: '🎭' }
      ]
    }
  ]

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))

    // Auto-advance to next step after short delay
    setTimeout(() => {
      if (step < questions.length) {
        setStep(step + 1)
      }
    }, 300)
  }

  const getRecommendedTemplates = () => {
    const purpose = questions[0].options.find(opt => opt.value === answers.purpose)
    if (!purpose) return []

    return groupTemplates.filter(template =>
      purpose.categories.includes(template.category)
    )
  }

  const currentQuestion = questions[step - 1]
  const recommendedTemplates = step > questions.length ? getRecommendedTemplates() : []
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
      <div style={{
        backgroundColor: 'var(--paper-white)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '4px solid var(--ink-black)',
        boxShadow: '8px 8px 0 rgba(0,0,0,0.2)',
        borderRadius: '8px'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: '3px double var(--ink-black)',
          backgroundColor: 'var(--accent-gold)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: 'var(--ink-black)' }} />
            <h2 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '1.75rem',
              fontWeight: 900,
              color: 'var(--ink-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              Find Your Perfect Template
            </h2>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--ink-black)',
            fontStyle: 'italic'
          }}>
            Answer a few questions and we'll recommend the best template for you
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '1rem 2rem',
          borderBottom: '2px solid var(--border-gray)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  height: '8px',
                  flex: 1,
                  backgroundColor: i < step ? 'var(--accent-gold)' : 'var(--border-gray)',
                  border: '1px solid var(--ink-black)',
                  transition: 'background-color 0.3s ease'
                }} />
              </div>
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            textAlign: 'center',
            letterSpacing: '0.05em'
          }}>
            Step {Math.min(step, questions.length)} of {questions.length}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {step <= questions.length ? (
            <div className="animate-slide-up">
              <h3 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--ink-black)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                {currentQuestion.question}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    style={{
                      padding: '1.5rem 1rem',
                      border: `3px solid ${selectedAnswer === option.value ? 'var(--accent-gold)' : 'var(--ink-black)'}`,
                      backgroundColor: selectedAnswer === option.value ? 'var(--accent-gold)' : 'var(--paper-white)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      boxShadow: selectedAnswer === option.value ? '4px 4px 0 rgba(0,0,0,0.2)' : '2px 2px 0 rgba(0,0,0,0.1)',
                      transform: selectedAnswer === option.value ? 'scale(1.05)' : 'scale(1)'
                    }}
                    className="hover-lift"
                  >
                    <div style={{
                      fontSize: '2.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {option.icon}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--ink-black)',
                      textAlign: 'center'
                    }}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-slide-up">
              <h3 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--ink-black)',
                marginBottom: '1rem',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}>
                <Check style={{ display: 'inline', width: '1.5rem', height: '1.5rem', color: 'var(--accent-gold)' }} />
                {' '}Perfect Matches for You!
              </h3>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                Based on your answers, here are the templates we recommend:
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {recommendedTemplates.map((template) => {
                  const photos = template.photoCategory ? getPhotosByCategory(template.photoCategory) : []
                  return (
                    <div
                      key={template.id}
                      className="card hover-lift"
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Template Photo */}
                      {template.sampleImage && (
                        <div style={{
                          width: '100%',
                          height: '150px',
                          marginBottom: '1rem',
                          overflow: 'hidden',
                          border: '2px solid var(--border-gray)',
                          borderRadius: '4px'
                        }}>
                          <img
                            src={template.sampleImage}
                            alt={template.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>{template.icon}</span>
                        <h4 style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--ink-black)',
                          margin: 0
                        }}>
                          {template.name}
                        </h4>
                      </div>

                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                        lineHeight: 1.5
                      }}>
                        {template.description}
                      </p>

                      {/* Sample Photo Preview */}
                      {photos.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '0.25rem',
                          marginBottom: '1rem'
                        }}>
                          {photos.slice(0, 3).map((photo) => (
                            <div key={photo.id} style={{
                              width: '60px',
                              height: '60px',
                              border: '1px solid var(--border-gray)',
                              overflow: 'hidden',
                              borderRadius: '2px'
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
                      )}

                      <button
                        onClick={() => onSelectTemplate(template)}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        Choose This Template
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '2px solid var(--border-gray)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="btn btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? 'Previous' : 'Cancel'}
          </button>

          {step > questions.length && (
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Browse All Templates
            </button>
          )}

          {step <= questions.length && step < questions.length && (
            <button
              onClick={() => setStep(step + 1)}
              className="btn btn-primary"
              disabled={!selectedAnswer}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateGuide
