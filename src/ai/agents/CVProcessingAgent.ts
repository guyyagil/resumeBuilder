// CV/Resume Processing Agent - Handles PDF extraction and AI structuring
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { GoogleGenAI } from '@google/genai';
import type { ResumeNode } from '../../types';
import { detectTextDirection, detectLanguage, ensureUids } from '../../utils';
import { PromptBuilder } from '../prompts/PromptTemplates';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface CVProcessingResult {
    tree: ResumeNode[];
    title: string;
    textDirection: 'ltr' | 'rtl';
    language: string;
    metadata: {
        pageCount: number;
        wordCount: number;
        extractedText: string;
    };
}

export class CVProcessingAgent {
    private genAI: GoogleGenAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenAI({ apiKey });
    }

    /**
     * Process a CV/Resume PDF file and extract structured data
     */
    async processCV(file: File, jobDescription?: string): Promise<CVProcessingResult> {
        console.log('📄 CVProcessingAgent: Starting CV processing...');

        // Step 1: Extract text from PDF
        const { text, pageCount } = await this.extractTextFromPDF(file);
        console.log('✅ CVProcessingAgent: Extracted text length:', text.length);

        if (text.length < 50) {
            throw new Error('PDF text is too short. Please upload a valid resume.');
        }

        // Step 2: Use AI to structure the resume
        const { tree, title } = await this.structureResumeWithAI(text, jobDescription);
        console.log('✅ CVProcessingAgent: AI generated tree with', this.countNodes(tree), 'nodes');

        // Step 3: Detect language and text direction
        const textDirection = detectTextDirection(text);
        const language = detectLanguage(text);

        return {
            tree,
            title,
            textDirection,
            language,
            metadata: {
                pageCount,
                wordCount: text.split(/\s+/).length,
                extractedText: text
            }
        };
    }

    /**
     * Extract text content from PDF file
     */
    private async extractTextFromPDF(file: File): Promise<{ text: string; pageCount: number }> {
        console.log('📄 CVProcessingAgent: Extracting text from PDF...');

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const pageCount = pdf.numPages;

        for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return {
            text: fullText.trim(),
            pageCount
        };
    }

    /**
     * Use AI to structure the resume text into a tree
     */
    private async structureResumeWithAI(text: string, jobDescription?: string): Promise<{ tree: ResumeNode[]; title: string }> {
        console.log('🤖 CVProcessingAgent: Structuring resume with AI...');
        console.log('📊 Input text length:', text.length);

        const prompt = PromptBuilder.buildPDFStructurePrompt(text, jobDescription);

        try {
            const result = await this.genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.2, // Lower for more accurate extraction
                    topP: 0.9,
                    topK: 30,
                    maxOutputTokens: 16384, // Increased for larger resumes
                    thinkingConfig: {
                        thinkingBudget: 8192,
                    },
                },
            });
            const response = result.text || '';

            if (!response) {
                throw new Error('No response from AI');
            }

            console.log('📥 Received AI response, length:', response.length);

            // Clean and parse the response
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
            }

            const parsed = JSON.parse(cleanResponse);

            // Validation logging
            console.log('✅ JSON parsed successfully');
            console.log('📋 Extracted title:', parsed.title);
            console.log('📂 Number of sections:', parsed.sections?.length || 0);

            if (parsed.sections) {
                parsed.sections.forEach((section: any, index: number) => {
                    console.log(`  Section ${index + 1}: ${section.text || section.title || 'Unnamed'} (${section.children?.length || 0} children)`);
                });
            }

            const tree = this.convertToResumeNodes(parsed.sections);

            // Add UIDs to all nodes (system-generated, not from AI)
            ensureUids(tree);

            console.log('🌳 Converted to tree with', this.countNodes(tree), 'total nodes');

            return {
                tree,
                title: parsed.title || 'Resume'
            };
        } catch (error) {
            console.error('❌ CVProcessingAgent: AI structuring failed:', error);
            console.error('❌ Error details:', error instanceof Error ? error.message : String(error));

            // Fallback: create a simple structure
            console.warn('⚠️ Using fallback structure');
            const fallbackTree = this.createFallbackStructure(text);
            ensureUids(fallbackTree);
            return {
                tree: fallbackTree,
                title: 'Resume'
            };
        }
    }

    /**
     * Convert AI response sections to ResumeNode tree with full metadata support
     * Note: uid and addr are NOT generated here - they're added later by the system
     */
    private convertToResumeNodes(sections: any[]): ResumeNode[] {
        return sections.map((section) => {
            const node: ResumeNode = {
                layout: section.type as any,
                text: section.text,
                title: section.title,
                style: section.style,
                meta: section.meta,
                children: section.children ? this.convertChildNodes(section.children) : undefined
            };

            // Clean up undefined fields
            if (!node.text) delete node.text;
            if (!node.title) delete node.title;
            if (!node.style) delete node.style;
            if (!node.meta) delete node.meta;
            if (!node.children || node.children.length === 0) delete node.children;

            return node;
        });
    }

    /**
     * Convert child nodes recursively with full metadata and content support
     * Note: uid and addr are NOT generated here - they're added later by the system
     */
    private convertChildNodes(children: any[]): ResumeNode[] {
        return children.map((child) => {
            const node: ResumeNode = {
                layout: child.type as any,
                text: child.text,
                title: child.title,
                style: child.style,
                meta: child.meta,
                children: child.children ? this.convertChildNodes(child.children) : undefined
            };

            // Clean up undefined fields
            if (!node.text) delete node.text;
            if (!node.title) delete node.title;
            if (!node.style) delete node.style;
            if (!node.meta) delete node.meta;
            if (!node.children || node.children.length === 0) delete node.children;

            return node;
        });
    }

    /**
     * Create a fallback structure when AI fails
     * Note: uid and addr will be added by the system later
     */
    private createFallbackStructure(text: string): ResumeNode[] {
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        return [{
            layout: 'heading',
            text: 'Resume Content',
            children: lines.slice(0, 10).map((line) => ({
                layout: 'paragraph' as const,
                text: line.trim()
            }))
        }];
    }

    /**
     * Count total nodes in the tree
     */
    private countNodes(tree: ResumeNode[]): number {
        let count = 0;
        const walk = (nodes: ResumeNode[]) => {
            nodes.forEach(node => {
                count++;
                if (node.children) walk(node.children);
            });
        };
        walk(tree);
        return count;
    }
}