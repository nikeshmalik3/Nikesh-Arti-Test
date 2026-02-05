import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import MessageList from './MessageList';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  loadingStage?: string;
  onOpenPdf?: (pdfFile: string, highlights: Array<{ content: string; chunk_index: number; similarity: number }>) => void;
}

export default function ChatInterface({ messages, onSendMessage, isLoading, loadingStage, onOpenPdf }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '900px',
      margin: '0 auto',
      width: '100%',
      padding: '0 2rem',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      <MessageList messages={messages} isLoading={isLoading} loadingStage={loadingStage} onOpenPdf={onOpenPdf} />

      <form onSubmit={handleSubmit} style={{
        padding: '1.5rem 0',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you'd like to create..."
              disabled={isLoading}
              rows={1}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: '1rem',
                fontFamily: 'var(--font-serif)',
                resize: 'none',
                outline: 'none',
                background: 'white',
                color: 'var(--color-ink)',
                transition: 'border-color 0.2s ease',
                minHeight: '48px',
                maxHeight: '200px',
                lineHeight: 1.5
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '0.875rem 1.75rem',
              backgroundColor: isLoading || !input.trim() ? 'var(--color-border)' : 'var(--color-accent)',
              color: isLoading || !input.trim() ? 'var(--color-ink-light)' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.9375rem',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              letterSpacing: '0.01em',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && input.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--color-accent-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && input.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--color-accent)';
              }
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p style={{
          marginTop: '0.75rem',
          fontSize: '0.8125rem',
          color: 'var(--color-ink-light)',
          fontFamily: 'var(--font-sans)',
          fontStyle: 'italic'
        }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
