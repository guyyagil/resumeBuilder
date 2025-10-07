import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode, AgentAction } from '../types';
import { serializeWithMeta } from './prompts';
import {
  RESUME_AGENT_SYSTEM_PROMPT,
  JOB_TAILORING_SYSTEM_ADDITION,
  RESUME_STRUCTURING_PROMPT,
} from './systemPrompts';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
  }

  async structureResumeFromText(resumeText: string): Promise<{ actions: AgentAction[], title: string }> {
    const prompt = `${RESUME_STRUCTURING_PROMPT}\n\nResume Text to Parse:\n${resumeText}

IMPORTANT: Before the action array, on the first line, output the main title/header of the resume (usually the person's name or main header). Format:
TITLE: [main title here]
Then output the JSON action array on the following lines.`;

    console.log('🤖 Sending resume to AI for structuring...');
    console.log('Prompt length:', prompt.length);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      console.log('🤖 AI Response:');
      console.log('Response length:', response.length);
      console.log('Full response:', response);

      // Extract title
      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in AI response');
        console.log('Response was:', response);
        throw new Error('AI did not return valid action array');
      }

      const actions = JSON.parse(jsonMatch[0]) as AgentAction[];
      console.log('✅ Parsed actions:', actions.length);
      console.log('✅ Extracted title:', title);

      return { actions, title };
    } catch (error) {
      console.error('❌ Failed to structure resume:', error);
      throw new Error('Failed to parse resume structure');
    }
  }

  async structureResumeFromTextAndImages(resumeText: string, images: string[]): Promise<{ actions: AgentAction[], title: string }> {
    const visualPrompt = `${RESUME_STRUCTURING_PROMPT}

VISUAL ANALYSIS INSTRUCTIONS:
You are seeing the actual PDF resume as images. Use the visual layout to:
1. Identify exact section titles as they appear (with exact capitalization and formatting)
2. Determine the visual organization (columns, grids, inline elements)
3. Suggest appropriate "layout" field based on visual structure:
   - If contact info is in a single row → layout: "inline"
   - If skills are in columns/grid → layout: "grid"
   - If content is tightly spaced → layout: "compact"
   - Standard vertical → layout: "default" or omit
4. Preserve the visual hierarchy and ordering

Resume Text (for content extraction):
${resumeText}

IMPORTANT: Before the action array, on the first line, output the main title/header of the resume (usually the person's name or main header that you see prominently at the top of the visual). Format:
TITLE: [main title here]
Then output the JSON action array on the following lines.

Analyze the images above and the text to generate the title and action array.`;

    console.log('🤖 Sending resume with images to AI for structuring...');
    console.log('Prompt length:', visualPrompt.length);
    console.log('Images:', images.length);

    try {
      // Build content parts: images first, then text prompt
      const contentParts: any[] = [];

      // Add each image
      images.forEach((imageBase64) => {
        contentParts.push({
          inlineData: {
            data: imageBase64,
            mimeType: 'image/png'
          }
        });
      });

      // Add text prompt
      contentParts.push({
        text: visualPrompt
      });

      const result = await this.model.generateContent(contentParts);
      const response = result.response.text();

      console.log('🤖 AI Response:');
      console.log('Response length:', response.length);
      console.log('Full response:', response);

      // Extract title
      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in AI response');
        console.log('Response was:', response);
        throw new Error('AI did not return valid action array');
      }

      const actions = JSON.parse(jsonMatch[0]) as AgentAction[];
      console.log('✅ Parsed actions:', actions.length);
      console.log('✅ Extracted title:', title);

      return { actions, title };
    } catch (error) {
      console.error('❌ Failed to structure resume with images:', error);
      throw new Error('Failed to parse resume structure with visual analysis');
    }
  }

  async processUserMessage(
    userMessage: string,
    resumeTree: ResumeNode[],
    jobDescription?: string,
    conversationHistory: ConversationMessage[] = [],
  ): Promise<{ explanation: string; action?: AgentAction }> {
    const resumeText = serializeWithMeta(resumeTree);

    let systemPrompt = RESUME_AGENT_SYSTEM_PROMPT;
    if (jobDescription) {
      systemPrompt += `\n\n${JOB_TAILORING_SYSTEM_ADDITION.replace(
        '{JOB_DESCRIPTION}',
        jobDescription,
      )}`;
    }

    const messages = [
      {
        role: 'user',
        parts: [
          {
            text: `${systemPrompt}\n\n## Current Resume:\n\n${resumeText}`,
          },
        ],
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    try {
      const chat = this.model.startChat({ history: messages.slice(0, -1) });
      const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
      const response = result.response.text();
      return this.parseResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process request with AI');
    }
  }

  async generateSuggestions(
    resumeTree: ResumeNode[],
    jobDescription?: string,
  ): Promise<string[]> {
    const resumeText = serializeWithMeta(resumeTree);

    let prompt = `Analyze this resume and provide 3-5 specific, actionable suggestions for improvement. Focus on:\n1. Quantifying achievements\n2. Using stronger action verbs\n3. Adding missing technical details\n4. Improving clarity and impact\n\nResume:\n${resumeText}`;

    if (jobDescription) {
      prompt += `\n\nJob Description:\n${jobDescription}\n\nTailor suggestions to match this role.`;
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      return response
        .split('\n')
        .filter((line: string) => /^[\d\-\*]/.test(line.trim()))
        .map((line: string) => line.replace(/^[\d\-\*\.]+\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 0);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  private parseResponse(response: string): { explanation: string; action?: AgentAction } {
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { explanation: response.trim() };
    }

    try {
      const action = JSON.parse(jsonMatch[0]) as AgentAction;
      const explanation = response.substring(0, jsonMatch.index).trim();
      return { explanation, action };
    } catch (error) {
      console.error('Failed to parse action JSON:', error);
      return { explanation: response.trim() };
    }
  }
}
