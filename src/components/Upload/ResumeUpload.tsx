import { useState, type ChangeEvent } from 'react';
import { useAppStore } from '../../store/useAppStore';

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
  await initializeFromPDF(file, apiKey);
    } catch (err) {
      console.error('Upload error:', err);
      setError((err as Error).message || 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
            <div className="animate-pulse">
              <p className="text-gray-600">Parsing resume...</p>
              <p className="text-xs text-gray-400 mt-1">
                Extracting content and building structured tree
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Drop your resume PDF here
              </p>
              <p className="text-sm text-gray-500 mt-2">
                We'll extract the content and build a structured version automatically
              </p>
            </div>
          )}
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Supported format: PDF (max 10 pages)</p>
        <p className="mt-1">
          Your resume will be parsed and structured automatically using AI
        </p>
      </div>
    </div>
  );
};
