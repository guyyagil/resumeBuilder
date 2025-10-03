import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PdfToTreeService, extractPdfText } from '../services/pdfToTreeService';

const MAX_SIZE_MB = 10;

interface TreeWelcomeFormProps {
    onComplete: () => void;
}

export const TreeWelcomeForm: React.FC<TreeWelcomeFormProps> = ({ onComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [jobText, setJobText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { setResumeTree, setJobDescription } = useAppStore();

    // Initialize PDF to tree service
    const pdfService = new PdfToTreeService(
        import.meta.env.VITE_GEMINI_API_KEY || ''
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) onSelectFile(f);
    };

    const onSelectFile = (f: File) => {
        if (f.type !== 'application/pdf') {
            setError('Please upload a PDF file only');
            return;
        }

        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File size must be less than ${MAX_SIZE_MB}MB`);
            return;
        }

        setError(null);
        setFile(f);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const f = e.dataTransfer.files?.[0];
        if (f) onSelectFile(f);
    };

    const prevent = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSkipPdf = async () => {
        // For development - use sample data
        const { createSampleResumeTree } = await import('../utils/sampleTreeData');
        setResumeTree(createSampleResumeTree());
        onComplete();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please upload a PDF file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Extract text from PDF
            console.log('📄 Extracting text from PDF...');
            const pdfText = await extractPdfText(file);
            console.log('✅ PDF text extracted:', pdfText.substring(0, 200) + '...');

            // Step 2: Set job description if provided
            if (jobText.trim()) {
                setJobDescription(jobText.trim());
            }

            // Step 3: Convert PDF text to tree structure using AI
            console.log('🤖 Converting PDF to tree structure...');
            const resumeTree = await pdfService.convertPdfTextToTree(
                pdfText,
                jobText.trim() || undefined
            );
            console.log('✅ Tree structure created:', resumeTree);

            // Step 4: Apply tree to store
            setResumeTree(resumeTree);

            // Step 5: Complete welcome flow
            onComplete();

        } catch (err) {
            console.error('❌ Error processing PDF:', err);
            setError(err instanceof Error ? err.message : 'Unexpected error processing PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        AI Resume Builder
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Upload your resume PDF and let AI help you optimize it for your target job.
                    </p>
                </header>

                <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* PDF Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Upload Your Resume (PDF)
                        </label>

                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
                                ? 'border-blue-400 bg-blue-50'
                                : file
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDrop={handleDrop}
                            onDragOver={(e) => { prevent(e); setDragActive(true); }}
                            onDragEnter={(e) => { prevent(e); setDragActive(true); }}
                            onDragLeave={(e) => { prevent(e); setDragActive(false); }}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={handleFileInput}
                            />

                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    {file ? (
                                        <div className="text-green-600">
                                            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(1)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="font-medium">
                                                Drag and drop your PDF here
                                            </p>
                                            <p className="text-sm">or click to select</p>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-gray-400">
                                    PDF up to {MAX_SIZE_MB}MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Target Job Description (Optional)
                        </label>
                        <textarea
                            value={jobText}
                            onChange={(e) => setJobText(e.target.value)}
                            placeholder="Paste the job description here to get tailored optimization suggestions..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Adding a job description helps AI optimize your resume for that specific role
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex flex-col items-center gap-3">
                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Processing Resume...
                                </div>
                            ) : (
                                'Start Building with AI'
                            )}
                        </button>

                        {/* Development: Skip PDF option */}
                        {import.meta.env.DEV && (
                            <button
                                type="button"
                                onClick={handleSkipPdf}
                                className="w-full bg-gray-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                            >
                                Skip PDF (Use Sample Data)
                            </button>
                        )}

                        {!file && !import.meta.env.DEV && (
                            <span className="text-xs text-gray-500">
                                PDF file required to continue
                            </span>
                        )}
                    </div>
                </form>

                {/* Loading Progress */}
                {loading && (
                    <div className="mt-6 bg-white rounded-lg p-4 shadow-lg">
                        <div className="flex items-center text-sm text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                            <div>
                                <p className="font-medium">Processing your resume...</p>
                                <p className="text-xs text-gray-500">
                                    AI is analyzing your PDF and creating an optimized structure
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};