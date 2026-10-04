"use client";
import React, { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useRouter } from 'next/navigation';
import { Loader2, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

interface MeetingRoomProps {
  roomId: string;
  userName: string;
  isRecruiter: boolean;
}

export default function MeetingRoom({ roomId, userName, isRecruiter }: MeetingRoomProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950">
      
      {/* Only show the Copy ID Header to Recruiters */}
      {isRecruiter && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-10 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span> Live
            </div>
            <span className="font-medium text-slate-200 hidden sm:block">Interview Room</span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
            <span className="text-sm text-slate-400 hidden sm:block">Meeting ID:</span>
            <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-200">{roomId}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 ml-2 hover:bg-slate-800 rounded-full" 
              onClick={copyToClipboard}
              title="Copy Meeting ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            </Button>
          </div>
        </div>
      )}

      {/* Jitsi Video Area */}
      <div className="flex-1 relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`SelectifyAI-Live-${roomId}`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          }}
          userInfo={{
            displayName: userName
          }}
          onApiReady={(externalApi) => {
            externalApi.addListener('readyToClose', () => {
              router.push(isRecruiter ? '/dashboard_interviewer' : '/dashboard');
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
          spinner={() => (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="font-medium text-slate-300">Connecting to secure interview room...</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}