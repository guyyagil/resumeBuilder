import OpenAI from 'openai';
import type { AgentAction } from '../../types';
import { PromptBuilder, CORE_PROMPTS } from './PromptTemplates';

export interface OpenAIResponse {
  actions: AgentAction[];
  explanation: string;
  confidence: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Enable browser usage
    });
  }

  /**
   * Process user message and generate actions
   */
  async processUserMessage(
    prompt: string,
    _actions: AgentAction[], // Unused for guidance-only responses
    _resumeContent: string, // Unused - context is in prompt
    chatHistory: ChatMessage[] = []
  ): Promise<OpenAIResponse> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: CORE_PROMPTS.WRITING_ASSISTANT
        },
        ...chatHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: prompt
        }
      ];

      // Try GPT-5-mini first, fallback to GPT-4o-mini
      let completion;
      try {
        completion = await this.client.chat.completions.create({
          model: 'gpt-5-mini',
          messages,
          max_completion_tokens: 3000 // Higher limit for GPT-5-mini reasoning
        });
      } catch (error) {
        console.warn('GPT-5-mini failed, trying GPT-4o-mini:', error);
        completion = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_completion_tokens: 1000,
          temperature: 0.7
        });
      }

      const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

      return {
        actions: [], // No actions for guidance-only responses
        explanation: response,
        confidence: 0.9
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume content from PDF text
   */
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
    // Try GPT-5-mini first, fallback to GPT-4o-mini if needed
    const models = ['gpt-5-mini', 'gpt-4o-mini'];
    
    for (const model of models) {
      try {
        console.log(`🤖 Trying model: ${model}`);
        return await this.tryGenerateResumeStructure(pdfText, jobDescription, model);
      } catch (error) {
        console.warn(`❌ Model ${model} failed:`, error);
        if (model === models[models.length - 1]) {
          // Last model failed, throw the error
          throw error;
        }
        // Continue to next model
        continue;
      }
    }
    
    throw new Error('All models failed');
  }

  private async tryGenerateResumeStructure(
    pdfText: string,
    jobDescription: string | undefined,
    model: string
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
    try {
      const prompt = PromptBuilder.buildPDFStructurePrompt(pdfText, jobDescription);

      console.log(`🤖 Calling OpenAI API with model: ${model}`);
      
      const requestConfig: any = {
        model,
        messages: [
          {
            role: 'system',
            content: CORE_PROMPTS.RESUME_PARSER
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: model === 'gpt-5-mini' ? 4000 : 2000, // GPT-5-mini needs more tokens for reasoning
        response_format: { type: 'json_object' }
      };

      // Add temperature for models that support it
      if (model !== 'gpt-5-mini') {
        requestConfig.temperature = 0.3;
      }

      const completion = await this.client.chat.completions.create(requestConfig);

      console.log('🤖 OpenAI API response received:', completion);
      console.log('🤖 Choices length:', completion.choices?.length);
      console.log('🤖 First choice:', completion.choices[0]);

      const response = completion.choices[0]?.message?.content;
      console.log('🤖 Response content:', response);
      
      if (!response) {
        console.error('❌ No response content from OpenAI');
        console.error('❌ Full completion object:', JSON.stringify(completion, null, 2));
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);
      console.log('✅ Successfully parsed JSON response:', parsed);
      return parsed;
    } catch (error) {
      console.error('OpenAI structure generation error:', error);
      throw new Error(`Failed to generate resume structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate design suggestions for resume
   */
  async generateDesignSuggestions(
    resumeContent: string,
    targetRole?: string
  ): Promise<{
    colorScheme: string;
    layout: string;
    typography: string;
    suggestions: string[];
  }> {
    try {
      const prompt = `Analyze this resume content and suggest professional design improvements:

Resume Content:
${resumeContent}

${targetRole ? `Target Role: ${targetRole}` : ''}

Provide design suggestions including:
1. Professional color scheme
2. Layout recommendations  
3. Typography suggestions
4. General design improvements

Return as JSON with colorScheme, layout, typography, and suggestions array.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: CORE_PROMPTS.RESUME_DESIGNER
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('OpenAI design generation error:', error);
      throw new Error(`Failed to generate design suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Improve specific text content
   */
  async improveText(
    text: string,
    context: string,
    targetRole?: string
  ): Promise<{
    improvedText: string;
    suggestions: string[];
    reasoning: string;
  }> {
    try {
      const prompt = `Improve this resume text to be more professional and impactful:

Original Text: "${text}"
Context: ${context}
${targetRole ? `Target Role: ${targetRole}` : ''}

Provide:
1. Improved version of the text
2. Specific suggestions for enhancement
3. Reasoning for the changes

Return as JSON with improvedText, suggestions array, and reasoning.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: CORE_PROMPTS.WRITING_ASSISTANT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('OpenAI text improvement error:', error);
      throw new Error(`Failed to improve text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}