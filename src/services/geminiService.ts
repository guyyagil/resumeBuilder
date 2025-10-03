// geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode, AgentAction } from '../types';
import { serializeWithMeta } from './prompts';
import { 
  RESUME_AGENT_SYSTEM_PROMPT, 
  JOB_TAILORING_SYSTEM_ADDITION 
} from './systemPrompts';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }
  
  async processUserMessage(
    userMessage: string,
    resumeTree: ResumeNode[],
    jobDescription?: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{ explanation: string; action?: AgentAction }> {
    
    // Serialize resume
    const resumeText = serializeWithMeta(resumeTree);
    
    // Build system prompt
    let systemPrompt = RESUME_AGENT_SYSTEM_PROMPT;
    if (jobDescription) {
      systemPrompt += '\n\n' + JOB_TAILORING_SYSTEM_ADDITION.replace(
        '{JOB_DESCRIPTION}',
        jobDescription
      );
    }
    
    // Build conversation context
    const messages = [
      {
        role: 'user',
        parts: [{
          text: `${systemPrompt}\n\n## Current Resume:\n\n${resumeText}`
        }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];
    
    try {
      const chat = this.model.startChat({ history: messages.slice(0, -1) });
      const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
      const response = result.response.text();
      
      // Parse response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process request with AI');
    }
  }
  
  private parseResponse(response: string): { explanation: string; action?: AgentAction } {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // No action, just explanation
      return { explanation: response.trim() };
    }
    
    try {
      const action = JSON.parse(jsonMatch[0]) as AgentAction;
      
      // Extract explanation by removing the JSON block and any surrounding artifacts
      let explanation = response.replace(/```json[\s\S]*?```/g, '').trim();
      explanation = explanation.replace(/\{[\s\S]*\}/g, '').trim();
      
      // Remove common action artifacts
      explanation = explanation.replace(/Action:.*$/gm, '').trim();
      explanation = explanation.replace(/```[\s\S]*?```/g, '').trim();
      
      // Clean up any remaining artifacts
      explanation = explanation.replace(/^\s*```\s*$/gm, '').trim();
      
      return { explanation, action };
    } catch (error) {
      console.error('Failed to parse action JSON:', error);
      return { explanation: response.trim() };
    }
  }
  
  async generateSuggestions(
    resumeTree: ResumeNode[],
    jobDescription?: string
  ): Promise<string[]> {
    const resumeText = serializeWithMeta(resumeTree);
    
    let prompt = `Analyze this resume and provide 3-5 specific, actionable suggestions for improvement. Focus on:
1. Quantifying achievements
2. Using stronger action verbs
3. Adding missing technical details
4. Improving clarity and impact

Resume:
${resumeText}`;
    
    if (jobDescription) {
      prompt += `\n\nJob Description:\n${jobDescription}\n\nTailor suggestions to match this role.`;
    }
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse suggestions (assuming numbered or bulleted list)
      const suggestions = response
        .split('\n')
        .filter((line: string) => /^[\d\-\*]/.test(line.trim()))
        .map((line: string) => line.replace(/^[\d\-\*\.]\s*/, '').trim())
        .filter((s: string) => s.length > 0);
      
      return suggestions;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }
}
