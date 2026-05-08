import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlatLay Pro — Goodie Bag Layout Studio',
  description: 'Create beautiful flat lay product photos for your goodie bag business',
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
