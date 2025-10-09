// Gemini AI service - moved from geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode, AgentAction, LayoutKind, StyleHints } from '../../types';
import { generateUid } from '../../utils/tree/treeUtils';
import {
  RESUME_STRUCTURING_PROMPT
} from './PromptTemplates';

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
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
  }

  async structureResumeFromText(resumeText: string): Promise<{ tree: ResumeNode[], title: string }> {
    const prompt = `${RESUME_STRUCTURING_PROMPT}\n\nResume Text to Parse:\n${resumeText}

IMPORTANT: Before the action array, on the first line, output the main title/header of the resume (usually the person's name or main header). Format:
TITLE: [main title here]
Then output the JSON action array on the following lines.`;

    console.log('🤖 Sending resume to AI for structuring...');

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      console.log('🤖 AI Response received');

      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('AI did not return valid action array');
      }

      const actions = JSON.parse(jsonMatch[0]) as AgentAction[];
      const tree = this.buildTreeFromAppendActions(actions);

      return { tree, title };
    } catch (error) {
      console.error('❌ Failed to structure resume:', error);
      throw new Error('Failed to parse resume structure');
    }
  }

  private buildTreeFromAppendActions(actions: any[]): ResumeNode[] {
    const tree: ResumeNode[] = [];
    const nodeMap = new Map<string, ResumeNode>();
    let rootCounter = 0;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.action !== 'append') continue;

      const isHeading = !action.parent && (
        action.content?.match(/^[A-Z\s]+$/) ||
        (action.style?.fontWeight && action.style.fontWeight >= 600) ||
        (action.style?.textTransform === 'uppercase')
      );

      const newNode: ResumeNode = {
        uid: generateUid(),
        text: action.content || '',
        layout: (action.layout as LayoutKind) || (isHeading ? 'heading' : 'paragraph'),
        style: action.style as StyleHints,
        meta: action.meta || {},
        children: []
      };

      if (!action.parent) {
        rootCounter++;
        const realAddress = rootCounter.toString();
        newNode.addr = realAddress;

        const aiIndex = (i + 1).toString();
        nodeMap.set(aiIndex, newNode);
        tree.push(newNode);
      } else {
        const parentNode = nodeMap.get(action.parent);
        if (!parentNode) {
          rootCounter++;
          const realAddress = rootCounter.toString();
          newNode.addr = realAddress;
          const aiIndex = (i + 1).toString();
          nodeMap.set(aiIndex, newNode);
          tree.push(newNode);
        } else {
          if (!parentNode.children) parentNode.children = [];
          const childIndex = parentNode.children.length + 1;
          const realAddress = `${parentNode.addr}.${childIndex}`;
          newNode.addr = realAddress;

          const aiIndex = (i + 1).toString();
          nodeMap.set(aiIndex, newNode);
          parentNode.children.push(newNode);
        }
      }
    }

    return tree;
  }

  async processUserMessage(
    _userMessage: string,
    _resumeTree: ResumeNode[],
    _jobDescription?: string,
    _conversationHistory: ConversationMessage[] = [],
  ): Promise<{ explanation: string; action?: AgentAction }> {
    // Simple implementation for now
    return {
      explanation: "I understand your request. This is a placeholder response while the full chat system is being integrated.",
    };
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