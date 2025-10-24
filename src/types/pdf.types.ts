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