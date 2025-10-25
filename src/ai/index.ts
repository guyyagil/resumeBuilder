// AI Module - Centralized exports for all AI-related functionality

// Agents
export { DesignAgent } from './agents/DesignAgent';
export { CVProcessingAgent } from './agents/CVProcessingAgent';
export type { CVProcessingResult } from './agents/CVProcessingAgent';
export { TailoringAgent } from './agents/TailoringAgent';

// Clients
export { GeminiService } from './clients/GeminiClient';
export type { GeminiResponse, ChatMessage } from './clients/GeminiClient';

// Prompts
export * from './prompts';

// Types
export type {
  AIModel,
  AIServiceConfig,
  AIPromptTemplate,
  ResumeProcessingResult,
  ChatRequest,
  ChatResponse,
  DesignGenerationRequest,
  DesignGenerationResult,
  AIServiceError
} from './types';

// Legacy exports for backward compatibility
export { 
  RESUME_STRUCTURING_PROMPT, 
  RESUME_AGENT_SYSTEM_PROMPT, 
  EDITING_AGENT_SYSTEM_PROMPT 
} from './prompts/PromptTemplates';

