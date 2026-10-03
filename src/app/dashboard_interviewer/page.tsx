import { auth, clerkClient } from "@clerk/nextjs";
import React from 'react';
import prisma from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Briefcase, LayoutDashboard, PlusCircle, Text, Video, Users } from "lucide-react";
import AutomatedAssessmentButton from "@/components/AutomatedAssessButton";
import AutomatedAssessmentDisplay from "@/components/AutomatedAssessmentDisplay";
import InputImg from "@/components/InputImg";
import InputPdf from "@/components/InputPdf";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: 'Recruiter Dashboard | Selectify.AI'
}

const InterviewerDashboard = async () => {
  const { userId } = auth();
  if (!userId) throw Error("userId undefined");

  // Fetch only the current user for better performance
  const currentUser = await clerkClient.users.getUser(userId);
  const userName = currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : 'Recruiter';
  
  const EveryAssessment = await prisma.automated_Assess.findMany({ where: { userId } });
  
  const level = (num: string) => {
    if(num === '1') return 'Beginner'
    if (num === '2') return 'Intermediate'
    return 'Expert' 
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] w-full bg-slate-50 dark:bg-background">
      
      {/* Premium Sticky Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-72 flex-col bg-white dark:bg-card border-r border-border px-6 py-8 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
        <div className="px-2">
          <h2 className="text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-4">Workspace</h2>
          <nav className="space-y-3">
            {/* Changed to native <a> tags for smooth internal scrolling inside overflow container */}
            <a href="#overview" className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium shadow-md shadow-indigo-200 dark:shadow-none transition-all">
              <LayoutDashboard className="w-5 h-5" /> Overview
            </a>
            <a href="#create" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl font-medium transition-all group">
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Host Assessment
            </a>
            <a href="#manage" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl font-medium transition-all group">
              <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform" /> Active Jobs
            </a>
            <a href="#rankings" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl font-medium transition-all group">
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" /> Candidates
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth p-6 md:p-10 space-y-10">
        
        {/* TOP SECTION: Overview */}
        <div id="overview" className="flex flex-col gap-1 scroll-mt-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Welcome back, {userName} <span className="text-2xl">🚀</span>
          </h1>
          <p className="text-slate-500">Manage your active job postings and review candidate rankings.</p>
        </div>

        {/* --- SCROLL TARGET: Host Assessment --- */}
        <div id="create" className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-8">
          
          <div className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 w-fit rounded-lg">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Host Automated Assessment</h2>
            <p className="text-slate-500 text-sm flex-1">Find the right candidate out of millions. Host an automated interview and receive AI analytics to make evidence-based hiring choices.</p>
            <div className="mt-2"><AutomatedAssessmentButton userName={userName}/></div>
          </div>

          <div className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 w-fit rounded-lg">
              <Video className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create/Join Live Interview</h2>
            <p className="text-slate-500 text-sm flex-1">Empower candidates by furnishing a meeting ID for a seamless 1-on-1 live interview experience.</p>
            <Button variant="outline" className="w-fit mt-2 border-slate-200">Generate Meeting ID</Button>
          </div>

        </div>

        {/* Context Extraction */}
        <div className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Text className="w-5 h-5 text-indigo-600"/> Context Extraction (Job Descriptions)
          </h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <InputImg/>
            <InputPdf/>
          </div>
        </div>

        {/* --- SCROLL TARGET: Active Jobs (Manage) --- */}
        <div id="manage" className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm scroll-mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Briefcase className="w-5 h-5 text-indigo-600"/> My Active Assessments
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Company</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Job Profile</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Job Type</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Level</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Date Created</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-right">Analytics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EveryAssessment.map((result) => (
                  <TableRow key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{result.companyName}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{result.jobProfile}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">{result.jobtype}</span>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{level(result.level)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{result.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/rankedAssessments`} className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 dark:bg-slate-800 px-3 py-1.5 rounded-md">
                        Rankings <ArrowRight className="ml-1 w-4 h-4"/>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {EveryAssessment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">You haven't hosted any assessments yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* --- SCROLL TARGET: Candidates (Rankings/Cards) --- */}
        <div id="rankings" className="bg-white dark:bg-card border border-border p-6 rounded-xl shadow-sm scroll-mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <BookOpenCheck className="w-5 h-5 text-indigo-600"/> Assessment Details
          </h2>
          <div className="grid gap-6 place-content-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {EveryAssessment.map((assessment) => (
              <AutomatedAssessmentDisplay autoAssess={assessment} key={assessment.id} userName={userName}/>
            ))}
            {EveryAssessment.length === 0 && (
              <p className="text-slate-500 text-sm">Create an assessment to see detailed cards here.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

export default InterviewerDashboard