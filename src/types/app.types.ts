// Application-wide types

export type AppPhase =
  | 'welcome'              // Initial state, showing upload form
  | 'processing'           // Parsing PDF and building tree
  | 'editing'              // Manual editing with AI chat assistance
  | 'layout-selection'     // Choosing layout structure
  | 'color-selection'      // Choosing color scheme
  | 'designing'            // Generating final visual design
  | 'active'               // Final resume with design preview
  | 'error';               // Error state with retry option

export type ProcessingStage = 
  | 'extracting'   // Extracting text from PDF
  | 'structuring'  // Converting to tree structure
  | null;

export type TextDirection = 'ltr' | 'rtl';

export type Priority = 'low' | 'medium' | 'high';

export type Status = 'pending' | 'processing' | 'completed' | 'failed';

export type MessageRole = 'user' | 'assistant' | 'system';

// Generic API response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
};

// Generic async operation state
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// File upload types
export type FileUploadState = {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
};

// Export format options
export type ExportFormat = 'pdf' | 'html' | 'docx' | 'json';

// Theme and styling
export type Theme = 'light' | 'dark' | 'auto';

export type ColorScheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
};