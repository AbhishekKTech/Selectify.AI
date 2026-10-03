import Interview from "@/components/Interview";
import React from "react";
import prisma from "@/lib/db";

export default async function InterviewPage ({ searchParams }: {
  searchParams: {
    id: string;
  }
}) {
  const { id } = searchParams;
  console.log("Fetching interview ID:", id);

  // 1. First, check if it's a candidate's self-assessment
  let interviewInfo = await prisma.assess.findUnique({ where: { id } });

  // 2. If not found, check if it's a Recruiter's Automated Assessment (Shared Link)
  if (!interviewInfo) {
    const autoAssess = await prisma.automated_Assess.findUnique({ where: { id } });
    
    if (autoAssess) {
      // Map Automated Assessment structure to match what the Interview component expects
      interviewInfo = {
        id: autoAssess.id,
        userId: autoAssess.userId,
        name: autoAssess.name, // Will act as the assessment/candidate context title
        jobProfile: autoAssess.jobProfile,
        jobtype: autoAssess.jobtype,
        companyName: autoAssess.companyName,
        jobRequirements: autoAssess.jobRequirements,
        level: autoAssess.level,
        questions: autoAssess.questions,
        createdAt: autoAssess.createdAt,
        updatedAt: autoAssess.updatedAt,
      };
    }
  }

  if (!interviewInfo) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-rose-500">Interview Not Found</h1>
          <p className="text-slate-400">The interview link may be invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Interview interviewInfo={interviewInfo} />
    </div>
  );
}