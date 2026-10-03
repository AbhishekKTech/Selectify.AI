// src/app/layout.tsx
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import NavHeader from '@/components/NavHeader';
import { ClerkProvider, auth } from "@clerk/nextjs"
import { neobrutalism } from '@clerk/themes';
import { Toaster } from "@/components/ui/sonner"

const lexend = Lexend({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Selectify.AI',
  description: 'AI-Driven Recruitment & Assessment Automation Platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {userId} = auth();
  return (
    <ClerkProvider appearance={{
      signIn: { baseTheme: neobrutalism },
    }}>
      <html lang="en" suppressHydrationWarning={true}>
        <body 
          className={cn(
            lexend.className, 
            'antialiased min-h-screen bg-background text-foreground border-none outline-none', 
            'scrollbar scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent'
          )} 
          suppressHydrationWarning={true}
        >
          {/* Changed defaultTheme to system and enableSystem to true */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            <NavHeader userId={userId}/>
            {children}
            <Toaster/>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}