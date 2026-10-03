import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const runtime = "edge";

const diflevel = (value: string) => {
  const intValue = parseInt(value, 10);
  switch (intValue) {
    case 1: return "Beginner";
    case 2: return "Intermediate";
    case 3: return "Expert/Hard";
    default: return "Beginner";
  }
};

// ================= THE SMART FLOW PROMPTS =================

const firstMessageContext = `You are a Senior Tech Lead starting an interview.
Company: *insert_company_here*
Role: *insert_job_here*
Candidate Name: *insert_name_here*

INSTRUCTIONS:
1. Greet the candidate warmly by name.
2. Briefly welcome them to the company for the role.
3. DO NOT ask any technical questions yet.
4. Ask the candidate to introduce themselves using the exact text provided below.
5. Output ONLY the spoken text without stage directions.

Question to ask: `;

const subsequentMessageContext = `You are a Senior Tech Lead conducting an interview.
Company: *insert_company_here*
Role: *insert_job_here*
Candidate Name: *insert_name_here*

INSTRUCTIONS:
1. You MUST acknowledge the candidate's previous answer.
2. DYNAMIC BRIDGE: Pick a specific skill or keyword from their previous answer (especially if it was their introduction) and use it to transition naturally into the next question. Example: "It's great that you have experience with [Skill]..."
3. Do NOT use robotic fillers like 'Moving on' or 'Next'. Keep it conversational.
4. You MUST ask the NEXT QUESTION provided below exactly as it is.
5. Output ONLY the spoken text.

NEXT QUESTION TO ASK: `;

const lastMessageContext = `You are a Senior Tech Lead concluding an interview.
Company: *insert_company_here*
Role: *insert_job_here*
Candidate Name: *insert_name_here*

INSTRUCTIONS:
1. Acknowledge their final answer naturally.
2. Thank them for their time.
3. End by saying EXACTLY: 'That concludes our interview for today. You can now submit your final answer, and on the next screen, you will find your detailed performance report and analytics. It was great talking to you!'
4. Output ONLY the spoken text.`;

// ================= END PROMPTS =================

const generateAnalytics = `
Your task is to provide a detailed performance assessment for a candidate who recently completed an interview. The candidate was asked the following question by the interviewer: "*insert_question_here*". The candidate's response to this question is: "*insert_answer_here*".
For context, the candidate is applying for the position of *insert_title_here* at *insert_company_here*. The positions they are applying for fall under the category of *insert_type_here*. The job requirements are as follows: "*insert_reqs_here*".

CRITICAL RULE: Evaluate the answers strictly. If the candidate's answer is nonsensical, completely irrelevant, gibberish, or very short, explicitly give 0 points for all relevant parameters. Do not inflate scores for poor answers.

Evaluate the candidate's performance in six specific areas, each with a maximum score. Provide your assessment in the form of a JSON object under the "interviewFeedbackAnalyticsRadar" section. The six parameters to be assessed are:
1. Communication Skills
2. Technical Proficiency
3. Adaptability
4. Team Collaboration
5. Leadership Potential
6. Cultural Fit
For each parameter, assign points based on your assessment of the candidate's performance, considering the points they received out of the maximum points possible.
The response should follow this JSON format:
{
  "interviewFeedbackAnalyticsRadar": [
    { "parameter": "Communication Skills", "points": pointsNumber_1, "maxPoints": maxPointsNumber_1 },
    { "parameter": "Technical Proficiency", "points": pointsNumber_2, "maxPoints": maxPointsNumber_2 },
    { "parameter": "Adaptability", "points": pointsNumber_3, "maxPoints": maxPointsNumber_3 },
    { "parameter": "Team Collaboration", "points": pointsNumber_4, "maxPoints": maxPointsNumber_4 },
    { "parameter": "Leadership Potential", "points": pointsNumber_5, "maxPoints": maxPointsNumber_5 },
    { "parameter": "Cultural Fit", "points": pointsNumber_6, "maxPoints": maxPointsNumber_6 }
  ]
}
`;

const feedbackContext = `
Your role is to give feedback to a candidate who just did an interview. The question they were asked by the interviewer is "*insert_question_here*". 
  The candidate's answer to this question is "*insert_answer_here*". 
  Don't mention or repeat the question or answer in your response. Never mention question or answer as undefined in your response. 
  For context, the candidate is applying for the position *insert_title_here* at the company *insert_company_here*. The type of positions they are applying for 
  are the following: *insert_type_here*. The requirements for this job are the following: "*insert_reqs_here*". 

  CRITICAL RULE: Evaluate the answers strictly. If the candidate's answer is nonsensical, completely irrelevant, gibberish, or very short, DO NOT invent strengths. Provide accurate, critical feedback in the improvements section, and leave the "strengths" array empty.

  Please limit the feedback to 200 words and do not repeat the question or the answer. You are speaking to the candidate in the second person. 
  Please organize your answer into two sections: "strengths" and "improvements", where the "strengths" section talks about what the candidate did well and 
  the "improvements" section talks about areas of improvement for the candidate's answer. For each section, add a heading that highlights each point made. 
  The response should be in a JSON format like the following
{
  "strengths": [
    {
      "feedbackHeading": "feedback_heading_1",
      "feedback": "feedback_1"
    }
  ],
  "improvements": [
    {
      "feedbackHeading": "feedback_heading_1",
      "feedback": "feedback_1"
    }
  ]
}
`;

