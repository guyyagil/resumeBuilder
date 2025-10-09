// PDF processing service - moved from simplePdfProcessor.ts
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ResumeNode } from '../../types';
import { OpenAIService } from '../ai/OpenAIClient';
import { detectTextDirection, detectLanguage } from '../../utils/languageDetection';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class SimplePDFProcessor {
    private openaiService: OpenAIService;

    constructor(apiKey: string) {
        this.openaiService = new OpenAIService(apiKey);
    }

    async processResume(file: File): Promise<{ tree: ResumeNode[], title: string, textDirection: 'ltr' | 'rtl', language: string }> {
        console.log('📄 Starting PDF processing...');

        const text = await this.extractTextFromPDF(file);
        console.log('✅ Extracted text length:', text.length);

        if (text.length < 50) {
            throw new Error('PDF text is too short. Please upload a valid resume.');
        }

        const structuredData = await this.openaiService.generateResumeStructure(text);
        const tree = this.convertToResumeNodes(structuredData.sections);
        const title = structuredData.title;
        console.log('✅ AI generated tree with', this.countNodes(tree), 'nodes');

        this.applyBasicStyling(tree);

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
                        node.style = {
                            level: 2,
                            weight: 'semibold',
                            fontSize: '14px',
                            color: '#2d3748',
                            marginBottom: '8px'
                        };
                    } else {
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

    private convertToResumeNodes(sections: any[]): ResumeNode[] {
        return sections.map((section, index) => {
            const node: ResumeNode = {
                uid: `node_${Date.now()}_${index}`,
                addr: (index + 1).toString(),
                layout: section.type as any,
                text: section.text,
                children: section.children ? this.convertChildNodes(section.children, (index + 1).toString()) : undefined
            };
            return node;
        });
    }

    private convertChildNodes(children: any[], parentAddr: string): ResumeNode[] {
        return children.map((child, index) => {
            const childAddr = `${parentAddr}.${index + 1}`;
            const node: ResumeNode = {
                uid: `node_${Date.now()}_${parentAddr}_${index}`,
                addr: childAddr,
                layout: child.type as any,
                text: child.text,
                children: child.children ? this.convertChildNodes(child.children, childAddr) : undefined
            };
            return node;
        });
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