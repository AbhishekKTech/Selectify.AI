import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// OpenAI SDK ko directly Groq ki API key aur baseURL par connect kiya hai
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: Request) {
  try {
    const blob = await request.blob();
    
    // File system (fs) ki bajaye directly memory mein Web API File object banaya.
    // Isse Next.js Edge functions ya Vercel deployment mein koi error nahi aayega.
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3', // Groq ka active audio model
    });

    return NextResponse.json({ answer: transcription.text });
  } catch (error) {
    console.error("Speech to Text Error:", error);
    return NextResponse.json({ answer: "" }); // Fallback taaki system crash na ho
  }
}