import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartPoll - 智能投票',
  description: '公平、透明的团队投票系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-poll-dark min-h-screen text-white antialiased">
        <div className="fixed inset-0 bg-gradient-to-br from-poll-dark via-[#16162a] to-[#1a1a35] -z-10" />
        <div className="fixed inset-0 opacity-30 -z-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.06) 0%, transparent 40%),
                           radial-gradient(circle at 40% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 40%)`
        }} />
        {children}
      </body>
    </html>
  )
}
