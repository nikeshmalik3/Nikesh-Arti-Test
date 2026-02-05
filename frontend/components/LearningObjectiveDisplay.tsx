'use client';

import { Copy, Check, BookmarkPlus, FileText } from 'lucide-react';
import { useState } from 'react';

interface SearchResult {
  source: string;
  title?: string;
  content: string;
  similarity: number;
}

interface LearningObjectiveDisplayProps {
  objectivesText: string;
  searchResults?: SearchResult[];
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
  saveError?: string;
}

export default function LearningObjectiveDisplay({ objectivesText, searchResults = [], onSave, saveStatus = 'idle', saveError = '' }: LearningObjectiveDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Create references from search results - unique sources only
  const references = searchResults.reduce((acc: SearchResult[], curr) => {
    if (!acc.find(r => r.source === curr.source)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  // Parse objectives from text (numbered list)
  const objectives = objectivesText
    .split(/\n(?=\d+\.)/)
    .filter(line => line.trim())
    .map(line => line.replace(/^\d+\.\s*/, '').trim());

  const copyToClipboard = (text: string, index: number | 'all') => {
    navigator.clipboard.writeText(text);
    if (index === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } else {
      setCopiedIndex(index as number);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Extract Bloom's taxonomy verb (first word)
  const extractBloomVerb = (objective: string) => {
    const match = objective.match(/^(analyze|evaluate|create|apply|understand|remember|synthesize|design|compare|assess|develop|formulate|justify|critique|explain|identify|describe|demonstrate|interpret|differentiate)/i);
    return match ? match[0] : null;
  };

  // Extract source citation
  const extractSource = (objective: string) => {
    const match = objective.match(/\(Source:\s*([^)]+)\)/);
    return match ? match[1] : null;
  };

  // Remove source citation from objective text
  const cleanObjective = (objective: string) => {
    return objective.replace(/\s*\(Source:\s*[^)]+\)\s*$/, '');
  };

  return (
    <div style={{
      marginTop: '2rem',
      animation: 'fadeInUp 0.4s ease-out 0.2s backwards'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #5a7a2a'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#2c2a27',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Learning Objectives
          </h3>
          <p style={{
            fontSize: '0.8125rem',
            color: '#73706b',
            fontFamily: 'var(--font-sans)',
            margin: '0.25rem 0 0 0'
          }}>
            {objectives.length} objective{objectives.length !== 1 ? 's' : ''} generated
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => copyToClipboard(objectivesText, 'all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: copiedAll ? '#5a7a2a' : 'white',
              color: copiedAll ? 'white' : '#5a7a2a',
              border: '1.5px solid #5a7a2a',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!copiedAll) {
                e.currentTarget.style.background = '#5a7a2a';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!copiedAll) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#5a7a2a';
              }
            }}
          >
            {copiedAll ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
            {copiedAll ? 'Copied!' : 'Copy All'}
          </button>

          {onSave && (
            <button
              onClick={onSave}
              disabled={saveStatus === 'saving'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                background: saveStatus === 'success'
                  ? 'linear-gradient(135deg, #2a7a2a 0%, #3a8a3a 100%)'
                  : saveStatus === 'error'
                  ? 'linear-gradient(135deg, #c84a4a 0%, #d85a5a 100%)'
                  : 'linear-gradient(135deg, #5a7a2a 0%, #6a8a3a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(90, 122, 42, 0.2)',
                opacity: saveStatus === 'saving' ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (saveStatus !== 'saving') {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 122, 42, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 122, 42, 0.2)';
              }}
            >
              {saveStatus === 'saving' && (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Saving...
                </>
              )}
              {saveStatus === 'success' && (
                <>
                  <Check size={16} strokeWidth={2} />
                  Saved!
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <BookmarkPlus size={16} strokeWidth={2} />
                  Try Again
                </>
              )}
              {saveStatus === 'idle' && (
                <>
                  <BookmarkPlus size={16} strokeWidth={2} />
                  Save to Database
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {saveStatus === 'error' && saveError && (
            <div style={{
              padding: '0.625rem 1rem',
              background: 'rgba(200, 74, 74, 0.08)',
              border: '1px solid rgba(200, 74, 74, 0.2)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#c84a4a',
              fontFamily: 'var(--font-sans)',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Objectives Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {objectives.map((objective, idx) => {
          const bloomVerb = extractBloomVerb(objective);
          const source = extractSource(objective);
          const cleanText = cleanObjective(objective);

          return (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1.5px solid #e6e3df',
                borderRadius: '10px',
                padding: '1.5rem',
                position: 'relative',
                transition: 'all 0.2s ease',
                animation: `fadeInUp 0.3s ease-out ${(idx + 1) * 0.1}s backwards`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5a7a2a';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(90, 122, 42, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e6e3df';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Number Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '1.5rem',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #5a7a2a 0%, #6a8a3a 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 2px 8px rgba(90, 122, 42, 0.3)'
              }}>
                {idx + 1}
              </div>

              {/* Bloom's Taxonomy Verb Badge */}
              {bloomVerb && (
                <div style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.5rem',
                  padding: '0.375rem 0.75rem',
                  background: 'rgba(42, 90, 138, 0.08)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#2a5a8a',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {bloomVerb}
                </div>
              )}

              {/* Objective Text */}
              <div style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: '#2c2a27',
                fontFamily: 'var(--font-serif)',
                paddingTop: bloomVerb ? '2rem' : '1rem',
                paddingRight: '3rem'
              }}>
                {cleanText}
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f5f4f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {/* Source Citation */}
                {source && (
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#73706b',
                    fontFamily: 'var(--font-sans)',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: '#2a5a8a'
                    }} />
                    Source: {source}
                  </div>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(objective, idx)}
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.875rem',
                    background: copiedIndex === idx ? '#5a7a2a' : 'transparent',
                    color: copiedIndex === idx ? 'white' : '#73706b',
                    border: `1px solid ${copiedIndex === idx ? '#5a7a2a' : '#e6e3df'}`,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (copiedIndex !== idx) {
                      e.currentTarget.style.borderColor = '#5a7a2a';
                      e.currentTarget.style.color = '#5a7a2a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (copiedIndex !== idx) {
                      e.currentTarget.style.borderColor = '#e6e3df';
                      e.currentTarget.style.color = '#73706b';
                    }
                  }}
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check size={14} strokeWidth={2} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} strokeWidth={2} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* References Section */}
      {references.length > 0 && (
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #faf9f7 0%, #f5f4f2 100%)',
          border: '1.5px solid #e6e3df',
          borderRadius: '10px',
          animation: 'fadeInUp 0.4s ease-out 0.6s backwards'
        }}>
          {/* References Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '2px solid #2a5a8a'
          }}>
            <FileText size={20} strokeWidth={2} style={{ color: '#2a5a8a' }} />
            <h4 style={{
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: '#2c2a27',
              fontFamily: 'var(--font-serif)',
              margin: 0
            }}>
              References
            </h4>
            <span style={{
              fontSize: '0.75rem',
              color: '#73706b',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500
            }}>
              ({references.length} source{references.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Reference List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {references.map((ref, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e6e3df',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2a5a8a';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 90, 138, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e6e3df';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Reference Number */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #2a5a8a 0%, #3a7ab5 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                {/* Reference Details */}
                <div style={{ flex: 1 }}>
                  {/* Source filename */}
                  <div style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#2c2a27',
                    fontFamily: 'var(--font-serif)',
                    marginBottom: '0.375rem'
                  }}>
                    {ref.source.replace('.pdf', '')}
                  </div>

                  {/* Content preview */}
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#73706b',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.6,
                    marginBottom: '0.5rem'
                  }}>
                    {ref.content.substring(0, 150)}...
                  </div>

                  {/* Relevance score */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#2a5a8a',
                      fontWeight: 500,
                      fontFamily: 'var(--font-sans)'
                    }}>
                      Relevance: {Math.round(ref.similarity * 100)}%
                    </div>
                    <div style={{
                      flex: 1,
                      maxWidth: '200px',
                      height: '4px',
                      background: '#e6e3df',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${ref.similarity * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #2a5a8a 0%, #3a7ab5 100%)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Citation Note */}
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem',
            background: 'rgba(42, 90, 138, 0.05)',
            borderLeft: '3px solid #2a5a8a',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#73706b',
            fontFamily: 'var(--font-sans)',
            fontStyle: 'italic',
            lineHeight: 1.6
          }}>
            <strong style={{ color: '#2a5a8a' }}>Note:</strong> These references were retrieved from the knowledge base and used to ground the learning objectives. Cite as: [Number] Document Name.
          </div>
        </div>
      )}
    </div>
  );
}
