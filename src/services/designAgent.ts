import type { ResumeNode } from '../shared/types';
import type { DesignTemplate, GeneratedResumeDesign } from '../features/design/types/design.types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class DesignAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 16384, // Increased for full HTML/CSS generation
      }
    });
  }

  /**
   * Generate complete HTML/CSS for the resume based on the design template
   */
  async generateResumeHTML(
    tree: ResumeNode[],
    title: string,
    template: DesignTemplate,
    jobDescription?: string
  ): Promise<GeneratedResumeDesign> {
    console.log('🎨 DesignAgent: Generating HTML/CSS for resume...');
    console.log('🎨 Template:', template.name);

    const prompt = this.buildDesignPrompt(tree, title, template, jobDescription);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      console.log('🎨 DesignAgent: Received response from AI');

      // Extract HTML and CSS from response
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

    return `You are an expert resume designer. Generate a complete, professional HTML + CSS resume based on the following specifications.

# RESUME CONTENT

Title: ${title}

${resumeText}

${jobDescription ? `\n# JOB DESCRIPTION\n${jobDescription}\n` : ''}

# DESIGN TEMPLATE: ${template.name}

Style: ${template.style}
Description: ${template.description}

## Colors
- Primary: ${template.colors.primary}
- Secondary: ${template.colors.secondary}
- Text: ${template.colors.text}
- Text Light: ${template.colors.textLight}
- Background: ${template.colors.background}
- Accent: ${template.colors.accent}

## Typography
- Heading Font: ${template.fonts.heading}
- Body Font: ${template.fonts.body}
${template.fonts.accent ? `- Accent Font: ${template.fonts.accent}` : ''}

## Layout
- Single Column: ${template.layout.singleColumn}
- Two Column: ${template.layout.twoColumn}
${template.layout.columnsRatio ? `- Columns Ratio: ${template.layout.columnsRatio}` : ''}
- Spacing: ${template.layout.spacing}

# YOUR TASK

Generate a complete, professional resume with:

1. **Complete HTML structure** - self-contained, no external dependencies
2. **Embedded CSS** - all styles in a <style> tag in the <head>
3. **Responsive design** - looks great on screen and print
4. **Professional typography** - proper hierarchy, spacing, and readability
5. **Clean layout** - follows the template specifications
6. **Modern design** - contemporary, polished, and professional

# DESIGN GUIDELINES

## Layout Structure
${
  template.layout.twoColumn
    ? `- Use a two-column layout with ratio ${template.layout.columnsRatio || '1:2'}
- Left column: Contact info, skills, education
- Right column: Experience, projects, main content`
    : '- Use a single-column layout with clear section breaks'
}

## Typography
- Title/Name: Large, bold, prominent (${template.fonts.heading})
- Section headers: ${template.colors.primary} color, clear visual hierarchy
- Body text: ${template.fonts.body}, readable size (14-16px)
- Use ${template.layout.spacing} spacing between elements

## Visual Elements
- Add subtle borders or dividers between sections
- Use ${template.colors.accent} for highlights and links
- Ensure high contrast for readability
- Add tasteful spacing and padding

## Print Optimization
- Set page size to A4 or Letter
- Use appropriate margins
- Ensure content fits on 1-2 pages
- Remove any interactive elements for print

# OUTPUT FORMAT

**CRITICAL**: You MUST return ONLY the HTML code in a markdown code block. Do NOT add any explanations, descriptions, or commentary before or after the code.

Return in this EXACT format:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Resume</title>
    <style>
        /* Your complete CSS here */
    </style>
</head>
<body>
    <!-- Your complete HTML here -->
</body>
</html>
\`\`\`

**IMPORTANT**:
- Start your response immediately with \`\`\`html
- End with \`\`\`
- Include ALL styles in the <style> tag
- Make the resume visually appealing with the specified colors and fonts
- NO text before or after the code block

Generate the complete, production-ready HTML now.`;
  }

  private serializeTree(tree: ResumeNode[], depth: number = 0): string {
    let result = '';

    for (const node of tree) {
      const indent = '  '.repeat(depth);
      const content = node.text || node.title || '';

      result += `${indent}${content}\n`;

      // Add metadata if present
      if (node.meta) {
        const metaStr = Object.entries(node.meta)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        result += `${indent}  [${metaStr}]\n`;
      }

      // Recursively add children
      if (node.children && node.children.length > 0) {
        result += this.serializeTree(node.children, depth + 1);
      }
    }

    return result;
  }

  private parseResponse(response: string): { html: string; css: string } {
    console.log('🎨 DesignAgent: Parsing response...');
    console.log('🎨 Response preview:', response.substring(0, 500));
    console.log('🎨 Response length:', response.length);

    // Try multiple patterns to extract HTML
    let fullHtml = '';

    // Pattern 1: ```html ... ``` (with closing ```)
    let htmlMatch = response.match(/```html\s*([\s\S]*?)```/);

    // Pattern 2: ```html ... without closing ``` (for truncated responses)
    if (!htmlMatch) {
      htmlMatch = response.match(/```html\s*([\s\S]*)/);
      if (htmlMatch) {
        console.log('🎨 Found HTML without closing code block (truncated response)');
      }
    }

    // Pattern 3: ```HTML ... ``` (case insensitive)
    if (!htmlMatch) {
      htmlMatch = response.match(/```HTML\s*([\s\S]*?)```/i);
    }

    // Pattern 4: Just ``` ... ``` (generic code block)
    if (!htmlMatch) {
      htmlMatch = response.match(/```\s*(<!DOCTYPE[\s\S]*?)```/);
    }

    // Pattern 5: Look for DOCTYPE directly without code blocks
    if (!htmlMatch) {
      const docMatch = response.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
      if (docMatch) {
        fullHtml = docMatch[1].trim();
      }
    } else {
      fullHtml = htmlMatch[1].trim();
    }

    if (!fullHtml) {
      console.error('❌ Could not find HTML in response');
      console.error('Full response:', response);
      throw new Error('Could not parse HTML from AI response. The AI may not have returned valid HTML.');
    }

    // Fix truncated HTML - ensure closing tags
    if (!fullHtml.includes('</html>')) {
      console.log('⚠️ HTML is truncated, attempting to fix...');

      // Close any open tags
      if (!fullHtml.includes('</body>')) {
        fullHtml += '\n</body>';
      }
      if (!fullHtml.includes('</html>')) {
        fullHtml += '\n</html>';
      }

      console.log('✅ Fixed truncated HTML');
    }

    // The CSS is embedded in the HTML, so we extract it
    const cssMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const css = cssMatch ? cssMatch[1].trim() : '';

    console.log('✅ DesignAgent: Successfully parsed HTML and CSS');
    console.log('✅ HTML length:', fullHtml.length);
    console.log('✅ CSS length:', css.length);

    return { html: fullHtml, css };
  }
}
