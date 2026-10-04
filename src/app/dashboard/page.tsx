import { auth, currentUser } from "@clerk/nextjs";
import { Metadata } from "next";
import React from 'react';
import prisma from "@/lib/db";
import AssessmentDisplay from "@/components/AssessmentDisplay";
import AssessButton from "@/components/AssessButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, LayoutDashboard, SearchCheck, Trophy, User as UserIcon, Video, Target, Activity } from "lucide-react";
import IssueChart from "@/components/IssueChart";
import Calendar from "@/components/Calender";
import { Button } from "@/components/ui/button";
import JoinMeetingButton from "@/components/JoinMeetingButton";

export const metadata: Metadata = {
  title: 'Dashboard | Selectify.AI'
}

const Dashboard = async () => {
  const { userId } = auth();
  if (!userId) throw Error("userId undefined");

  // Replaced slow network call with cached session user data
  const user = await currentUser();
  const userName = user?.firstName || 'Candidate';
  
  const EveryAssessment = await prisma.assess.findMany({ where: { userId } });
  const EveryResult = await prisma.result.findMany({  
    where: { userId },
    include: {
      questions: {
        include: {
          strengths: true,
          improvements: true,
        },
      },
      analytics: true,
    }, 
  });
  
  const level = (num: string) => {
    if(num === '1') return 'Beginner'
    if (num === '2') return 'Intermediate'
    return 'Expert' 
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] w-full bg-slate-50 dark:bg-background">
      
      {/* Premium Sticky Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white dark:bg-card border-r border-border px-6 py-8 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-4 px-2">Menu</h2>
            <nav className="space-y-3">
              <a href="#overview" className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium shadow-md shadow-indigo-200 dark:shadow-none transition-all">
                <LayoutDashboard className="w-5 h-5" /> Overview
              </a>
              <a href="#interviews" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl font-medium transition-all group">
                <Video className="w-5 h-5 group-hover:scale-110 transition-transform" /> My Interviews
              </a>
              <a href="#analytics" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl font-medium transition-all group">
                <SearchCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Analytics
              </a>
              <a href="#performance" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl font-medium transition-all group">
                <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" /> Performance
              </a>
            </nav>
          </div>
          
          <div>
            <h2 className="text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-4 px-2">Assessments</h2>
            <nav className="space-y-3">
              <div className="px-2">
                <AssessButton />
              </div>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth p-6 md:p-10 space-y-10">
        
        {/* TOP SECTION: Overview */}
        <div id="overview" className="flex flex-col gap-1 scroll-mt-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Welcome back, {userName} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500">Track your interview progress and practice new skills.</p>
        </div>

        {/* Actions Grid (Primary View) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 w-fit rounded-lg">
              <Video className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Join Your Interview</h2>
            <p className="text-slate-500 text-sm flex-1">Seize your opportunity! Join your interview seamlessly by using the provided meeting ID as a candidate.</p>
            <JoinMeetingButton />
          </div>
          
          <div className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 w-fit rounded-lg">
              <UserIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Self Assessment</h2>
            <p className="text-slate-500 text-sm flex-1">Improve your skills, build your personalized interview environment and receive AI feedback with analytics.</p>
            <div className="mt-2"><AssessButton/></div>
          </div>
        </div>

        {/* --- SCROLL TARGET: My Interviews --- */}
        <div id="interviews" className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm scroll-mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Target className="w-5 h-5 text-indigo-600"/> My Pending Interviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EveryAssessment.length === 0 ? (
              <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <p className="text-slate-500 dark:text-slate-400">No pending assessments found. Click "New Assessment" to create one!</p>
              </div>
            ) : (
              EveryAssessment.map((assessment: any) => (
                <div key={assessment.id} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1" title={assessment.jobProfile}>{assessment.jobProfile}</h3>
                      <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                        {assessment.questions.length} Qs
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 font-medium">{assessment.companyName}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-border">
                      {level(assessment.level)}
                    </span>
                    <Link href={`/interview?id=${assessment.id}`}>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        Start Interview
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- SCROLL TARGET: Performance --- */}
        <div id="performance" className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm scroll-mt-8">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
             <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Activity className="w-5 h-5 text-indigo-600"/> Activity & Performance Tracking
             </h2>
             <p className="text-sm text-slate-500 mt-1 sm:mt-0">Overview of your interview consistency.</p>
           </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center overflow-hidden">
              <div className="w-full max-w-full overflow-x-auto transform scale-90 sm:scale-100 origin-center flex justify-center">
                <Calendar EveryResolve={EveryResult} EveryAssessment={EveryAssessment} EveryAutoAssessment={[]}/>
              </div>
            </div>
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center overflow-hidden">
              <div className="w-full max-w-full overflow-x-auto transform scale-90 sm:scale-100 origin-center flex justify-center">
                <IssueChart EveryResolve={EveryResult} EveryAssessment={EveryAssessment} EveryAutoAssessment={[]}/>
              </div>
            </div>
          </div>
        </div>

        {/* --- SCROLL TARGET: Analytics --- */}
        <div id="analytics" className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm scroll-mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <BookOpenCheck className="w-5 h-5 text-indigo-600"/> Results of Self Assessment
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Company</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Job Profile</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Level</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Date</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-right">Analytics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EveryResult.map((result) => (
                  <TableRow key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{result.companyName}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{result.jobProfile}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{level(result.level)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{result.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`feedback?id=${result.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium">
                        View Feedback <ArrowRight className="ml-1 w-4 h-4"/>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {EveryResult.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">No results generated yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

      </main>
    </div>
  )
}

export default Dashboard;