// CV/Resume Processing Agent - Handles PDF extraction and AI structuring
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode } from '../../types';
import { detectTextDirection, detectLanguage } from '../../utils';
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
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
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

        // Step 3: Apply basic styling
        this.applyBasicStyling(tree);

        // Step 4: Detect language and text direction
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

        const prompt = PromptBuilder.buildPDFStructurePrompt(text, jobDescription);

        const structureModel = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.3,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 12000
            }
        });

        const fullPrompt = prompt;

        try {
            const result = await structureModel.generateContent(fullPrompt);
            const response = result.response.text();

            if (!response) {
                throw new Error('No response from AI');
            }

            // Clean and parse the response
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
            }

            const parsed = JSON.parse(cleanResponse);
            const tree = this.convertToResumeNodes(parsed.sections);

            return {
                tree,
                title: parsed.title || 'Resume'
            };
        } catch (error) {
            console.error('❌ CVProcessingAgent: AI structuring failed:', error);

            // Fallback: create a simple structure
            return {
                tree: this.createFallbackStructure(text),
                title: 'Resume'
            };
        }
    }

    /**
     * Convert AI response sections to ResumeNode tree
     */
    private convertToResumeNodes(sections: any[]): ResumeNode[] {
        return sections.map((section, index) => {
            const node: ResumeNode = {
                uid: this.generateUid(),
                addr: (index + 1).toString(),
                layout: section.type as any,
                text: section.text,
                children: section.children ? this.convertChildNodes(section.children, (index + 1).toString()) : undefined
            };
            return node;
        });
    }

    /**
     * Convert child nodes recursively
     */
    private convertChildNodes(children: any[], parentAddr: string): ResumeNode[] {
        return children.map((child, index) => {
            const childAddr = `${parentAddr}.${index + 1}`;
            const node: ResumeNode = {
                uid: this.generateUid(),
                addr: childAddr,
                layout: child.type as any,
                text: child.text,
                children: child.children ? this.convertChildNodes(child.children, childAddr) : undefined
            };
            return node;
        });
    }

    /**
     * Create a fallback structure when AI fails
     */
    private createFallbackStructure(text: string): ResumeNode[] {
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        return [{
            uid: this.generateUid(),
            addr: '1',
            layout: 'heading',
            text: 'Resume Content',
            children: lines.slice(0, 10).map((line, index) => ({
                uid: this.generateUid(),
                addr: `1.${index + 1}`,
                layout: 'paragraph' as const,
                text: line.trim()
            }))
        }];
    }

    /**
     * Apply basic styling to the resume tree
     */
    private applyBasicStyling(tree: ResumeNode[]): void {
        const applyStyles = (nodes: ResumeNode[], depth: number) => {
            for (const node of nodes) {
                if (!node.style) {
                    if (depth === 0) {
                        // Section headers
                        node.style = {
                            level: 1,
                            weight: 'bold',
                            fontSize: '18px',
                            color: '#1a1a1a',
                            marginBottom: '16px',
                            borderBottom: '2px solid #333',
                            paddingBottom: '4px'
                        };
                    } else if (depth === 1) {
                        // Sub-items
                        node.style = {
                            level: 2,
                            weight: 'semibold',
                            fontSize: '14px',
                            color: '#2d3748',
                            marginBottom: '8px'
                        };
                    } else {
                        // Details
                        node.style = {
                            weight: 'regular',
                            fontSize: '12px',
                            color: '#4a5568',
                            marginBottom: '4px',
                            lineHeight: 1.6
                        };
                    }
                }

                if (node.children) {
                    applyStyles(node.children, depth + 1);
                }
            }
        };

        applyStyles(tree, 0);
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

    /**
     * Generate a unique identifier
     */
    private generateUid(): string {
        return `uid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}