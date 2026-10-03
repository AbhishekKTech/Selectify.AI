import OpenAI from 'openai';

// Same setup: OpenAI SDK pointed to Groq
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const mp3 = await openai.audio.speech.create({
      // Groq par hosted Canopy Labs ka exact Orpheus model 
      model: 'canopylabs/orpheus-v1-english',
      
      // 'as any' lagane se TypeScript ki red line gayab ho jayegi
      voice: 'autumn' as any, 
      
      input: body.text,
    });
    
    const audioData = await mp3.arrayBuffer();

    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error("Text to Speech Error:", error);
    return new Response("Error generating speech", { status: 500 });
  }
}