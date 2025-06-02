import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI SDK with the API key
export const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
