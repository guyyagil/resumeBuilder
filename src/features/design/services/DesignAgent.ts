// Design generation service - moved from designAgent.ts
import type { ResumeNode } from '../../../shared/types';
import type { DesignTemplate, GeneratedResumeDesign } from '../types/design.types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptBuilder, CORE_PROMPTS } from '../../../shared/services/ai/PromptTemplates';

export class DesignAgent {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
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
      const designModel = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 16384,
        }
      });

      const fullPrompt = `${CORE_PROMPTS.RESUME_DESIGNER}\n\n${prompt}`;

      const result = await designModel.generateContent(fullPrompt);
      const response = result.response.text();
      
      console.log('🎨 DesignAgent: Raw response length:', response.length);
      console.log('🎨 DesignAgent: First 200 chars:', response.substring(0, 200));
      console.log('🎨 DesignAgent: Last 200 chars:', response.substring(response.length - 200));
      
      const { html, css } = this.parseResponse(response);
      
      console.log('🎨 DesignAgent: Parsed HTML length:', html.length);
      console.log('🎨 DesignAgent: Parsed CSS length:', css.length);

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
    console.log('🔧 DesignAgent: Parsing response...');
    
    let htmlMatch = response.match(/```html\s*([\s\S]*?)```/);
    
    if (!htmlMatch) {
      console.log('🔧 DesignAgent: No closed HTML block found, trying open block...');
      htmlMatch = response.match(/```html\s*([\s\S]*)/);
    }

    if (!htmlMatch) {
      console.log('🔧 DesignAgent: No HTML block found, trying DOCTYPE match...');
      const docMatch = response.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
      if (docMatch) {
        console.log('🔧 DesignAgent: Found DOCTYPE match');
        const fullHtml = docMatch[1].trim();
        const cssMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        const css = cssMatch ? cssMatch[1].trim() : '';
        return { html: fullHtml, css };
      }
    }

    if (!htmlMatch) {
      console.error('❌ DesignAgent: Could not parse HTML from response');
      console.error('❌ Response preview:', response.substring(0, 500));
      throw new Error('Could not parse HTML from AI response');
    }

    console.log('✅ DesignAgent: Found HTML match');
    const fullHtml = htmlMatch[1].trim();
    const cssMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const css = cssMatch ? cssMatch[1].trim() : '';

    return { html: fullHtml, css };
  }
}