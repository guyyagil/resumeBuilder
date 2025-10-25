// Design generation service - moved from features/design/services
import type { ResumeNode } from '../../types';
import type { DesignTemplate, GeneratedResumeDesign } from '../../phaseUtils/design/types/design.types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptBuilder } from '../prompts/PromptTemplates';

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
        model: 'gemini-2.5-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 16384,
        }
      });

      const fullPrompt = prompt;

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

      // Only include content - NO style information
      // This ensures AI generates fresh design from scratch
      const content = node.text || node.title || '';
      if (content.trim()) {
        result += `${indent}${content}\n`;
      }

      // Include layout hint for semantic structure only
      if (node.layout) {
        result += `${indent}  [${node.layout}]\n`;
      }

      // Include semantic metadata (dates, locations, etc.) but NOT style
      if (node.meta) {
        const semanticMeta = Object.entries(node.meta)
          .filter(([key]) => !key.toLowerCase().includes('style') && !key.toLowerCase().includes('color'))
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (semanticMeta) {
          result += `${indent}  [${semanticMeta}]\n`;
        }
      }

      if (node.children && node.children.length > 0) {
        result += this.serializeTree(node.children, depth + 1);
      }
    }

    return result;
  }

  private parseResponse(response: string): { html: string; css: string } {
    console.log('🔧 DesignAgent: Parsing response...');

    let rawHtml = '';

    // Try to find HTML in code block
    let htmlMatch = response.match(/```html\s*([\s\S]*?)```/);

    if (!htmlMatch) {
      console.log('🔧 DesignAgent: No closed HTML block found, trying open block...');
      htmlMatch = response.match(/```html\s*([\s\S]*)/);
    }

    if (htmlMatch) {
      rawHtml = htmlMatch[1].trim();
    } else {
      console.log('🔧 DesignAgent: No HTML block found, trying DOCTYPE match...');
      const docMatch = response.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
      if (docMatch) {
        console.log('🔧 DesignAgent: Found DOCTYPE match');
        rawHtml = docMatch[1].trim();
      }
    }

    if (!rawHtml) {
      console.error('❌ DesignAgent: Could not parse HTML from response');
      console.error('❌ Response preview:', response.substring(0, 500));
      throw new Error('Could not parse HTML from AI response');
    }

    console.log('✅ DesignAgent: Found HTML, now extracting body and styles...');

    // Extract CSS from all <style> tags
    let css = '';
    const styleMatches = rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
    if (styleMatches) {
      css = styleMatches
        .map(style => {
          const match = style.match(/<style[^>]*>([\s\S]*?)<\/style>/);
          return match ? match[1] : '';
        })
        .join('\n\n');
    }

    // Extract body content ONLY - remove DOCTYPE, html, head, body tags
    let bodyContent = rawHtml;

    // If full HTML document, extract just the body content
    const bodyMatch = bodyContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
      console.log('🔧 DesignAgent: Extracted content from <body> tag');
    }

    // Remove any remaining document structure tags
    bodyContent = bodyContent.replace(/<!DOCTYPE[^>]*>/gi, '');
    bodyContent = bodyContent.replace(/<\/?html[^>]*>/gi, '');
    bodyContent = bodyContent.replace(/<head>[\s\S]*?<\/head>/gi, '');
    bodyContent = bodyContent.replace(/<\/?body[^>]*>/gi, '');

    // Remove all <style> tags from the body content (we already extracted them to css)
    bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    const finalHtml = bodyContent.trim();
    const finalCss = css.trim();

    console.log('🔧 DesignAgent: Final HTML length:', finalHtml.length);
    console.log('🔧 DesignAgent: Final CSS length:', finalCss.length);
    console.log('🔧 DesignAgent: HTML preview:', finalHtml.substring(0, 200));

    return { html: finalHtml, css: finalCss };
  }
}