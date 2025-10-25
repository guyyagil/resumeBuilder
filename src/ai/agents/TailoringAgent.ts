// AI Agent for tailoring resumes to specific job descriptions
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode } from '../../types';
import { generateUid } from '../../utils';
import { PromptBuilder } from '../prompts/PromptTemplates';

interface TailoringResult {
  tree: ResumeNode[];
  summary: string;
  changes: string[];
}

export class TailoringAgent {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Tailors a resume tree to match a specific job description
   * This performs a complete rewrite optimized for the target job
   */
  async tailorResumeToJob(
    originalTree: ResumeNode[],
    resumeTitle: string,
    jobDescription: string
  ): Promise<ResumeNode[]> {
    console.log('🎯 TailoringAgent: Starting job-specific tailoring');

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 16384  // Increased token limit for larger resumes
      }
    });

    // Build the prompt using PromptBuilder
    const prompt = PromptBuilder.buildTailoringPrompt(
      originalTree,
      resumeTitle,
      jobDescription
    );

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      console.log('📥 Received tailoring response');

      const parsed = this.parseResponse(response);

      if (!parsed || !parsed.tree || parsed.tree.length === 0) {
        console.warn('⚠️ Tailoring returned empty tree, using original');
        return originalTree;
      }

      console.log('✅ Tailoring successful:', parsed.summary);
      console.log('📝 Changes:', parsed.changes.join(', '));

      return parsed.tree;
    } catch (error) {
      console.error('❌ Tailoring failed:', error);
      throw new Error(`Failed to tailor resume: ${(error as Error).message}`);
    }
  }

  private parseResponse(response: string): TailoringResult | null {
    try {
      console.log('🔍 Parsing response, length:', response.length);

      // Try multiple extraction strategies
      let jsonStr = '';

      // Strategy 1: Look for code blocks
      let jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // Strategy 2: Find JSON object boundaries more carefully
        const startIdx = response.indexOf('{');
        if (startIdx === -1) {
          console.error('❌ No JSON object start found');
          console.log('📄 Response preview:', response.substring(0, 500));
          return null;
        }

        // Find the matching closing brace by counting braces
        let braceCount = 0;
        let endIdx = -1;

        for (let i = startIdx; i < response.length; i++) {
          if (response[i] === '{') {
            braceCount++;
          } else if (response[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIdx = i;
              break;
            }
          }
        }

        if (endIdx === -1) {
          console.error('❌ No matching closing brace found - response may be truncated');
          console.log('📄 Response end:', response.substring(Math.max(0, response.length - 200)));
          return null;
        }

        jsonStr = response.substring(startIdx, endIdx + 1);
      }

      if (!jsonStr.trim()) {
        console.error('❌ No JSON content extracted');
        return null;
      }

      console.log('📦 Extracted JSON length:', jsonStr.length);

      // Validate JSON syntax before parsing
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('📄 Invalid JSON snippet:', jsonStr.substring(Math.max(0, jsonStr.length - 300)));

        // Try to fix common JSON issues
        const fixedJson = this.attemptJsonFix(jsonStr);
        if (fixedJson) {
          console.log('🔧 Attempting to parse fixed JSON...');
          parsed = JSON.parse(fixedJson);
        } else {
          throw parseError;
        }
      }

      // Validate the structure
      if (!parsed || typeof parsed !== 'object') {
        console.error('❌ Parsed result is not an object');
        return null;
      }

      if (!parsed.tree || !Array.isArray(parsed.tree)) {
        console.error('❌ Invalid tree structure in response');
        console.log('📦 Parsed object keys:', Object.keys(parsed));
        return null;
      }

      console.log('✅ Successfully parsed tree with', parsed.tree.length, 'root nodes');

      // Deep clone to avoid read-only issues
      const clonedTree = JSON.parse(JSON.stringify(parsed.tree));

      // Ensure all nodes have UIDs
      this.ensureUids(clonedTree);

      return {
        tree: clonedTree,
        summary: parsed.summary || 'Resume tailored to job description',
        changes: parsed.changes || []
      };
    } catch (error) {
      console.error('❌ Failed to parse tailoring response:', error);
      console.log('📄 Response that failed:', response.substring(0, 1500));
      return null;
    }
  }

  /**
   * Attempts to fix common JSON syntax issues
   */
  private attemptJsonFix(jsonStr: string): string | null {
    try {
      // Remove trailing commas before closing braces/brackets
      let fixed = jsonStr.replace(/,(\s*[}\]])/g, '$1');

      // Try to complete truncated strings
      if (fixed.endsWith('"col')) {
        // This looks like a truncated "color" property
        fixed = fixed.substring(0, fixed.length - 4) + '}]}]}';
      } else if (fixed.match(/"[^"]*$/)) {
        // Ends with an incomplete string
        fixed = fixed.replace(/"[^"]*$/, '"}]}]}');
      } else if (!fixed.endsWith('}')) {
        // Try to close the JSON properly
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        if (missingBraces > 0) {
          fixed += '}'.repeat(missingBraces);
        }
      }

      // Test if the fix worked
      JSON.parse(fixed);
      return fixed;
    } catch {
      return null;
    }
  }

  private ensureUids(nodes: ResumeNode[]): void {
    for (const node of nodes) {
      if (!node.uid) {
        node.uid = generateUid();
      }
      if (node.children && node.children.length > 0) {
        this.ensureUids(node.children);
      }
    }
  }
}
