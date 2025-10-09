// Design generation service - moved from designAgent.ts
import type { ResumeNode } from '../../../shared/types';
import type { DesignTemplate, GeneratedResumeDesign } from '../types/design.types';
import OpenAI from 'openai';
import { PromptBuilder, CORE_PROMPTS } from '../../../shared/services/ai/PromptTemplates';

export class DesignAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateResumeHTML(
    tree: ResumeNode[],
    title: string,
    template: DesignTemplate,
    jobDescription?: string
  ): Promise<GeneratedResumeDesign> {
    console.log('🎨 DesignAgent: Generating HTML/CSS for resume...');

    const prompt = this.buildDesignPrompt(tree, title, template, jobDescription);

    try {
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
        max_completion_tokens: 20000 // Higher limit for GPT-5-mini reasoning
      });

      const response = completion.choices[0]?.message?.content || '';
      const { html, css } = this.parseResponse(response);

      return {
        html,
        css,
        template,
        generatedAt: Date.now(),
      };
    } catch (error) {
      console.error('❌ DesignAgent: Failed to generate design:', error);
      throw new Error('Failed to generate resume design');
    }
  }

  private buildDesignPrompt(
    tree: ResumeNode[],
    title: string,
    template: DesignTemplate,
    jobDescription?: string
  ): string {
    const resumeText = this.serializeTree(tree);
    return PromptBuilder.buildDesignPrompt(resumeText, title, template, jobDescription);
  }

  private serializeTree(tree: ResumeNode[], depth: number = 0): string {
    let result = '';

    for (const node of tree) {
      const indent = '  '.repeat(depth);
      const content = node.text || node.title || '';
      result += `${indent}${content}\n`;

      if (node.meta) {
        const metaStr = Object.entries(node.meta)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        result += `${indent}  [${metaStr}]\n`;
      }

      if (node.children && node.children.length > 0) {
        result += this.serializeTree(node.children, depth + 1);
      }
    }

    return result;
  }

  private parseResponse(response: string): { html: string; css: string } {
    let htmlMatch = response.match(/```html\s*([\s\S]*?)```/);
    
    if (!htmlMatch) {
      htmlMatch = response.match(/```html\s*([\s\S]*)/);
    }

    if (!htmlMatch) {
      const docMatch = response.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
      if (docMatch) {
        const fullHtml = docMatch[1].trim();
        const cssMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        const css = cssMatch ? cssMatch[1].trim() : '';
        return { html: fullHtml, css };
      }
    }

    if (!htmlMatch) {
      throw new Error('Could not parse HTML from AI response');
    }

    const fullHtml = htmlMatch[1].trim();
    const cssMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const css = cssMatch ? cssMatch[1].trim() : '';

    return { html: fullHtml, css };
  }
}