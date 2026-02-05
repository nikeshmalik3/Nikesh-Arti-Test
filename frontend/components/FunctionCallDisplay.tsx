'use client';

import { FunctionCallResult, SearchResult } from '@/lib/types';
import { Search, Target, Save, CheckCircle, XCircle, BookOpen, Copy, ChevronRight, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FunctionCallDisplayProps {
  functionCall: FunctionCallResult;
}

export default function FunctionCallDisplay({ functionCall }: FunctionCallDisplayProps) {
  const { name, args, result } = functionCall;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [isMisconceptionsExpanded, setIsMisconceptionsExpanded] = useState(true);
  const [isPathExpanded, setIsPathExpanded] = useState(true);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getFunctionLabel = () => {
    switch (name) {
      case 'list_available_topics': return 'Knowledge Base Catalog';
      case 'search_knowledge_base': return 'Source Retrieval';
      case 'generate_learning_objectives': return 'Objective Generation';
      case 'save_content': return 'Content Saved';
      case 'identify_common_misconceptions': return 'Misconception Analysis';
      case 'generate_learning_path': return 'Learning Path Generation';
      default: return name;
    }
  };

  const getFunctionIcon = () => {
    switch (name) {
      case 'list_available_topics': return <BookOpen size={20} strokeWidth={1.5} />;
      case 'search_knowledge_base': return <Search size={20} strokeWidth={1.5} />;
      case 'generate_learning_objectives': return <Target size={20} strokeWidth={1.5} />;
      case 'save_content': return <Save size={20} strokeWidth={1.5} />;
      case 'identify_common_misconceptions': return <Target size={20} strokeWidth={1.5} />;
      case 'generate_learning_path': return <Target size={20} strokeWidth={1.5} />;
      default: return <Search size={20} strokeWidth={1.5} />;
    }
  };

  // Search Knowledge Base - Auto-expanded with rich source cards
  if (name === 'search_knowledge_base' && result.success && result.results) {
    return (
      <div style={{
        marginBottom: '2rem',
        animation: 'fadeInUp 0.4s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #2a5a8a'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2a5a8a 0%, #3a7ab5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 8px rgba(42, 90, 138, 0.2)'
          }}>
            {getFunctionIcon()}
          </div>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#2c2a27',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.01em'
            }}>
              {getFunctionLabel()}
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#73706b',
              fontFamily: 'var(--font-sans)',
              fontStyle: 'italic',
              marginTop: '0.125rem'
            }}>
              "{args.query}"
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            fontSize: '0.8125rem',
            color: '#2a5a8a',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} strokeWidth={2} />
              {result.results_count} Sources
            </div>
            <button
              onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#2a5a8a',
                padding: '0.25rem',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(42, 90, 138, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {isSourcesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Source Cards - Collapsible */}
        {isSourcesExpanded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {result.results.map((doc: SearchResult, idx: number) => (
            <div
              key={idx}
              id={`source-${idx}`}
              onMouseEnter={() => setHighlightedSource(idx)}
              onMouseLeave={() => setHighlightedSource(null)}
              style={{
                background: highlightedSource === idx
                  ? 'linear-gradient(to right, #faf9f7, #ffffff)'
                  : 'white',
                border: highlightedSource === idx
                  ? '1.5px solid #2a5a8a'
                  : '1px solid #e6e3df',
                borderRadius: '8px',
                padding: '1.25rem',
                transition: 'all 0.2s ease',
                boxShadow: highlightedSource === idx
                  ? '0 4px 12px rgba(42, 90, 138, 0.08)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                position: 'relative',
                animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s backwards`
              }}
            >
              {/* Source Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.875rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f5f4f2 0%, #e6e3df 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#2a5a8a'
                }}>
                  <FileText size={18} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#2c2a27',
                    fontFamily: 'var(--font-serif)',
                    marginBottom: '0.25rem',
                    lineHeight: 1.3
                  }}>
                    {doc.title || doc.source}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#73706b',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>Passage {doc.chunk_index + 1}</span>
                    <span style={{ color: '#d4d1cc' }}>•</span>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      background: doc.similarity >= 0.7
                        ? 'rgba(42, 90, 138, 0.08)'
                        : 'rgba(115, 112, 107, 0.08)',
                      borderRadius: '3px',
                      color: doc.similarity >= 0.7 ? '#2a5a8a' : '#73706b',
                      fontWeight: 500
                    }}>
                      {(doc.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>
              </div>

              {/* Passage Content */}
              <div style={{
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: '#3c3a35',
                fontFamily: 'var(--font-serif)',
                paddingLeft: '2.5rem',
                borderLeft: '3px solid #e6e3df',
                marginLeft: '1rem'
              }}>
                {doc.content.length > 280
                  ? doc.content.substring(0, 280) + '...'
                  : doc.content}
              </div>

              {/* Relevance Bar */}
              <div style={{
                marginTop: '1rem',
                marginLeft: '1rem',
                paddingLeft: '2.5rem'
              }}>
                <div style={{
                  height: '4px',
                  background: '#f5f4f2',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${doc.similarity * 100}%`,
                    background: `linear-gradient(90deg, #2a5a8a 0%, #3a7ab5 100%)`,
                    transition: 'width 0.6s ease-out',
                    animation: `slideIn 0.8s ease-out ${idx * 0.1}s backwards`
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  }

  // Generate Learning Objectives - Show metadata
  if (name === 'generate_learning_objectives' && result.success) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f4f2 0%, #faf9f7 100%)',
        border: '1px solid #e6e3df',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #5a7a2a 0%, #6a8a3a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {getFunctionIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#2c2a27',
              fontFamily: 'var(--font-serif)'
            }}>
              {getFunctionLabel()}
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#73706b',
              fontFamily: 'var(--font-sans)',
              marginTop: '0.25rem',
              display: 'flex',
              gap: '1rem'
            }}>
              <span><strong>Topic:</strong> {args.topic}</span>
              {args.level && <span><strong>Level:</strong> {args.level}</span>}
              {args.count && <span><strong>Count:</strong> {args.count}</span>}
            </div>
          </div>
          <CheckCircle size={20} strokeWidth={2} style={{ color: '#5a7a2a' }} />
        </div>

        {result.had_context && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e6e3df',
            fontSize: '0.8125rem',
            color: '#5a7a2a',
            fontFamily: 'var(--font-sans)',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ChevronRight size={14} />
            Objectives generated using retrieved source context
          </div>
        )}
      </div>
    );
  }

  // List Available Topics
  if (name === 'list_available_topics' && result.success && result.topics) {
    return (
      <div style={{
        marginBottom: '2rem',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #7a5a7a'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7a5a7a 0%, #8a6a8a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {getFunctionIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#2c2a27',
              fontFamily: 'var(--font-serif)'
            }}>
              {getFunctionLabel()}
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#73706b',
              fontFamily: 'var(--font-sans)',
              marginTop: '0.125rem'
            }}>
              {result.topics_count} documents available
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {result.topics.map((topic: any, idx: number) => (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1px solid #e6e3df',
                borderRadius: '6px',
                padding: '1rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s backwards`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#7a5a7a';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(122, 90, 122, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e6e3df';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#2c2a27',
                fontFamily: 'var(--font-serif)',
                marginBottom: '0.375rem',
                lineHeight: 1.3
              }}>
                {topic.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#73706b',
                fontFamily: 'var(--font-sans)'
              }}>
                {topic.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Save Content
  if (name === 'save_content' && result.success) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(90, 122, 42, 0.05) 0%, rgba(90, 122, 42, 0.02) 100%)',
        border: '1px solid rgba(90, 122, 42, 0.2)',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        <CheckCircle size={20} strokeWidth={2} style={{ color: '#5a7a2a', flexShrink: 0 }} />
        <div style={{
          fontSize: '0.9375rem',
          color: '#2c2a27',
          fontFamily: 'var(--font-serif)'
        }}>
          <strong>Saved:</strong> "{args.title}"
        </div>
      </div>
    );
  }

  // Identify Common Misconceptions
  if (name === 'identify_common_misconceptions' && result.success) {
    return (
      <div style={{
        marginBottom: '2rem',
        animation: 'fadeInUp 0.4s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #c84a4a'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #c84a4a 0%, #d85a5a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 8px rgba(200, 74, 74, 0.2)'
          }}>
            {getFunctionIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#2c2a27',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.01em'
            }}>
              {getFunctionLabel()}
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#73706b',
              fontFamily: 'var(--font-sans)',
              fontStyle: 'italic',
              marginTop: '0.125rem'
            }}>
              Topic: "{args.topic}" • Level: {args.student_level || 'university'}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {result.sources_used > 0 && (
              <div style={{
                fontSize: '0.75rem',
                color: '#c84a4a',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                background: 'rgba(200, 74, 74, 0.08)',
                borderRadius: '4px'
              }}>
                <CheckCircle size={14} strokeWidth={2} />
                {result.sources_used} Sources
              </div>
            )}
            <button
              onClick={() => setIsMisconceptionsExpanded(!isMisconceptionsExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#c84a4a',
                padding: '0.25rem',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(200, 74, 74, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {isMisconceptionsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Misconceptions Content - Collapsible */}
        {isMisconceptionsExpanded && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(200, 74, 74, 0.03) 0%, rgba(200, 74, 74, 0.01) 100%)',
            border: '1.5px solid rgba(200, 74, 74, 0.15)',
            borderRadius: '8px',
            padding: '1.5rem',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: '#2c2a27',
            fontFamily: 'var(--font-serif)',
            whiteSpace: 'pre-wrap'
          }}>
            {result.misconceptions}
          </div>

          {result.had_context && (
            <div style={{
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: '#c84a4a',
              fontFamily: 'var(--font-sans)',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ChevronRight size={14} />
              Analysis informed by knowledge base sources
            </div>
          )}
        </div>
        )}
      </div>
    );
  }

  // Generate Learning Path
  if (name === 'generate_learning_path' && result.success) {
    return (
      <div style={{
        marginBottom: '2rem',
        animation: 'fadeInUp 0.4s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #7a5a2a'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7a5a2a 0%, #9a7a4a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 8px rgba(122, 90, 42, 0.2)'
          }}>
            {getFunctionIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#2c2a27',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.01em'
            }}>
              {getFunctionLabel()}
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#73706b',
              fontFamily: 'var(--font-sans)',
              marginTop: '0.25rem',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <span><strong>Topic:</strong> {args.topic}</span>
              <span><strong>Path:</strong> {result.start_level} → {result.end_level}</span>
              <span><strong>Duration:</strong> {result.duration}</span>
              <span><strong>Objectives:</strong> {result.objective_count}</span>
            </div>
          </div>
          <button
            onClick={() => setIsPathExpanded(!isPathExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#7a5a2a',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(122, 90, 42, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {isPathExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Learning Path Content - Collapsible */}
        {isPathExpanded && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(122, 90, 42, 0.03) 0%, rgba(122, 90, 42, 0.01) 100%)',
            border: '1.5px solid rgba(122, 90, 42, 0.15)',
            borderRadius: '8px',
            padding: '1.5rem',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: '#2c2a27',
            fontFamily: 'var(--font-serif)',
            whiteSpace: 'pre-wrap'
          }}>
            {result.learning_path}
          </div>

          {result.had_context && (
            <div style={{
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: '#7a5a2a',
              fontFamily: 'var(--font-sans)',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ChevronRight size={14} />
              Learning path grounded in knowledge base content
            </div>
          )}
        </div>
        )}
      </div>
    );
  }

  // Default/Error fallback
  return (
    <div style={{
      background: result.success ? '#f5f4f2' : 'rgba(200, 74, 74, 0.05)',
      border: `1px solid ${result.success ? '#e6e3df' : 'rgba(200, 74, 74, 0.2)'}`,
      borderRadius: '6px',
      padding: '1rem',
      fontSize: '0.875rem',
      fontFamily: 'var(--font-sans)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem'
      }}>
        {result.success ? (
          <CheckCircle size={18} strokeWidth={2} style={{ color: '#5a7a2a' }} />
        ) : (
          <XCircle size={18} strokeWidth={2} style={{ color: '#c84a4a' }} />
        )}
        <span style={{
          fontWeight: 500,
          color: '#2c2a27'
        }}>
          {getFunctionLabel()}
        </span>
      </div>
      {!result.success && result.error && (
        <div style={{
          marginTop: '0.5rem',
          color: '#c84a4a',
          fontSize: '0.8125rem'
        }}>
          {result.error}
        </div>
      )}
    </div>
  );
}
