"use client";

import { Automated_Assess } from "@prisma/client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Link2, Check, Edit3 } from "lucide-react";
import { toast } from "sonner";
import NewAutomatedAssessment from "./NewAutomatedAssessment";

interface Props {
  autoAssess: Automated_Assess;
  userName: string | undefined | null;
}

export default function AutomatedAssessmentDisplay({ autoAssess, userName }: Props) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const wasUpdated = autoAssess.updatedAt > autoAssess.createdAt;
  const createdUpdatedAtTimestamp = (
    wasUpdated ? autoAssess.updatedAt : autoAssess.createdAt
  ).toDateString();

  const diflevel = (value: string) => {
    const intValue = parseInt(value, 10);
    switch (intValue) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Expert/Hard';
      default: return 'Intermediate';
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the edit dialog when clicking copy
    const inviteUrl = `${window.location.origin}/interview?id=${autoAssess.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Interview invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <Card 
        className="cursor-pointer border border-border bg-white dark:bg-card hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
        onClick={() => setShowEditDialog(true)}
      >
        <div>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                {autoAssess.name}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Created: {createdUpdatedAtTimestamp} {wasUpdated && "(updated)"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">
                Company: <span className="text-slate-900 dark:text-white font-normal">{autoAssess.companyName}</span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">
                Type: <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs font-medium">{autoAssess.jobtype}</span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">
                Difficulty: <span className="text-slate-900 dark:text-white font-normal">{diflevel(autoAssess.level)}</span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Sample Question:</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800 line-clamp-2">
                {autoAssess.questions[0] || "No questions added yet."}
              </p>
            </div>
          </CardContent>
        </div>

        <div className="p-4 pt-0 mt-3">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2 text-xs h-9 rounded-lg shadow-sm"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Link2 className="w-4 h-4" />}
            {copied ? "Link Copied!" : "Copy Invite Link"}
          </Button>
        </div>
      </Card>

      <NewAutomatedAssessment open={showEditDialog} setOpen={setShowEditDialog} toEdit={autoAssess} userName={userName}/>
    </>
  );
}