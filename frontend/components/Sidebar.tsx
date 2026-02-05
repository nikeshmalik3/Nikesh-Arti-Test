'use client';

import { MessageSquarePlus, ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  sessions: Array<{ id: string; title: string; timestamp: Date }>;
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession
}: SidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  return (
    <>
      {/* Overlay for mobile only */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 22, 20, 0.4)',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease-out',
            display: 'none' // Hidden on desktop
          }}
          className="mobile-overlay"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isOpen ? '280px' : '0',
          background: 'linear-gradient(180deg, #f8f7f5 0%, #f3f1ed 100%)',
          borderRight: isOpen ? '1px solid var(--color-border)' : 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease 0.1s'
        }}>
          <h2 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Sessions
          </h2>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          style={{
            margin: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            opacity: isOpen ? 1 : 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e4a6f';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 90, 138, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-accent)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <MessageSquarePlus size={18} />
          New Conversation
        </button>

        {/* Sessions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 0.5rem',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease 0.15s'
        }}>
          {sessions.length === 0 ? (
            <p style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--color-ink-light)',
              fontFamily: 'var(--font-sans)',
              fontStyle: 'italic'
            }}>
              No previous sessions
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  style={{
                    position: 'relative',
                    opacity: 0,
                    animation: `slideInLeft 0.3s ease-out ${index * 0.05}s forwards`
                  }}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: currentSessionId === session.id
                        ? 'rgba(42, 90, 138, 0.08)'
                        : hoveredSession === session.id
                        ? 'rgba(26, 22, 20, 0.03)'
                        : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      borderLeft: currentSessionId === session.id
                        ? '3px solid var(--color-accent)'
                        : '3px solid transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem'
                    }}
                  >
                    <span style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-serif)',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {session.title}
                    </span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.6875rem',
                      color: 'var(--color-ink-light)',
                      fontFamily: 'var(--font-sans)'
                    }}>
                      <Clock size={12} />
                      {new Date(session.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </button>

                  {/* Delete button */}
                  {hoveredSession === session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '0.375rem',
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        animation: 'fadeIn 0.2s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee';
                        e.currentTarget.style.borderColor = '#fcc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }}
                    >
                      <Trash2 size={14} style={{ color: '#c84a4a' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--color-border)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease 0.1s'
        }}>
          <p style={{
            fontSize: '0.6875rem',
            color: 'var(--color-ink-light)',
            fontFamily: 'var(--font-sans)',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            EduAssist v1.0<br />
            Educational Content Assistant
          </p>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: isOpen ? '280px' : '0',
          top: '1.5rem',
          width: '36px',
          height: '36px',
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: '0 6px 6px 0',
          borderLeft: isOpen ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 60,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-paper)';
          e.currentTarget.style.transform = 'translateX(2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        {isOpen ? (
          <ChevronLeft size={18} style={{ color: 'var(--color-ink)' }} />
        ) : (
          <ChevronRight size={18} style={{ color: 'var(--color-ink)' }} />
        )}
      </button>
    </>
  );
}
