// Export Service Types
import type { ApiResponse } from './app.types';

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

export type ExportValidationError = {
  field: string;
  message: string;
  code: string;
};