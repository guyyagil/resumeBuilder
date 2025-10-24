// AI Module - Centralized exports for all AI-related functionality

// Agents
export { DesignAgent } from './agents/DesignAgent';
export { EditingAgent } from './agents/EditingAgent';

// Clients
export { GeminiService } from './clients/GeminiClient';
export type { GeminiResponse, ChatMessage } from './clients/GeminiClient';

// Prompts
export { PromptBuilder, CORE_PROMPTS, LANGUAGE_PROMPTS, TASK_PROMPTS } from './prompts/PromptTemplates';

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

// Additional legacy prompts
export { 
  JOB_TAILORING_SYSTEM_ADDITION 
} from './prompts/legacy-prompts';