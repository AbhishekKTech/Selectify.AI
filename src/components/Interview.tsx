"use client"
import React from 'react'
import { useEffect, useContext, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion } from 'ai/react';
import { useAudioRecorder } from 'react-audio-voice-recorder';
import { Assess } from '@prisma/client'
import { DialogHeader, Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneMissed, Bot, Clock, Activity, Signal, CheckCircle2, Disc, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

import * as cocossd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import { DetectedObject, ObjectDetection } from '@tensorflow-models/coco-ssd';
import { drawOnCanvas } from '../../utils/draw'

import Webcam from 'react-webcam';

type Props = {
  interviewInfo : Assess
}

const Interview = ({interviewInfo}: Props) => {
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [redo, setRedo] = useState(false);
  const [interviewerTalking, setInterviewerTalking] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);
  const [interviewTime, setInterviewTime] = useState(0);

  // UI States for bottom controls
  const [canSubmit, setCanSubmit] = useState(false); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);

  const router = useRouter();
  const speech = useRef<any | null>(null);
  const ready = useRef(false);

  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState(
    interviewInfo.questions.map(question => ({
      question,
      answer: "",
      isAI: true,
      strengths: [], 
      improvements: [],
    }))
  );
  
  const { complete } = useCompletion({
    api: '/api/generateQues',
    onFinish: (prompt, completion) => {
      textToSpeech(completion);
    },
  });

  const parseAudio = async (blob : Blob) => {
    try {
      const res = await fetch('/api/speechToText', {
        method: 'POST',
        body: blob,
      });

      const result = await res.json();
      console.log("🎤 Speech-to-Text Result:", result); 

      const newQuestions = questions.slice();
      newQuestions[questionsAnswered]['answer'] = (result.answer && result.answer.trim() !== "") 
        ? result.answer 
        : "The candidate remained silent or audio was unclear.";
        
      setQuestions(newQuestions);
      setQuestionsAnswered(questionsAnswered + 1);
    } catch (error) {
      console.error("Audio Parsing Failed:", error);
      const newQuestions = questions.slice();
      newQuestions[questionsAnswered]['answer'] = "The candidate remained silent or audio was unclear.";
      setQuestions(newQuestions);
      setQuestionsAnswered(questionsAnswered + 1);
    }
  };

  const askQuestion = () => {
    let requestBody: any = {};
    if (questionsAnswered == 0) {
      requestBody = {
        queryType: 'firstMessage',
        jobProfile: interviewInfo.jobProfile,
        companyName: interviewInfo.companyName,
        name: interviewInfo.name,
        question: questions[0].question,
      };
    } else if (questionsAnswered < interviewInfo.questions.length) {
      requestBody = {
        queryType: 'subsequentMessage',
        jobProfile: interviewInfo.jobProfile,
        companyName: interviewInfo.companyName,
        name: interviewInfo.name,
        question: questions[questionsAnswered].question,
        prevQuestion: questions[questionsAnswered - 1].question,
        prevAnswer: questions[questionsAnswered - 1].answer,
      };
    } else {
      requestBody = {
        queryType: 'lastMessage',
        jobProfile: interviewInfo.jobProfile,
        companyName: interviewInfo.companyName,
        name: interviewInfo.name,
        prevQuestion: questions[questionsAnswered - 1].question,
        prevAnswer: questions[questionsAnswered - 1].answer,
      };
    }
    complete(requestBody);
  };

  const textToSpeech = async (input: string) => {
    const utterance = new SpeechSynthesisUtterance(input);
    utterance.rate = 1.0; 

    utterance.onend = () => {
      setInterviewerTalking(false);
      
      if (questionsAnswered < interviewInfo.questions.length) {
        handleStartRecording();
        setQuestionDisplay(questions[questionsAnswered].question);
      } else {
        setInterviewComplete(true);
        // Automatically compile ONLY after the AI finishes speaking its final farewell message
        onSubmit(); 
      }
    };

    if (ready.current) {
      window.speechSynthesis.speak(utterance);
      setInterviewerTalking(true);
    } else {
      speech.current = utterance;
    }
  };

  const {
    startRecording: startAudioRec, stopRecording: stopAudioRec, recordingBlob,
    isRecording,
  } = useAudioRecorder({ noiseSuppression: true, echoCancellation: true });

  useEffect(() => {
    setQuestionDisplay('Hello! I am your AI Interviewer. Welcome to your session.');
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!modalOpen && !loading && !interviewComplete) {
      interval = setInterval(() => {
        setInterviewTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalOpen, loading, interviewComplete]);

  // Submission Delay Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (interviewerTalking) {
      setCanSubmit(false);
    } else if (isRecording) {
      timer = setTimeout(() => {
        setCanSubmit(true);
      }, 3500); 
    } else {
      setCanSubmit(false);
    }
    return () => clearTimeout(timer);
  }, [isRecording, interviewerTalking]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (!recordingBlob) return;
    if (redo) {
      setRedo(false);
      handleStartRecording();
      return;
    }
    parseAudio(recordingBlob);
  }, [recordingBlob]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      askQuestion();
    }, 1000); 
    return () => clearTimeout(timeoutId); 
  }, [questionsAnswered]);
  
  function delay(time : number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const onSubmit = async () => {
    window.speechSynthesis.cancel(); 
    try {
        setLoading(true);
        const sanitizedQuestions = questions.map(q => ({
          ...q,
          answer: q.answer || "The candidate did not provide an answer.",
        }));

        const response1 = await fetch("/api/generateQues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: {
              queryType: "overall",
              jobProfile: interviewInfo.jobProfile,
              companyName: interviewInfo.companyName,
              jobtype: interviewInfo.jobtype,
              jobRequirements: interviewInfo.jobRequirements,
              questions: sanitizedQuestions,
            },
          }),
        });
        
        const response2 = sanitizedQuestions.map((q) => {
          return fetch("/api/generateQues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: {
                queryType: "feedback",
                jobProfile: interviewInfo.jobProfile,
                companyName: interviewInfo.companyName,
                jobtype: interviewInfo.jobtype,
                jobRequirements: interviewInfo.jobRequirements,
                questions: [{ question: q.question, answer: q.answer }],
              },
            }),
          });
        });
        
        const response2Promise = await Promise.all(response2);
        
        const response3 = await fetch("/api/generateQues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: {
              queryType: "generateAnalytics",
              jobProfile: interviewInfo.jobProfile,
              companyName: interviewInfo.companyName,
              jobtype: interviewInfo.jobtype,
              jobRequirements: interviewInfo.jobRequirements,
              questions: sanitizedQuestions.map((q) => ({
                question: q.question, answer: q.answer,
              })),
            },
          }),
        });
        
        const overallData = await response1.json();
        const feedbackData = await Promise.all(response2Promise.map(async (resPromise) => {
          return await resPromise.json();
        }));        
        const analyticsData = await response3.json();

        const combinedQuestions = sanitizedQuestions.map((question, index) => ({
          ...question,
          ...feedbackData[index],
          strengths: feedbackData[index]?.strengths || [],
          improvements: feedbackData[index]?.improvements || [],
          isAI: true,
        }));

        const formattedAnalytics = analyticsData.interviewFeedbackAnalyticsRadar?.map((a: any) => ({
          parameter: a.parameter || "General",
          points: Number(a.points) || 0,
          maxPoints: Number(a.maxPoints) || 10,
        })) || [];

        const response = await fetch('/api/feedbackStore', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: interviewInfo.name,
            jobProfile: interviewInfo.jobProfile,
            companyName: interviewInfo.companyName,
            jobtype: interviewInfo.jobtype,
            jobRequirements: interviewInfo.jobRequirements,
            questions: combinedQuestions,
            level: String(interviewInfo.level), 
            overview: overallData.feedback || "No overview provided.", 
            analytics: formattedAnalytics, 
          }),
        });        
        
        if (response.ok) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const responseData = await response.json();
          const { results } = responseData;
          if (results.id) router.push(`/feedback?id=${results.id}`);
        } else {
           const errorData = await response.json();
           console.error("Backend Validation Error:", errorData);
           alert("Error submitting interview data.");
        }
      } catch (error) {
      console.error('Error submitting interview data:', error);
      alert("Error submitting interview data.");
    } finally {
      setLoading(false); 
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    ready.current = true;
    if (speech.current !== null) {
      delay(1000).then(() => {
        window.speechSynthesis.speak(speech.current);
        setInterviewerTalking(true);
      });
    }
  };

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<ObjectDetection>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(()=>{
    if(webcamRef && webcamRef.current){
      const stream = (webcamRef.current.video as any).captureStream();
      if(stream){
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {};
      }
    }
  },[])

  useEffect(()=>{
    initModel();
  },[])

  async function initModel(){
    try {
      const loadedModel: ObjectDetection = await cocossd.load({ base: 'mobilenet_v2' });
      setModel(loadedModel);
    } catch (error) {
      console.error("Failed to fetch camera model, ignoring to continue interview.", error);
    }
  }

  async function runPrediction(){
    if(model && webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4 && !isVideoOff) {
      const predictions: DetectedObject[] = await model.detect(webcamRef.current.video)
      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(true, predictions, canvasRef.current?.getContext('2d') as CanvasRenderingContext2D);
    }
  }

  useEffect(()=>{
    const predictionInterval = setInterval(()=>{ runPrediction() }, 100);
    return ()=> clearInterval(predictionInterval);
  },[webcamRef.current, model, isVideoOff])

  function handleStartRecording(){
    if (!isMuted) {
      startAudioRec();
    }
  }

  return (
      <>
        {/* Main Interface Wrapper */}
        <div className='flex flex-col h-[90vh] max-w-[1500px] mx-auto p-2 md:p-4 bg-[#f8f9fc] dark:bg-slate-950 font-sans'>
          
          {loading ? (
            <div className="fixed inset-0 bg-[#f8f9fc]/90 dark:bg-slate-950/90 z-50 flex items-center justify-center flex-col gap-6 backdrop-blur-sm">
              <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <p className="text-slate-800 dark:text-white text-3xl font-bold tracking-tight">Compiling Your Results...</p>
            </div>
          ):(
            <div className='flex flex-col h-full w-full gap-4'>
              
              {/* === Top Header === */}
              <div className="flex flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-3 md:px-5 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <h1 className="font-bold text-lg md:text-xl text-slate-800 dark:text-white flex items-center gap-3">
                    Virtual AI Interview
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                      Live
                    </span>
                  </h1>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium text-sm">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Interview Time
                    <span className="font-bold text-slate-800 dark:text-white ml-1">{formatTime(interviewTime)}</span>
                  </div>
                </div>
              </div>

              {/* === Video Panels Area === */}
              <div className='flex flex-col lg:flex-row flex-1 gap-6 items-center justify-center min-h-0 overflow-hidden py-1'>
                
                {/* 1. Interviewer Panel */}
                <div className={cn(
                  'flex flex-col bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[400px] shrink aspect-square shadow-sm overflow-hidden relative transition-all duration-500',
                  interviewerTalking ? 'ring-4 ring-indigo-500/50 border-indigo-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]' : 'border border-slate-200 dark:border-slate-800'
                )}>
                  {/* Panel Header */}
                  <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md absolute top-0 w-full transition-colors duration-300">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg transition-colors duration-300", interviewerTalking ? "bg-indigo-600" : "bg-indigo-100 dark:bg-indigo-900/50")}>
                        <Activity className={cn("w-4 h-4", interviewerTalking ? "text-white" : "text-indigo-600 dark:text-indigo-400")} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white text-sm md:text-base">AI HR Interviewer</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
                        AI Powered
                      </span>
                    </div>
                  </div>

                  {/* 3D Avatar Area */}
                  <div className="relative w-full h-full flex items-center justify-center bg-[#f0f4f8] dark:bg-slate-800 pt-12 pb-20">
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center shadow-inner relative z-10 transition-colors duration-500",
                      interviewerTalking ? "bg-indigo-200 dark:bg-indigo-900/70" : "bg-indigo-100 dark:bg-indigo-900/30"
                    )}>
                      <Bot className={cn("w-16 h-16 transition-colors duration-500", interviewerTalking ? "text-indigo-700 dark:text-indigo-300" : "text-indigo-600 dark:text-indigo-400")} />
                    </div>
                    
                    {/* Waveform Animation when Speaking */}
                    {interviewerTalking && (
                       <div className="absolute top-1/2 left-0 w-full flex justify-center gap-1.5 items-center opacity-60">
                         {[...Array(12)].map((_, i) => (
                           <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-pulse" 
                                style={{ height: `${Math.random() * 50 + 15}px`, animationDelay: `${i * 100}ms`, animationDuration: '0.8s' }}>
                           </div>
                         ))}
                       </div>
                    )}
                  </div>

                  {/* Caption Box - Text highlights when speaking */}
                  <div className={cn(
                    "absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 rounded-2xl shadow-lg border flex gap-3 items-start transform transition-all duration-300 z-20",
                    interviewerTalking ? "border-indigo-400 dark:border-indigo-500" : "border-slate-100 dark:border-slate-700"
                  )}>
                     <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl shrink-0 mt-0.5">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className={cn(
                         "text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300",
                         interviewerTalking ? "text-indigo-500" : "text-slate-400"
                       )}>AI Interviewer</span>
                       <p className={cn(
                         "text-sm font-medium leading-tight max-h-[70px] overflow-y-auto transition-colors duration-300",
                         interviewerTalking ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"
                       )}>
                         {questionDisplay}
                       </p>
                     </div>
                  </div>
                </div>
                
                {/* 2. Candidate Panel */}
                <div className={cn(
                  'flex flex-col bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[400px] shrink aspect-square shadow-sm overflow-hidden relative transition-all duration-500',
                  isRecording ? 'ring-4 ring-emerald-500/50 border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]' : 'border border-slate-200 dark:border-slate-800'
                )}>
                  {/* Panel Header */}
                  <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md absolute top-0 w-full transition-colors duration-300">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg transition-colors duration-300", isRecording ? "bg-emerald-500" : "bg-blue-100 dark:bg-blue-900/50")}>
                        <Activity className={cn("w-4 h-4", isRecording ? "text-white" : "text-blue-600 dark:text-blue-400")} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white text-sm md:text-base">Candidate</span>
                      <span className={cn(
                        "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-2 transition-colors duration-300",
                        isRecording ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "text-slate-500 bg-slate-100 dark:bg-slate-800"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isRecording ? "bg-emerald-500 animate-pulse" : "bg-slate-400")}></div>
                        {isRecording ? "Recording" : "Ready"}
                      </span>
                    </div>
                    <Signal className={cn("w-5 h-5 transition-colors duration-300", isRecording ? "text-emerald-500" : "text-slate-400")} />
                  </div>

                  {/* Webcam Area */}
                  <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800">
                    {!isVideoOff ? (
                      <>
                        <Webcam
                          ref={webcamRef}
                          mirrored={true}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          audio={false}
                        />
                        <canvas ref={canvasRef} className='absolute top-0 left-0 h-full w-full object-contain pointer-events-none'></canvas>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-4xl font-bold text-slate-500">
                          {interviewInfo.name.charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Candidate Name Overlay */}
                  <div className={cn(
                    'absolute bottom-4 left-4 px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-lg text-sm font-medium flex items-center gap-2 z-20 transition-colors duration-300 border',
                    isRecording ? 'border-emerald-500/50' : 'border-transparent'
                  )}>
                    {interviewInfo.name}
                    {isRecording && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1"></div>}
                  </div>
                </div>

              </div>

              {/* === Bottom Controls Area === */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-3 px-5 shadow-sm border border-slate-200 dark:border-slate-800 mt-2 gap-3">
                
                {/* Left: Actions (End Early) */}
                <div className="hidden md:flex w-1/3 justify-start">
                  <Button 
                    variant="outline"
                    className='h-11 px-5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 rounded-lg font-bold transition-all flex gap-2' 
                    onClick={() => {
                        stopAudioRec();
                        onSubmit();
                    }} 
                    type='button'
                  >
                    <PhoneMissed className="w-4 h-4" />
                    End Early
                  </Button>
                </div>

                {/* Center: Essential Tools (Mute, Video, Record) */}
                <div className="flex w-full md:w-1/3 justify-center gap-4">
                  <Button 
                    variant={isMuted ? "destructive" : "secondary"} 
                    className={cn("rounded-xl flex flex-col gap-1 h-auto py-2.5 px-5 w-16 sm:w-20 transition-all", !isMuted && "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700")}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span className="text-[10px] font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
                  </Button>

                  <Button 
                    variant={isVideoOff ? "destructive" : "secondary"} 
                    className={cn("rounded-xl flex flex-col gap-1 h-auto py-2.5 px-5 w-16 sm:w-20 transition-all", !isVideoOff && "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700")}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                    <span className="text-[10px] font-semibold">Video</span>
                  </Button>

                  <Button 
                    variant={isScreenRecording ? "destructive" : "secondary"} 
                    className={cn("rounded-xl flex flex-col gap-1 h-auto py-2.5 px-5 w-16 sm:w-20 transition-all", !isScreenRecording && "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700")}
                    onClick={() => setIsScreenRecording(!isScreenRecording)}
                  >
                    {isScreenRecording ? <StopCircle className="w-4 h-4" /> : <Disc className="w-4 h-4" />}
                    <span className="text-[10px] font-semibold">Record</span>
                  </Button>
                </div>

                {/* Right: Actions (Submit Answer) */}
                <div className="flex w-full md:w-1/3 justify-end gap-3">
                  {/* Mobile End Early Fallback */}
                  <Button 
                    variant="outline"
                    className='md:hidden h-11 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex gap-2' 
                    onClick={() => {
                        stopAudioRec();
                        onSubmit();
                    }} 
                    type='button'
                  >
                    <PhoneMissed className="w-4 h-4" />
                  </Button>

                  <Button 
                    className={cn(
                      'h-11 px-6 shadow-sm border-none rounded-lg font-bold transition-all duration-500 flex gap-2 w-full sm:w-auto text-sm',
                      canSubmit 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 grayscale cursor-not-allowed opacity-80'
                    )} 
                    onClick={() => {
                       if (!canSubmit) return;
                       
                       // Simply stop the audio, let the pipeline handle the final AI speech naturally
                       stopAudioRec();
                    }} 
                    disabled={!canSubmit}
                    type='button'
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {questionsAnswered === interviewInfo.questions.length - 1 ? 'Final Answer & Finish' : 'Submit Answer'}
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Info Modal */}
        <Dialog open={modalOpen}>
            <DialogContent className="sm:max-w-md rounded-3xl p-6">
              <DialogTitle className='text-2xl font-bold text-center text-slate-800 dark:text-white mb-2'>Virtual AI Interview</DialogTitle>
              <DialogHeader>
                <div className='flex flex-col gap-4 text-slate-600 dark:text-slate-300 text-sm'>
                  <p className="text-center font-medium">Welcome! The AI Interviewer will guide you through this session.</p>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-lg shrink-0">
                           <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>Ensure you are in a quiet environment and speak clearly.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg shrink-0">
                           <VideoIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Maintain eye contact with your camera while answering.</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-center font-semibold text-indigo-600 dark:text-indigo-400 mt-2">Best of luck!</p>
                </div>
              </DialogHeader> 
              <DialogFooter className="mt-6 sm:justify-center">
                <DialogClose asChild>
                  <Button className='w-full p-4 text-lg font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all' onClick={closeModal}>
                      Start Interview
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
  );
  
  function resizeCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, webcamRef: React.RefObject<Webcam>) {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if((canvas && video)){
      const {videoWidth, videoHeight} = video
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }
}

export default Interview