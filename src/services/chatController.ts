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
    
    // Add user message to chat
    store.addMessage({
      role: 'user',
      content: userMessage
    });
    
    store.setProcessing(true);
    
    try {
      // Get conversation history (last 10 messages)
      const history = store.messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Ensure numbering is up to date
      store.recomputeNumbering();
      
      // Process with AI
      const result = await this.geminiService.processUserMessage(
        userMessage,
        store.resumeTree,
        store.jobDescription,
        history
      );
      
      // Add AI response
      store.addMessage({
        role: 'assistant',
        content: result.explanation,
        action: result.action
      });
      
      // Apply action if present
      if (result.action) {
        store.applyAction(result.action, this.getActionDescription(result.action));
      }
    } catch (error) {
      console.error('Chat error:', error);
      store.addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
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
        store.jobDescription
      );
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }
  
  private getActionDescription(action: AgentAction): string {
    switch (action.action) {
      case 'replace':
        return `Updated content at ${action.id}`;
      case 'appendBullet':
        return `Added bullet to ${action.id}`;
      case 'appendItem':
        return `Added new item to ${action.id}`;
      case 'appendSection':
        return `Added section: ${action.title}`;
      case 'remove':
        return `Removed ${action.id}`;
      case 'move':
        return `Moved ${action.id} to ${action.newParent}`;
      case 'reorder':
        return `Reordered children of ${action.id}`;
      case 'updateMeta':
        return `Updated metadata for ${action.id}`;
      default:
        return 'Applied change';
    }
  }
}
