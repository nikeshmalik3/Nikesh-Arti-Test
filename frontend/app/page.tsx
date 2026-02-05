'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import SavedObjectivesPanel from '@/components/SavedObjectivesPanel';
import { Message } from '@/lib/types';

// Dynamically import PDFViewer to avoid SSR issues with PDF.js
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f4f2',
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-ink-light)'
    }}>
      Loading PDF viewer...
    </div>
  )
});

interface Session {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Good morning. I'm EduAssist, here to help you create educational materials. I can search through our document library, generate learning objectives, and save your work.\n\nWhat would you like to develop today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // PDF Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<{
    file: string;
    highlights: Array<{ content: string; chunk_index: number; similarity: number }>;
  } | null>(null);

  // Load sessions from database
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sessions`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      const data = await response.json();
      if (data.sessions) {
        setSessions(data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title,
          timestamp: new Date(s.updated_at),
          messages: s.messages || []
        })));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Save current session to database
  // DISABLED - CORS/network issue with sessions endpoint
  // TODO: Debug CORS configuration on sessions function
  // useEffect(() => {
  //   if (messages.length > 1 && currentSessionId) {
  //     saveSession();
  //   }
  // }, [messages]);

  const saveSession = async () => {
    if (!currentSessionId) return;

    try {
      // Generate simple title from first user message
      let title = 'New Conversation';
      if (messages[1]?.content) {
        const words = messages[1].content.split(' ').slice(0, 5).join(' ');
        title = words.length < messages[1].content.length ? words + '...' : words;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Debug: Check if env vars are loaded
      if (!supabaseUrl || !supabaseKey) {
        console.error('Environment variables not loaded:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/sessions/${currentSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ title, messages })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Session save failed:', response.status, errorText);
        return;
      }

      // Update local state
      const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
      if (sessionIndex >= 0) {
        const updatedSessions = [...sessions];
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          messages,
          title,
          timestamp: new Date()
        };
        setSessions(updatedSessions);
      }
    } catch (error) {
      console.error('Error saving session:', error);
      // Don't throw - just log and continue
    }
  };

  const handleNewChat = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const initialMessages: Message[] = [{
        role: 'assistant' as const,
        content: "Good morning. I'm EduAssist, here to help you create educational materials. I can search through our document library, generate learning objectives, and save your work.\n\nWhat would you like to develop today?"
      }];

      const response = await fetch(`${supabaseUrl}/functions/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          title: 'New conversation',
          messages: initialMessages
        })
      });

      const data = await response.json();
      if (data.session) {
        const newSession: Session = {
          id: data.session.id,
          title: data.session.title,
          timestamp: new Date(data.session.created_at),
          messages: initialMessages
        };
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setMessages(initialMessages);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sessions/${id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      const data = await response.json();
      if (data.session) {
        setCurrentSessionId(id);
        setMessages(data.session.messages || []);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      await fetch(`${supabaseUrl}/functions/v1/sessions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });

      const updatedSessions = sessions.filter(s => s.id !== id);
      setSessions(updatedSessions);

      if (id === currentSessionId) {
        await handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Initialize first session
  useEffect(() => {
    if (!currentSessionId) {
      handleNewChat();
    }
  }, []);

  const [loadingStage, setLoadingStage] = useState<string>('');

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setLoadingStage('analyzing');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let accumulatedContent = '';
      let parts: any = null;
      let functionCalls: any[] = [];

      // Add empty assistant message
      const assistantMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        parts: null,
        function_calls: []
      }]);

      if (reader) {
        let eventType = '';
        let buffer = ''; // Buffer for incomplete lines

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue; // Skip empty lines

            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              try {
                const dataStr = line.substring(5).trim();
                if (!dataStr) continue;

                const data = JSON.parse(dataStr);

                if (eventType === 'status') {
                  setLoadingStage(data.stage);
                } else if (eventType === 'content') {
                  accumulatedContent += data.text;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      ...updated[assistantMessageIndex],
                      content: accumulatedContent
                    };
                    return updated;
                  });
                } else if (eventType === 'done') {
                  parts = data.parts;
                  functionCalls = data.function_calls || [];
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      ...updated[assistantMessageIndex],
                      parts: parts,
                      function_calls: functionCalls
                    };
                    return updated;
                  });
                  setIsLoading(false);
                } else if (eventType === 'error') {
                  throw new Error(data.message);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e, 'Line:', line);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      background: 'var(--color-paper)',
      position: 'relative'
    }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        marginLeft: sidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Chat Section */}
        <div style={{
          width: pdfViewerOpen ? '50%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}>
          <header style={{
            borderBottom: '1px solid var(--color-border)',
            padding: '1.5rem 2rem',
            background: 'var(--color-paper)',
            flexShrink: 0
          }}>
            <div style={{
              maxWidth: pdfViewerOpen ? 'none' : '900px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'baseline',
              gap: '1rem'
            }}>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--color-ink)',
                letterSpacing: '-0.02em'
              }}>
                EduAssist
              </h1>
              <span style={{
                fontSize: '0.875rem',
                color: 'var(--color-ink-light)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 400
              }}>
                Educational Content Assistant
              </span>
            </div>
          </header>

          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            loadingStage={loadingStage}
            onOpenPdf={(pdfFile, highlights) => {
              setCurrentPdf({ file: pdfFile, highlights });
              setPdfViewerOpen(true);
            }}
          />
        </div>

        {/* PDF Viewer Section */}
        {pdfViewerOpen && currentPdf && (
          <div style={{
            width: '50%',
            height: '100vh',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
            <PDFViewer
              pdfFile={currentPdf.file}
              highlights={currentPdf.highlights}
              onClose={() => {
                setPdfViewerOpen(false);
                setCurrentPdf(null);
              }}
            />
          </div>
        )}

        {/* Saved Objectives Panel */}
        <div style={{
          width: savedPanelOpen ? '320px' : '0',
          height: '100vh',
          background: 'var(--color-paper)',
          borderLeft: savedPanelOpen ? '1px solid var(--color-border)' : 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {savedPanelOpen && <SavedObjectivesPanel />}
        </div>

        {/* Toggle Button for Saved Panel */}
        <button
          onClick={() => setSavedPanelOpen(!savedPanelOpen)}
          style={{
            position: 'fixed',
            top: '50%',
            right: savedPanelOpen ? '320px' : '0',
            transform: 'translateY(-50%)',
            padding: '1rem 0.5rem',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px 0 0 6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            boxShadow: '-2px 0 8px rgba(42, 90, 138, 0.15)',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease',
            zIndex: 100
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-accent)';
          }}
        >
          {savedPanelOpen ? 'Hide Saved ›' : '‹ Saved'}
        </button>
      </div>
    </main>
  );
}
