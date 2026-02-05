import { Message } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import FunctionCallDisplay from './FunctionCallDisplay';
import LearningObjectiveDisplay from './LearningObjectiveDisplay';
import { FileText } from 'lucide-react';
import { useState } from 'react';

interface MessageItemProps {
  message: Message;
  index: number;
  onOpenPdf?: (pdfFile: string, highlights: Array<{ content: string; chunk_index: number; similarity: number }>) => void;
}

export default function MessageItem({ message, index, onOpenPdf }: MessageItemProps) {
  const isUser = message.role === 'user';
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');

  // Check if message contains learning objectives
  const hasLearningObjectives = message.function_calls?.some(
    fc => fc.name === 'generate_learning_objectives' && fc.result?.objectives
  );

  const learningObjectivesCall = message.function_calls?.find(
    fc => fc.name === 'generate_learning_objectives'
  );

  const learningObjectivesResult = learningObjectivesCall?.result;

  // Check if RAG search was used
  const searchResults = message.function_calls?.find(
    fc => fc.name === 'search_knowledge_base'
  )?.result;

  const hasSearchResults = searchResults?.success && searchResults?.results?.length > 0;

  // Save objectives handler
  const handleSaveObjectives = async () => {
    if (!learningObjectivesResult?.objectives || !learningObjectivesCall?.args) {
      return;
    }

    setSaveStatus('saving');
    setSaveError('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/save-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          topic: learningObjectivesCall.args.topic,
          level: learningObjectivesCall.args.level || null,
          objectives_text: learningObjectivesResult.objectives,
          objective_count: learningObjectivesCall.args.count || 3,
          had_context: learningObjectivesResult.had_context || false,
          sources: searchResults?.results || [],
          title: null,
          notes: null,
          tags: []
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus('success');
        // Stay as "Saved!" - don't reset
      } else {
        setSaveStatus('error');
        setSaveError(data.error || 'Failed to save objectives');
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to save objectives');
    }
  };

  return (
    <div style={{
      opacity: 0,
      animation: `fadeInUp 0.5s ease-out ${index * 0.05}s forwards`
    }}>
      {/* Role Label */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.75rem',
        marginBottom: '0.875rem'
      }}>
        <span style={{
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          color: isUser ? 'var(--color-ink)' : 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          {isUser ? 'You' : 'EduAssist'}
        </span>
        <div style={{
          flex: 1,
          height: '1px',
          background: 'var(--color-border)'
        }} />
      </div>

      {/* Function Calls */}
      {message.function_calls && message.function_calls.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {message.function_calls.map((fc, fcIndex) => (
            <FunctionCallDisplay key={fcIndex} functionCall={fc} />
          ))}
        </div>
      )}

      {/* Learning Objectives Display */}
      {hasLearningObjectives && learningObjectivesResult?.objectives && (
        <LearningObjectiveDisplay
          objectivesText={learningObjectivesResult.objectives}
          searchResults={searchResults?.results || []}
          onSave={handleSaveObjectives}
          saveStatus={saveStatus}
          saveError={saveError}
        />
      )}

      {/* Message Content */}
      <div style={{
        paddingLeft: isUser ? '0' : '1.5rem',
        borderLeft: isUser ? 'none' : '2px solid var(--color-border)'
      }}>
        <div style={{
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          color: 'var(--color-ink)'
        }}>
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p style={{ marginBottom: '1.25rem' }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{
                  marginLeft: '1.5rem',
                  marginBottom: '1.25rem',
                  listStyleType: 'disc'
                }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{
                  marginLeft: '1.5rem',
                  marginBottom: '1.25rem'
                }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: '0.5rem' }}>{children}</li>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600 }}>{children}</strong>
              ),
              em: ({ children }) => (
                <em style={{ fontStyle: 'italic' }}>{children}</em>
              ),
              h1: ({ children }) => (
                <h1 style={{
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                  fontWeight: 600
                }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{
                  fontSize: '1.3rem',
                  marginBottom: '0.875rem',
                  fontWeight: 600
                }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{
                  fontSize: '1.15rem',
                  marginBottom: '0.75rem',
                  fontWeight: 600
                }}>{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{
                  borderLeft: '3px solid var(--color-accent)',
                  paddingLeft: '1.25rem',
                  marginLeft: 0,
                  marginBottom: '1.25rem',
                  color: 'var(--color-ink-light)',
                  fontStyle: 'italic'
                }}>{children}</blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  style={{
                    color: 'var(--color-accent)',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(42, 90, 138, 0.3)',
                    textUnderlineOffset: '2px',
                    transition: 'text-decoration-color 0.2s'
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecorationColor = 'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecorationColor = 'rgba(42, 90, 138, 0.3)';
                  }}
                >
                  {children}
                </a>
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* View Source Button - Only show for assistant messages with search results */}
        {!isUser && hasSearchResults && onOpenPdf && (
          <div style={{
            marginTop: '1.5rem',
            paddingLeft: '1.5rem'
          }}>
            <button
              onClick={() => {
                // Get unique PDF files from search results
                const pdfFile = searchResults.results[0].source;
                const highlights = searchResults.results.map((r: any) => ({
                  content: r.content,
                  chunk_index: r.chunk_index,
                  similarity: r.similarity
                }));
                onOpenPdf(pdfFile, highlights);
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(42, 90, 138, 0.08) 0%, rgba(42, 90, 138, 0.04) 100%)',
                border: '1.5px solid rgba(42, 90, 138, 0.2)',
                borderRadius: '6px',
                padding: '0.75rem 1.25rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-accent)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(42, 90, 138, 0.12) 0%, rgba(42, 90, 138, 0.08) 100%)';
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 90, 138, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(42, 90, 138, 0.08) 0%, rgba(42, 90, 138, 0.04) 100%)';
                e.currentTarget.style.borderColor = 'rgba(42, 90, 138, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FileText size={16} />
              <span>View Source in PDF ({searchResults.results_count})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
