"use client"
import React from 'react'
import { Button } from './ui/button'
import { Themetoggle } from './ui/Themetoggle'
import Logo from './Logo'
import { UserButton } from '@clerk/nextjs'
import { Briefcase, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  userId : string | null
}  

const NavHeader = ({userId}: Props) => {
  const pathname = usePathname();

  return (
    <header className='sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border mx-auto transition-all duration-300'>
      <nav className='flex max-w-7xl w-full flex-col sm:flex-row items-center justify-between p-4 px-8 mx-auto'>
        <Logo/>
        
        <div className='flex items-center space-x-6'>
          {userId && (
            <div className='flex flex-row gap-4 items-center justify-center border-r border-border pr-6'> 
              
              {/* Premium Mode Switcher */}
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                    pathname === '/dashboard'
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <User className="w-4 h-4 mr-2" />
                  Candidate
                </Link>

                <Link
                  href="/dashboard_interviewer"
                  className={cn(
                    "flex items-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                    pathname === '/dashboard_interviewer'
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Recruiter
                </Link>
              </div>

              <div className="ml-2 flex items-center">
                <UserButton afterSignOutUrl='/' appearance={{elements:{avatarBox:{width:'2.5rem', height:"2.5rem"}}}}/>
              </div>

            </div>
          )}
          <Themetoggle/>
        </div>
      </nav>
    </header>
  )
}

export default NavHeader