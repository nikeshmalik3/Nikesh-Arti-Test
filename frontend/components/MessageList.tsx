'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '@/lib/types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  loadingStage?: string;
  onOpenPdf?: (pdfFile: string, highlights: Array<{ content: string; chunk_index: number; similarity: number }>) => void;
}

export default function MessageList({ messages, isLoading, loadingStage, onOpenPdf }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Real loading statuses based on actual backend processing
  const loadingStatuses: Record<string, { title: string; subtitle: string; icon: string }> = {
    'analyzing': { title: 'Analyzing Request', subtitle: 'Understanding your question...', icon: '🔍' },
    'searching': { title: 'Searching Knowledge Base', subtitle: 'Finding relevant sources...', icon: '📚' },
    'retrieving': { title: 'Retrieving Content', subtitle: 'Analyzing document passages...', icon: '📄' },
    'generating': { title: 'Generating Response', subtitle: 'Creating learning objectives...', icon: '✨' },
    'finalizing': { title: 'Finalizing', subtitle: 'Preparing your response...', icon: '🎯' },
    'saving': { title: 'Saving', subtitle: 'Storing content...', icon: '💾' },
    'processing': { title: 'Processing', subtitle: 'Working on your request...', icon: '⚙️' }
  };

  const currentStatus = loadingStatuses[loadingStage || 'analyzing'] || loadingStatuses['analyzing'];

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '2rem 0',
      minHeight: 0
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        {messages.map((message, index) => (
          <MessageItem
            key={index}
            message={message}
            index={index}
            onOpenPdf={onOpenPdf}
          />
        ))}

        {isLoading && (
          <div style={{
            padding: '1.5rem 0',
            opacity: 0,
            animation: 'fadeInUp 0.4s ease-out 0.1s forwards'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.875rem',
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(42, 90, 138, 0.04) 0%, rgba(90, 122, 42, 0.04) 100%)',
              border: '1px solid rgba(42, 90, 138, 0.15)',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated progress bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                width: '100%',
                background: 'rgba(42, 90, 138, 0.1)'
              }}>
                <div style={{
                  height: '100%',
                  width: '30%',
                  background: 'linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-light) 100%)',
                  animation: 'slideProgress 2s ease-in-out infinite'
                }} />
              </div>

              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '3px solid rgba(42, 90, 138, 0.1)',
                borderTopColor: 'var(--color-accent)',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                  marginBottom: '0.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>{currentStatus.icon}</span>
                  <span style={{
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}>
                    {currentStatus.title}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-ink-light)',
                  fontFamily: 'var(--font-sans)',
                  animation: 'fadeIn 0.3s ease-in-out'
                }}>
                  {currentStatus.subtitle}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
