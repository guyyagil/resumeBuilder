// API-related types for external service integrations

import type { ResumeNode, AgentAction } from './core.types';
import type { ApiResponse } from './common.types';

// AI Service Types
export type AIModel = 'gemini-2.5-flash' | 'gemini-pro' | 'gpt-4' | 'claude-3';

export type AIServiceConfig = {
  model: AIModel;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
};

export type AIPromptTemplate = {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: 'structuring' | 'editing' | 'chat' | 'design';
};

// PDF Processing Types
export type PDFProcessingResult = {
  text: string;
  images?: string[];  // Base64 encoded images
  metadata: {
    pageCount: number;
    title?: string;
    author?: string;
    creationDate?: string;
  };
};

// Resume Processing Types
export type ResumeProcessingResult = {
  tree: ResumeNode[];
  title: string;
  textDirection: 'ltr' | 'rtl';
  language: string;
  confidence: number;  // 0-1 confidence score
};

// Chat Service Types
export type ChatRequest = {
  message: string;
  context: {
    resumeTree: ResumeNode[];
    jobDescription?: string;
    conversationHistory: ChatMessage[];
  };
};

export type ChatResponse = ApiResponse<{
  message: string;
  action?: AgentAction;
  suggestions?: string[];
}>;

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;
};

// Design Service Types
export type DesignGenerationRequest = {
  resumeTree: ResumeNode[];
  title: string;
  templateId: string;
  jobDescription?: string;
  customizations?: Record<string, any>;
};

export type DesignGenerationResult = {
  html: string;
  css: string;
  templateId: string;
  generatedAt: number;
  metadata: {
    wordCount: number;
    estimatedPages: number;
    colorScheme: string[];
    fonts: string[];
  };
};

// Export Service Types
export type ExportRequest = {
  format: 'pdf' | 'html' | 'docx';
  content: string;  // HTML content
  options: {
    pageSize?: 'A4' | 'Letter';
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    quality?: 'low' | 'medium' | 'high';
  };
};

export type ExportResult = ApiResponse<{
  blob: Blob;
  filename: string;
  size: number;
}>;

// Error Types
export type AIServiceError = {
  code: 'API_KEY_INVALID' | 'RATE_LIMIT' | 'MODEL_UNAVAILABLE' | 'PARSING_ERROR' | 'NETWORK_ERROR';
  message: string;
  details?: Record<string, any>;
};

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};