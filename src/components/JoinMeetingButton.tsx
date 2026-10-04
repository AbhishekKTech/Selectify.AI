"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { useRouter } from 'next/navigation'
import { Video } from 'lucide-react'

export default function JoinMeetingButton() {
  const [open, setOpen] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId.trim()) return;
    
    // Clean up the input in case they pasted a full URL instead of just the ID
    const cleanId = meetingId.split('/').pop()?.trim();
    
    setOpen(false);
    router.push(`/live/${cleanId}`);
  };

  return (
    <>
      <Button variant="outline" className="w-fit mt-2 border-slate-200" onClick={() => setOpen(true)}>
        Enter Meeting ID
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              Join Live Interview
            </DialogTitle>
            <DialogDescription>
              Enter the meeting ID provided by your recruiter to join the live video session.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleJoin} className="space-y-4 pt-4">
            <Input 
              placeholder="e.g. abc-123-xyz" 
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!meetingId.trim()}>
                Join Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}