import { useState, type ChangeEvent } from 'react';
import { useAppStore } from '../store';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const ResumeUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initializeFromPDF } = useAppStore();

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    const apiKey = GEMINI_API_KEY;

    if (!apiKey) {
      setError('Gemini API key is not configured.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await initializeFromPDF(file, '');
    } catch (err) {
      console.error('Upload error:', err);
      setError((err as Error).message || 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-12 text-center transition-all bg-gray-50 hover:bg-blue-50/50">
        <input
          id="resume-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
        <label htmlFor="resume-upload" className="cursor-pointer block">
          {isUploading ? (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
              <p className="text-gray-700 font-medium">Parsing resume...</p>
              <p className="text-sm text-gray-500">
                Extracting content and building structured tree
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Drop your resume PDF here
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  or click to browse files
                </p>
              </div>
            </div>
          )}
        </label>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        Supported format: PDF • Your resume will be parsed automatically
      </p>
    </div>
  );
};
