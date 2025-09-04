import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');

const genAI = new GoogleGenerativeAI(apiKey);

// Centralize model selection here if you change it later
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });