// Prompt exports - centralized prompt management using PromptTemplates only

// Main prompt builder - single source of truth
export { PromptBuilder, CORE_PROMPTS } from './PromptTemplates';

// Legacy exports for backward compatibility
export { 
  RESUME_STRUCTURING_PROMPT, 
  RESUME_AGENT_SYSTEM_PROMPT, 
  EDITING_AGENT_SYSTEM_PROMPT 
} from './PromptTemplates';