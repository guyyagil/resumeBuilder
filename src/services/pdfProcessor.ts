// Clean, simple PDF to Resume Tree processor
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ResumeNode, AgentAction } from '../types';
import { GeminiService } from './geminiService';
import { computeNumbering } from '../utils/numbering';
import { generateUid } from '../utils/treeUtils';

// Set up PDF.js worker - use Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PDFProcessor {
    private geminiService: GeminiService;

    constructor(apiKey: string) {
        this.geminiService = new GeminiService(apiKey);
    }

    /**
     * Main entry point: PDF file -> Resume tree
     */
    async processResume(file: File): Promise<ResumeNode[]> {
        console.log('📄 Starting PDF processing...');

        // Step 1: Extract text from PDF
        const text = await this.extractTextFromPDF(file);
        console.log('✅ Extracted text:', text.substring(0, 200) + '...');

        if (text.length < 50) {
            throw new Error('PDF text is too short. Please upload a valid resume.');
        }

        // Step 2: Convert PDF to images for visual analysis
        const images = await this.convertPDFToImages(file);
        console.log('✅ Converted PDF to', images.length, 'images');

        // Step 3: AI converts text + images to actions
        const actions = await this.geminiService.structureResumeFromTextAndImages(text, images);
        console.log('✅ AI generated', actions.length, 'actions');

        // Step 4: Build tree from actions
        const tree = this.buildTreeFromActions(actions);
        console.log('✅ Built tree with', this.countNodes(tree), 'nodes');

        return tree;
    }

    /**
     * Extract text from PDF file
     */
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

    /**
     * Convert PDF pages to images for visual analysis
     */
    private async convertPDFToImages(file: File): Promise<string[]> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const images: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);

            // Set scale for good quality (2 = 2x resolution)
            const scale = 2;
            const viewport = page.getViewport({ scale });

            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not get canvas context');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page to canvas
            await page.render({
                canvasContext: context,
                canvas: canvas,
                viewport: viewport
            }).promise;

            // Convert canvas to base64 image
            const imageData = canvas.toDataURL('image/png');
            // Extract base64 data (remove "data:image/png;base64," prefix)
            const base64Data = imageData.split(',')[1];
            images.push(base64Data);
        }

        return images;
    }

    /**
     * Build tree from action array
     */
    private buildTreeFromActions(actions: AgentAction[]): ResumeNode[] {
        const tree: ResumeNode[] = [];

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            console.log(`🔧 Action ${i + 1}/${actions.length}:`, action.action, action);

            try {
                // Recompute numbering BEFORE each action so addresses are up to date
                const numbering = computeNumbering(tree);
                this.applyAction(tree, action, numbering);
            } catch (error) {
                console.error(`❌ Failed at action ${i + 1}:`, action, error);
                throw new Error(`Failed to process resume at step ${i + 1}: ${(error as Error).message}`);
            }
        }

        // Validate final tree
        this.validateTree(tree);

        return tree;
    }

    /**
     * Apply a single action to the tree
     */
    private applyAction(tree: ResumeNode[], action: AgentAction, numbering: any): void {
        switch (action.action) {
            case 'appendSection':
                this.appendSection(tree, action);
                break;

            case 'appendItem':
                this.appendItem(tree, action, numbering);
                break;

            case 'appendBullet':
                this.appendBullet(tree, action, numbering);
                break;

            default:
                console.warn('Unknown action type:', action.action);
        }
    }

    /**
     * Add a new section to root
     */
    private appendSection(tree: ResumeNode[], action: any): void {
        if (!action.title) {
            throw new Error('appendSection requires "title"');
        }

        tree.push({
            uid: generateUid(),
            title: action.title,
            layout: action.layout,
            meta: { type: 'section' },
            children: []
        });

        console.log(`  ✅ Created section: "${action.title}"${action.layout ? ` with layout: ${action.layout}` : ''}`);
    }

    /**
     * Add an item to a section
     */
    private appendItem(tree: ResumeNode[], action: any, numbering: any): void {
        if (!action.id || !action.title) {
            throw new Error('appendItem requires "id" and "title"');
        }

        const parentId = action.id;
        const parentUid = numbering.addrToUid[parentId];
        if (!parentUid) {
            throw new Error(`Parent section ${action.id} not found. Available addresses: ${Object.keys(numbering.addrToUid).join(', ')}`);
        }

        const parent = this.findNode(tree, parentUid);
        if (!parent) {
            throw new Error(`Parent section ${action.id} not found in tree`);
        }

        if (!parent.children) {
            parent.children = [];
        }

        parent.children.push({
            uid: generateUid(),
            title: action.title,
            content: action.content,
            meta: { type: 'item', ...action.meta },
            children: []
        });

        console.log(`  ✅ Added item to ${action.id}: "${action.title}"`);
    }

    /**
     * Add a bullet to an item
     */
    private appendBullet(tree: ResumeNode[], action: any, numbering: any): void {
        if (!action.id || !action.text) {
            throw new Error('appendBullet requires "id" and "text"');
        }

        const parentId = action.id;
        const parentUid = numbering.addrToUid[parentId];

        if (!parentUid) {
            console.warn(`  ⚠️ Parent item ${action.id} not found, skipping bullet: "${action.text}". Available: ${Object.keys(numbering.addrToUid).join(', ')}`);
            return; // Skip instead of failing
        }

        const parent = this.findNode(tree, parentUid);
        if (!parent) {
            console.warn(`  ⚠️ Parent item ${action.id} not in tree, skipping bullet`);
            return;
        }

        if (!parent.children) {
            parent.children = [];
        }

        parent.children.push({
            uid: generateUid(),
            title: action.text,
            content: action.text,
            meta: { type: 'bullet' }
        });

        console.log(`  ✅ Added bullet to ${action.id}`);
    }

    /**
     * Find a node by UID
     */
    private findNode(tree: ResumeNode[], uid: string): ResumeNode | null {
        for (const node of tree) {
            if (node.uid === uid) return node;
            if (node.children) {
                const found = this.findNode(node.children, uid);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Validate the tree structure
     */
    private validateTree(tree: ResumeNode[]): void {
        const errors: string[] = [];

        const walk = (nodes: ResumeNode[], path: string = 'root') => {
            nodes.forEach((node, idx) => {
                const currentPath = `${path}[${idx}]`;

                if (!node.uid) {
                    errors.push(`${currentPath}: Missing uid`);
                }
                if (!node.title) {
                    errors.push(`${currentPath}: Missing title`);
                }

                if (node.children) {
                    walk(node.children, currentPath);
                }
            });
        };

        walk(tree);

        if (errors.length > 0) {
            throw new Error(`Invalid tree structure: ${errors.join(', ')}`);
        }
    }

    /**
     * Count total nodes in tree
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
