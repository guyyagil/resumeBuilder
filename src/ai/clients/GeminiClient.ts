// Gemini AI service - centralized AI client
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode, AgentAction } from '../../types';
import { generateUid } from '../../utils';
import { PromptBuilder } from '../prompts/PromptTemplates';

export interface GeminiResponse {
  actions: AgentAction[];
  explanation: string;
  confidence: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }

  async processUserMessage(
    prompt: string,
    _actions: AgentAction[], // Unused for guidance-only responses
    _resumeContent: string, // Unused - context is in prompt
    chatHistory: ChatMessage[] = []
  ): Promise<GeminiResponse> {
    try {
      // Build conversation history for Gemini
      // Filter out any leading assistant messages (Gemini requires first message to be 'user')
      let filteredHistory = chatHistory;
      while (filteredHistory.length > 0 && filteredHistory[0].role === 'assistant') {
        filteredHistory = filteredHistory.slice(1);
      }

      const history = filteredHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response.text();

      return {
        actions: [], // No actions for guidance-only responses
        explanation: response,
        confidence: 0.9
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateResumeStructure(
    pdfText: string,
    jobDescription?: string
  ): Promise<{
    title: string;
    sections: Array<{
      type: 'heading' | 'container' | 'list-item';
      text: string;
      children?: Array<{
        type: 'heading' | 'container' | 'list-item';
        text: string;
      }>;
    }>;
  }> {
    const prompt = PromptBuilder.buildPDFStructurePrompt(pdfText, jobDescription);
    console.log('🤖 Calling Gemini API with model: gemini-2.5-flash');

    const structureModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 12000 // Increased for longer Hebrew content
      }
    });

    let response = '';

    try {
      const result = await structureModel.generateContent(prompt);
      response = result.response.text();

      console.log('🤖 Gemini API response received');
      console.log('🤖 Response content:', response);

      if (!response) {
        console.error('❌ No response content from Gemini');
        throw new Error('No response from Gemini');
      }

      // Clean the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleanResponse);
      console.log('✅ Successfully parsed JSON response:', parsed);
      return parsed;
    } catch (error) {
      console.error('Gemini structure generation error:', error);
      console.error('❌ Failed to parse response:', response.substring(0, 500) + '...');

      // Try to extract JSON from partial response with multiple strategies
      try {
        // Strategy 1: Find complete JSON object
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const partialJson = response.substring(jsonStart, jsonEnd + 1);
          console.log('🔧 Attempting to parse partial JSON (strategy 1)...');
          const partialParsed = JSON.parse(partialJson);
          console.log('✅ Successfully parsed partial JSON response');
          return partialParsed;
        }

        // Strategy 2: Try to fix truncated JSON by adding closing braces
        if (jsonStart !== -1) {
          let partialJson = response.substring(jsonStart);

          // Count open braces and try to close them
          const openBraces = (partialJson.match(/\{/g) || []).length;
          const closeBraces = (partialJson.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;

          if (missingBraces > 0) {
            // Remove any trailing incomplete content after last complete field
            partialJson = partialJson.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*"?[^}]*$/, '');
            // Add missing closing braces
            partialJson += '}]}'.repeat(Math.min(missingBraces, 3));

            console.log('🔧 Attempting to parse fixed JSON (strategy 2)...');
            console.log('🔧 Fixed JSON preview:', partialJson.substring(partialJson.length - 200));
            const fixedParsed = JSON.parse(partialJson);
            console.log('✅ Successfully parsed fixed JSON response');
            return fixedParsed;
          }
        }
      } catch (partialError) {
        console.error('❌ All partial JSON parsing strategies failed:', partialError);
      }

      throw new Error(`Failed to generate resume structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async structureResumeFromText(resumeText: string): Promise<{ tree: ResumeNode[], title: string }> {
    try {
      const structuredData = await this.generateResumeStructure(resumeText);
      const tree = this.convertToResumeNodes(structuredData.sections);
      const title = structuredData.title;
      console.log('✅ Successfully converted to tree with', tree.length, 'root nodes');
      return { tree, title };
    } catch (error) {
      console.warn('❌ New method failed, trying legacy method:', error);
      // Fallback to old method if new one fails
      return this.legacyStructureResumeFromText(resumeText);
    }
  }

  private convertToResumeNodes(sections: any[]): ResumeNode[] {
    return sections.map((section, index) => {
      const node: ResumeNode = {
        uid: generateUid(),
        addr: (index + 1).toString(),
        layout: section.type as any,
        text: section.text,
        children: section.children ? this.convertChildNodes(section.children, (index + 1).toString()) : undefined
      };
      return node;
    });
  }

  private convertChildNodes(children: any[], parentAddr: string): ResumeNode[] {
    return children.map((child, index) => {
      const childAddr = `${parentAddr}.${index + 1}`;
      const node: ResumeNode = {
        uid: generateUid(),
        addr: childAddr,
        layout: child.type as any,
        text: child.text,
        children: child.children ? this.convertChildNodes(child.children, childAddr) : undefined
      };
      return node;
    });
  }

  private async legacyStructureResumeFromText(resumeText: string): Promise<{ tree: ResumeNode[], title: string }> {
    console.log('🤖 Sending resume to AI for structuring (legacy method)...');

    try {
      // Try to parse the response as the new JSON format first
      const structuredData = await this.generateResumeStructure(resumeText);
      const tree = this.convertToResumeNodes(structuredData.sections);
      const title = structuredData.title;
      console.log('✅ Legacy method successfully used new format with', tree.length, 'root nodes');
      return { tree, title };
    } catch (error) {
      console.warn('❌ Legacy method also failed:', error);
      // Return empty structure as last resort
      return {
        tree: [],
        title: 'Resume'
      };
    }
  }

  async generateSuggestions(
    _resumeTree: ResumeNode[],
    _jobDescription?: string,
  ): Promise<string[]> {
    // Simple implementation for now
    return [
      "Add quantified achievements to your experience",
      "Strengthen action verbs in bullet points",
      "Tailor skills section to job requirements"
    ];
  }
}