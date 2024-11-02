import { NextResponse } from 'next/server'; // Correct import statement for NextResponse
import OpenAI from 'openai'; // Import OpenAI library

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
  You are an AI-powered customer support bot for Headstatai, a platform specializing in conducting AI-powered interviews for software engineering jobs. Your role is to assist users by providing clear, concise, and helpful information. You should:
  
  - Answer questions about the platform, including how to schedule interviews, what to expect during the interview process, and how to prepare.
  - Provide guidance on technical issues users might encounter while using the platform.
  - Offer tips for optimizing interview performance based on common best practices for software engineering interviews.
  - Respond professionally and empathetically, recognizing that job interviews can be stressful.
  - Redirect complex or specific inquiries to human support when necessary.
  
  Always strive to be helpful, patient, and understanding. Your goal is to enhance the user's experience with Headstatai and ensure they feel supported throughout their interaction with the platform.
`;  // System prompt for the AI

// Log the OpenAI API key to the console (for debugging purposes)
console.log('API Key:', process.env.OPENAI_API_KEY); // This should print your API key to the console

// POST function to handle incoming requests
export async function POST(req) {
  // Create a new instance of the OpenAI client with the API key from environment variables
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const data = await req.json(); // Parse the JSON body of the incoming request

  try {
  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...data,
    ], // Include the system prompt and user messages
    model: 'gpt-3.5-turbo', // Specify the correct model to use
    stream: true, // Enable streaming responses
  });
}
  catch (err) { 
    console.log(err)
  }
  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