const overallFeedbackContext = `
Your role is to give overall feedback to a candidate who just did an interview.
For context, the candidate is applying for the position *insert_title_here* at the company *insert_company_here*. The type of positions they are applying for 
are the following: *insert_type_here*. The requirements for this job are the following: "*insert_reqs_here*".
The questions of the interviewer and the answers by the candidate are in an array of objects provided below, where each object in the array represents one question/answer pair.
The question field in each object is the question asked by the interviewer and the answer field in each object is the candidate's answer to that respective question.
Here is the array of objects:
*insert_questions_here*
Please limit the feedback to 150 words, the feedback should be in form of 6 distinct feedback separated with "." and do not repeat the question or the answer. You are speaking to the candidate in second person. Your answer should be in the format of 
a JSON with key named feedback.
`;

const generateQuestionsContext = `
Your role is to generate an interview question for a candidate doing an interview. 
For context, the candidate is applying for the position *insert_title_here* at the company *insert_company_here*. The type of positions they are applying for 
are the following: *insert_type_here*. The requirements for this job are the following: "*insert_reqs_here*".
The questions the candidate is already being asked is provided in an array here: *insert_questions_here*
Make sure that the question you generate is not a repeat of any of the questions that are already being asked.
Difficulty level of question will be : *insert_level_here*
Please limit the question to one sentence. The question should be directed to the candidate in the second person. Your answer should be in the form of a valid JSON with only the question.
`;

export async function POST(request: Request) {
  const body = await request.json();
  const queryType = body.prompt.queryType;

  let context: any[] = [];

  if (queryType == "firstMessage") {
    const { jobProfile, companyName, question, name } = body.prompt;
    const systemContext = firstMessageContext
      .replace("*insert_company_here*", companyName)
      .replace("*insert_job_here*", jobProfile)
      .replace("*insert_name_here*", name)
      .concat(question);

    context.push({ role: "user", content: systemContext });
  } else if (queryType == "subsequentMessage") {
    const { jobProfile, companyName, prevQuestion, prevAnswer, question, name } = body.prompt;
    const systemContext = subsequentMessageContext
      .replace("*insert_job_here*", jobProfile)
      .replace("*insert_company_here*", companyName)
      .replace("*insert_name_here*", name)
      .concat(question);

    context.push({ role: "system", content: systemContext });
    context.push({ role: "assistant", content: prevQuestion });
    context.push({ role: "user", content: prevAnswer });
  } else if (queryType == "lastMessage") {
    const { jobProfile, companyName, prevQuestion, prevAnswer, name } = body.prompt;
    const systemContext = lastMessageContext
      .replace("*insert_job_here*", jobProfile)
      .replace("*insert_company_here*", companyName)
      .replace("*insert_name_here*", name);

    context.push({ role: "system", content: systemContext });
    context.push({ role: "assistant", content: prevQuestion });
    context.push({ role: "user", content: prevAnswer });
  } else if (queryType == "feedback") {
    const { question, answer, jobProfile, jobtype, companyName, jobRequirements } = body.prompt;
    const systemContext = feedbackContext
      .replace("*insert_question_here*", question)
      .replace("*insert_answer_here*", answer)
      .replace("*insert_title_here*", jobProfile)
      .replace("*insert_type_here*", jobtype)
      .replace("*insert_company_here*", companyName)
      .replace("*insert_reqs_here*", jobRequirements);

    context.push({ role: "user", content: systemContext });
  } else if (queryType == "generateAnalytics") {
    const { question, answer, jobProfile, jobtype, companyName, jobRequirements } = body.prompt;
    const systemContext = generateAnalytics
      .replace("*insert_question_here*", question)
      .replace("*insert_answer_here*", answer)
      .replace("*insert_title_here*", jobProfile)
      .replace("*insert_type_here*", jobtype)
      .replace("*insert_company_here*", companyName)
      .replace("*insert_reqs_here*", jobRequirements);

    context.push({ role: "user", content: systemContext });
  } else if (queryType == "overall") {
    const { questions, jobProfile, jobtype, companyName, jobRequirements } = body.prompt;
    const systemContext = overallFeedbackContext
      .replace("*insert_questions_here*", JSON.stringify(questions))
      .replace("*insert_title_here*", jobProfile)
      .replace("*insert_type_here*", jobtype)
      .replace("*insert_company_here*", companyName)
      .replace("*insert_reqs_here*", jobRequirements);

    context.push({ role: "user", content: systemContext });
  } else if (queryType == "generateQuestion") {
    const { questions, jobProfile, jobtype, companyName, jobRequirements, level } = body.prompt;
    const systemContext = generateQuestionsContext
      .replace("*insert_questions_here*", questions)
      .replace("*insert_title_here*", jobProfile)
      .replace("*insert_type_here*", jobtype)
      .replace("*insert_company_here*", companyName)
      .replace("*insert_reqs_here*", jobRequirements)
      .replace("*insert_level_here*", diflevel(level));

    context.push({ role: "user", content: systemContext });
  }

  const completion = await openai.chat.completions.create({
    messages: context,
    model: "openai/gpt-oss-120b", // Ensure your model handles this correctly
    stream: true,
  });

  const stream = OpenAIStream(completion);
  return new StreamingTextResponse(stream);
}