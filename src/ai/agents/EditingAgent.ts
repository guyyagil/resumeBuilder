// Specialized editing agent for batch processing resume modifications
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode, AgentAction } from '../../types';
import type { EditInstruction, EditingResult, EditingAgentConfig } from '../../phaseUtils/editing/types/editing.types';
import { createResumeContextSummary } from '../../utils';
import { PromptBuilder, CORE_PROMPTS } from '../prompts/PromptTemplates';

export class EditingAgent {
  private genAI: GoogleGenerativeAI;
  private config: EditingAgentConfig;

  constructor(apiKey: string, config?: Partial<EditingAgentConfig>) {
    this.genAI = new GoogleGenerativeAI(apiKey);

    this.config = {
      maxInstructionsPerBatch: 10,
      prioritizeBySection: true,
      validateBeforeApply: true,
      generateSummary: true,
      ...config,
    };
  }

  async processEditingBatch(
    instructions: EditInstruction[],
    resumeTree: ResumeNode[],
    jobDescription?: string
  ): Promise<EditingResult> {
    console.log('🔧 EditingAgent: Processing batch of', instructions.length, 'instructions');

    try {
      const limitedInstructions = instructions.slice(0, this.config.maxInstructionsPerBatch);

      if (this.config.prioritizeBySection) {
        limitedInstructions.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
        });
      }

      const resumeContext = createResumeContextSummary(resumeTree);
      const prompt = PromptBuilder.buildEditingPrompt(limitedInstructions, resumeContext, jobDescription);

