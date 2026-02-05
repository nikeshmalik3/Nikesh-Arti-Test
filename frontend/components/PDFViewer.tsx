'use client';

import { useState, useRef } from 'react';
import { PdfLoader, PdfHighlighter, Highlight, AreaHighlight, Popup, IHighlight } from 'react-pdf-highlighter';
import type { ScaledPosition } from 'react-pdf-highlighter';
import { X } from 'lucide-react';

interface HighlightData {
  content: string;
  chunk_index: number;
  similarity: number;
}

interface PDFViewerProps {
  pdfFile: string;
  highlights: HighlightData[];
  onClose: () => void;
}

export default function PDFViewer({ pdfFile, highlights, onClose }: PDFViewerProps) {
  const [pdfHighlights, setPdfHighlights] = useState<IHighlight[]>([]);
  const pdfUrl = `/documents/${pdfFile}`;

  // Generate placeholder highlights (we can't know exact positions without text search)
  const generateHighlights = (): IHighlight[] => {
    return highlights.map((h, idx) => ({
      id: `highlight-${idx}`,
      content: {
        text: h.content
      },
      comment: {
        text: `Relevance: ${Math.round(h.similarity * 100)}%`,
        emoji: ''
      },
      position: {
        boundingRect: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          width: 0,
          height: 0,
          pageNumber: Math.floor(h.chunk_index / 2.5) + 1
        },
        rects: [],
        pageNumber: Math.floor(h.chunk_index / 2.5) + 1
      }
    }));
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f5f4f2',
      borderLeft: '1px solid var(--color-border)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10
      }}>
        <div>
          <div style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
            marginBottom: '0.25rem'
          }}>
            {pdfFile}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-ink-light)',
            fontFamily: 'var(--font-sans)'
          }}>
            {highlights.length} passage{highlights.length !== 1 ? 's' : ''} referenced
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-ink-light)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.color = 'var(--color-ink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--color-ink-light)';
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* PDF Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative'
      }}>
        <PdfLoader url={pdfUrl} beforeLoad={<div>Loading PDF...</div>}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => false}
              onScrollChange={() => {}}
              scrollRef={(scrollTo) => {}}
              highlights={generateHighlights()}
              onSelectionFinished={() => null}
            >
              <div>
                {/* Custom highlight rendering */}
                {generateHighlights().map((highlight) => (
                  <div key={highlight.id}>
                    <Highlight
                      position={highlight.position}
                      comment={highlight.comment}
                      isScrolledTo={false}
                    />
                  </div>
                ))}
              </div>
            </PdfHighlighter>
          )}
        </PdfLoader>
      </div>

      {/* Highlights Info */}
      {highlights.length > 0 && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'var(--color-paper)',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            marginBottom: '0.5rem'
          }}>
            Referenced Passages:
          </div>
          {highlights.slice(0, 3).map((highlight, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-ink-light)',
                fontFamily: 'var(--font-sans)',
                marginBottom: '0.25rem',
                paddingLeft: '0.5rem',
                borderLeft: '2px solid var(--color-accent)'
              }}
            >
              "{highlight.content.substring(0, 100)}..."
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
