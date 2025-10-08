// chatController.ts

import { useAppStore } from '../store/useAppStore';
import { GeminiService } from './geminiService';
import type { AgentAction } from '../types';

export class ChatController {
  private geminiService: GeminiService;

  constructor(apiKey: string) {
    this.geminiService = new GeminiService(apiKey);
  }

  async sendMessage(userMessage: string): Promise<void> {
    const store = useAppStore.getState();

    store.addMessage({ role: 'user', content: userMessage });
    store.setProcessing(true);

    try {
      const history = store.messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const result = await this.geminiService.processUserMessage(
        userMessage,
        store.resumeTree,
        store.jobDescription,
        history,
      );

      console.log('💬 Chat result:', result);
      console.log('🎯 Has action?', !!result.action);

      store.addMessage({
        role: 'assistant',
        content: result.explanation,
        action: result.action,
      });

      if (result.action) {
        console.log('✨ Applying action:', result.action);
        try {
          store.applyAction(result.action, this.describeAction(result.action));
          console.log('✅ Action applied successfully');
        } catch (error) {
          console.error('❌ Failed to apply action:', error);
          throw error;
        }
      } else {
        console.log('ℹ️ No action to apply');
      }
    } catch (error) {
      console.error('Chat error:', error);
      store.addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      });
    } finally {
      store.setProcessing(false);
    }
  }

  async getSuggestions(): Promise<string[]> {
    const store = useAppStore.getState();

    try {
      return await this.geminiService.generateSuggestions(
        store.resumeTree,
        store.jobDescription,
      );
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  private describeAction(action: AgentAction | any): string {
    switch (action.action) {
      case 'appendChild':
        const appendAction = action as any;
        const content = appendAction.node?.title || appendAction.node?.text || '';
        return `Added "${content}" to ${appendAction.parent}`;
        
      case 'insertSibling':
        const insertAction = action as any;
        const insertContent = insertAction.node?.title || insertAction.node?.text || '';
        return `Inserted "${insertContent}" after ${insertAction.after}`;
        
      case 'replaceText':
        return `Updated text at ${action.id}`;
        
      case 'update':
        const updateAction = action as any;
        const fields = Object.keys(updateAction.patch || {}).join(', ');
        return `Updated ${fields} for ${action.id}`;
        
      case 'remove':
        return `Removed ${action.id}`;
        
      case 'move':
        return `Moved ${action.id} to ${action.newParent}`;
        
      case 'reorder':
        return `Reordered children of ${action.id}`;
        
      // Legacy action support
      case 'append':
        const legacyAppendAction = action as any;
        const legacyContent = legacyAppendAction.content || '';
        if (legacyAppendAction.parent) {
          return `Added "${legacyContent}" to ${legacyAppendAction.parent}`;
        } else {
          return `Added new section: "${legacyContent}"`;
        }
        
      case 'replace':
        const legacyReplaceAction = action as any;
        return `Updated content at ${legacyReplaceAction.id}`;
        
      case 'updateMeta':
        const legacyUpdateAction = action as any;
        return `Updated metadata for ${legacyUpdateAction.id}`;
        
      default:
        return 'Applied change';
    }
  }
}
