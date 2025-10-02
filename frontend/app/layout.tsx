import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastContainer from '@/components/Toast'
import { AuthProvider } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DocuMind AI - Intelligent Document Processing',
  description: 'AI-powered document reading and analysis service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          <ToastContainer />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