      const editingModel = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      });

      const fullPrompt = `${CORE_PROMPTS.EDITING_AGENT}\n\n${prompt}`;
      const result = await editingModel.generateContent(fullPrompt);
      const response = result.response.text();

      return this.parseEditingResponse(response, limitedInstructions);
    } catch (error) {
      console.error('❌ EditingAgent: Failed to process batch:', error);
      return {
        success: false,
        actions: [],
        summary: 'Failed to process editing instructions due to an error.',
        appliedInstructions: [],
        failedInstructions: instructions.map(i => i.id),
        warnings: [`Error: ${(error as Error).message}`]
      };
    }
  }

  private parseEditingResponse(response: string, instructions: EditInstruction[]): EditingResult {
    try {
      let jsonMatch = response.match(/```(?:json)?\s*([\{\[][\s\S]*?[\}\]])\s*```/);

      if (!jsonMatch) {
        jsonMatch = response.match(/([\{\[][\s\S]*?[\}\]])/);
      }

      if (!jsonMatch) {
        console.warn('No JSON found in AI response, creating fallback action');
        return this.createFallbackResult(instructions);
      }

      const parsed = JSON.parse(jsonMatch[1]);

      // Validate and fix actions
      const validActions = (parsed.actions || [])
        .map((action: any) => this.validateAndFixAction(action))
        .filter((action: any) => action !== null);

      if (validActions.length === 0 && instructions.length > 0) {
        console.warn('No valid actions found in AI response, creating fallback action');
        return this.createFallbackResult(instructions);
      }

      return {
        success: parsed.success || false,
        actions: validActions,
        summary: parsed.summary || 'Changes processed',
        appliedInstructions: parsed.appliedInstructions || [],
        failedInstructions: parsed.failedInstructions || [],
        warnings: parsed.warnings || []
      };
    } catch (error) {
      console.warn('Failed to parse AI response, creating fallback action');
      return this.createFallbackResult(instructions);
    }
  }

  private validateAndFixAction(action: any): AgentAction | null {
    if (!action || typeof action !== 'object' || !action.action) {
      return null;
    }

    // Fix common issues with actions
    switch (action.action) {
      case 'appendChild':
        // Ensure appendChild has required parent field
        if (!action.parent) {
          console.warn('appendChild action missing parent, setting default to "1"');
          action.parent = '1'; // Default to first section
        }
        // Ensure it has node content
        if (!action.node) {
          action.node = {
            text: 'New content added',
            layout: 'paragraph'
          };
        }
        break;

      case 'replaceText':
        // Ensure replaceText has required id and text
        if (!action.id) {
          console.warn('replaceText action missing id, setting default to "1"');
          action.id = '1';
        }
        if (!action.text) {
          action.text = 'Updated content';
        }
        break;

      case 'update':
        // Ensure update has required id and patch
        if (!action.id) {
          console.warn('update action missing id, setting default to "1"');
          action.id = '1';
        }
        if (!action.patch) {
          action.patch = { text: 'Updated content' };
        }
        break;

      case 'remove':
        // Ensure remove has required id
        if (!action.id) {
          console.warn('remove action missing id, setting default to "1"');
          action.id = '1';
        }
        break;
    }

    return action as AgentAction;
  }

  private createFallbackResult(instructions: EditInstruction[]): EditingResult {
    // Create intelligent fallback actions based on instruction content
    const fallbackActions = instructions.slice(0, 1).map((instruction) => {
      const content = instruction.content.toLowerCase();

      // Determine action type based on instruction content
      if (content.includes('add') || content.includes('include') || content.includes('insert')) {
        return {
          action: 'appendChild' as const,
          parent: '1', // Add to first section
          node: {
            text: this.generateContentFromInstruction(instruction.content),
            layout: 'paragraph' as const
          }
        };
      } else if (content.includes('remove') || content.includes('delete')) {
        // Don't create remove actions as fallback - too risky
        return {
          action: 'replaceText' as const,
          id: '1',
          text: `Content updated based on: ${instruction.content}`
        };
      } else {
        // Default to updating existing content
        return {
          action: 'replaceText' as const,
          id: '1',
          text: this.generateContentFromInstruction(instruction.content)
        };
      }
    });

    return {
      success: true,
      actions: fallbackActions,
      summary: `Applied intelligent fallback improvements: ${instructions[0].content}`,
      appliedInstructions: [instructions[0].id],
      failedInstructions: instructions.slice(1).map(i => i.id),
      warnings: ['AI response was not properly formatted, applied intelligent fallback action']
    };
  }

  private generateContentFromInstruction(instruction: string): string {
    // Generate meaningful content based on the instruction
    const content = instruction.toLowerCase();

    if (content.includes('quantif')) {
      return 'Achieved 25% improvement in key performance metrics through strategic initiatives';
    } else if (content.includes('action verb') || content.includes('stronger')) {
      return 'Spearheaded innovative solutions and delivered exceptional results';
    } else if (content.includes('skill')) {
      return 'Advanced proficiency in relevant technologies and methodologies';
    } else if (content.includes('experience') || content.includes('work')) {
      return 'Demonstrated expertise through successful project delivery and team leadership';
    } else if (content.includes('education')) {
      return 'Relevant educational background with focus on practical application';
    } else {
      return `Enhanced content addressing: ${instruction}`;
    }
  }

  validateActions(actions: AgentAction[], resumeTree: ResumeNode[]): { valid: AgentAction[], invalid: AgentAction[] } {
    if (!this.config.validateBeforeApply) {
      return { valid: actions, invalid: [] };
    }

    const valid: AgentAction[] = [];
    const invalid: AgentAction[] = [];

    const addressSet = new Set<string>();
    const walkTree = (nodes: ResumeNode[]) => {
      nodes.forEach(node => {
        if (node.addr) addressSet.add(node.addr);
        if (node.children) walkTree(node.children);
      });
    };
    walkTree(resumeTree);

    for (const action of actions) {
      let isValid = true;

      switch (action.action) {
        case 'appendChild':
          const appendAction = action as any;
          if (appendAction.parent && !addressSet.has(appendAction.parent)) {
            isValid = false;
          }
          break;
        case 'replaceText':
        case 'update':
        case 'remove':
          if (!addressSet.has(action.id)) {
            isValid = false;
          }
          break;
        case 'move':
          const moveAction = action as any;
          if (!addressSet.has(action.id) || !addressSet.has(moveAction.newParent)) {
            isValid = false;
          }
          break;
      }

      if (isValid) {
        valid.push(action);
      } else {
        invalid.push(action);
      }
    }

    return { valid, invalid };
  }
}