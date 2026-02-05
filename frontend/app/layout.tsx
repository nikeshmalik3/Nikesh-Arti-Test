import type { Metadata } from 'next'
import './globals.css'
import 'react-pdf-highlighter/dist/style.css'

export const metadata: Metadata = {
  title: 'EduAssist - AI Assistant for Educators',
  description: 'AI-powered assistant for creating educational content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
