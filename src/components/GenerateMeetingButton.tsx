"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function GenerateMeetingButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = () => {
    setIsGenerating(true);
    const generateSegment = () => Math.random().toString(36).substring(2, 5);
    
    // EXPIRY LOGIC: Set the meeting to expire 2 hours from right now
    const expiryTimestamp = Date.now() + 2 * 60 * 60 * 1000; 
    
    // The ID now looks like: abc-def-ghi-1715000000000
    const newMeetingId = `${generateSegment()}-${generateSegment()}-${generateSegment()}-${expiryTimestamp}`;
    
    router.push(`/live/${newMeetingId}`);
  };

  return (
    <Button 
      variant="outline" 
      className="w-fit mt-2 border-slate-200" 
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {isGenerating ? "Creating Room..." : "Generate Meeting ID"}
    </Button>
  )
}