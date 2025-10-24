// Simple PDF processor - text only, no complex analysis
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ResumeNode } from '../types';
import { GeminiService } from '../ai';
// generateUid is used by GeminiService when building the tree
import { detectTextDirection, detectLanguage } from '../utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class SimplePDFProcessor {
    private geminiService: GeminiService;

    constructor(apiKey: string) {
        this.geminiService = new GeminiService(apiKey);
    }

    async processResume(file: File): Promise<{ tree: ResumeNode[], title: string, textDirection: 'ltr' | 'rtl', language: string }> {
        console.log('📄 Starting simple PDF processing...');

        // Step 1: Extract clean text
        const text = await this.extractTextFromPDF(file);
        console.log('✅ Extracted text length:', text.length);

        if (text.length < 50) {
            throw new Error('PDF text is too short. Please upload a valid resume.');
        }

        // Step 2: Let AI handle everything - structure detection, title extraction
        const { tree, title } = await this.geminiService.structureResumeFromText(text);
        console.log('✅ AI generated tree with', this.countNodes(tree), 'nodes');

        // Step 3: Apply minimal default styling
        this.applyBasicStyling(tree);

        // Step 4: Detect text direction and language
        const textDirection = detectTextDirection(text);
        const language = detectLanguage(text);

        return { tree, title, textDirection, language };
    }

    private async extractTextFromPDF(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    }

    private applyBasicStyling(tree: ResumeNode[]): void {
        const applyStyles = (nodes: ResumeNode[], depth: number) => {
            for (const node of nodes) {
                if (!node.style) {
                    if (depth === 0) {
                        // Sections
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
                        // Items
                        node.style = {
                            level: 2,
                            weight: 'semibold',
                            fontSize: '14px',
                            color: '#2d3748',
                            marginBottom: '8px'
                        };
                    } else {
                        // Bullets
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