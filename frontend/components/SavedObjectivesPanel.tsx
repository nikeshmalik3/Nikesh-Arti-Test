'use client';

import { useState, useEffect } from 'react';
import { BookmarkCheck, ChevronDown, ChevronRight, Calendar, Tag } from 'lucide-react';

interface SavedObjective {
  id: string;
  created_at: string;
  topic: string;
  level: string | null;
  objectives_text: string;
  objective_count: number;
  had_context: boolean;
  sources: any[];
}

interface SavedObjectivesPanelProps {
  onSelectObjective?: (objective: SavedObjective) => void;
}

export default function SavedObjectivesPanel({ onSelectObjective }: SavedObjectivesPanelProps) {
  const [objectives, setObjectives] = useState<SavedObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedObjectives();
  }, []);

  const fetchSavedObjectives = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/saved_objectives?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey || '',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch saved objectives');
      }

      const data = await response.json();
      setObjectives(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{
        padding: '1.5rem',
        textAlign: 'center',
        color: 'var(--color-ink-light)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem'
      }}>
        Loading saved objectives...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1.5rem',
        textAlign: 'center',
        color: '#c84a4a',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem'
      }}>
        {error}
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <div style={{
        padding: '2rem 1.5rem',
        textAlign: 'center'
      }}>
        <BookmarkCheck size={48} style={{
          color: 'var(--color-border)',
          marginBottom: '1rem'
        }} />
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--color-ink-light)',
          fontFamily: 'var(--font-sans)'
        }}>
          No saved objectives yet
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '2px solid var(--color-accent)'
      }}>
        <BookmarkCheck size={20} style={{ color: 'var(--color-accent)' }} />
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-serif)',
          margin: 0
        }}>
          Saved Objectives
        </h3>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.75rem',
          color: 'var(--color-ink-light)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500
        }}>
          {objectives.length}
        </span>
      </div>

      {/* Objectives List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {objectives.map((obj) => {
          const isExpanded = expandedId === obj.id;
          const objectivesList = obj.objectives_text
            .split(/\n(?=\d+\.)/)
            .filter(line => line.trim());

          return (
            <div
              key={obj.id}
              style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 90, 138, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div style={{
                  marginTop: '0.125rem',
                  color: 'var(--color-accent)',
                  flexShrink: 0
                }}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-serif)',
                    marginBottom: '0.375rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {obj.topic}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-ink-light)',
                    fontFamily: 'var(--font-sans)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      {formatDate(obj.created_at)}
                    </div>
                    {obj.level && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag size={12} />
                        {obj.level}
                      </div>
                    )}
                    <div style={{
                      padding: '0.125rem 0.375rem',
                      background: 'var(--color-accent)',
                      color: 'white',
                      borderRadius: '3px',
                      fontSize: '0.6875rem',
                      fontWeight: 600
                    }}>
                      {obj.objective_count}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{
                  padding: '0 1rem 1rem 1rem',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-serif)'
                  }}>
                    {objectivesList.map((objective, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: '0.75rem',
                          paddingLeft: '0.5rem',
                          borderLeft: '2px solid var(--color-accent)'
                        }}
                      >
                        {objective.replace(/^\d+\.\s*/, '')}
                      </div>
                    ))}
                  </div>
                  {obj.had_context && obj.sources.length > 0 && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(42, 90, 138, 0.05)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--color-accent)',
                      fontFamily: 'var(--font-sans)',
                      fontStyle: 'italic'
                    }}>
                      Generated from {obj.sources.length} source{obj.sources.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {onSelectObjective && (
                    <button
                      onClick={() => onSelectObjective(obj)}
                      style={{
                        marginTop: '0.75rem',
                        width: '100%',
                        padding: '0.5rem',
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-accent-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-accent)';
                      }}
                    >
                      View in Chat
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
