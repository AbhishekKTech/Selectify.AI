import { Button } from '@/components/ui/button'
import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs'

export default async function Home() {
  const get_user = await currentUser();
  
  return (
    <div className='min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-background flex flex-col justify-between antialiased transition-colors'>
        
        {/* Main Content Area - Centered Hero Section */}
        <div className='flex-grow flex items-center justify-center pt-20 pb-10'>
            <div className='flex flex-col items-center justify-center text-center gap-8 max-w-4xl px-8 w-full'>
              
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-2 shadow-sm">
                🚀 Welcome to the Future of Hiring
              </div>

              <h1 className='text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight'>
                Precise & Transparent <br/>
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500'>AI-Driven</span> Assessment.
              </h1>
              
              <p className='text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl'>
                Selectify.AI revolutionizes hiring by eliminating biases, ensuring fair assessments, and delivering transparent feedback for both companies and candidates.
              </p>
              
              <div className='mt-4'>
                <Button className='px-8 py-7 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all group' asChild>
                  <Link href={'/dashboard'}>
                    Let's Assess 
                    <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform'/>
                  </Link>
                </Button>
              </div>

            </div>
        </div>

        {/* Clean Footer */}
        <footer className='py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-card transition-colors'>
            <div className='max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 dark:text-slate-400'>
                <h2 className='text-sm font-medium'>© 2026 Selectify.AI | Developed by Abhishek Sharma</h2>
                <div className='flex flex-row gap-6 items-center'>
                  <Link href={'https://github.com/abhiwork8595-coder'} target="_blank" className='hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'><Github size={20}/></Link>
                  <Link href={'#'} className='hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'><Linkedin size={20}/></Link>
                  <Link href={'mailto:abhishek@example.com'} className='hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'><Mail size={20}/></Link>
                </div>
            </div>
        </footer>
    </div>
  )
}