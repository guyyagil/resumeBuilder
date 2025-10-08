// Clean, simple PDF to Resume Tree processor
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ResumeNode, AgentAction } from '../types';
import { GeminiService } from './geminiService';
import { computeNumbering } from '../utils/numbering';
import { generateUid } from '../utils/treeUtils';
import { detectTextDirection, detectLanguage } from '../utils/languageDetection';

// Set up PDF.js worker - use Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Enhanced text item with styling information
interface StyledTextItem {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontName: string;
    fontWeight: number;
    color: string;
}

export class PDFProcessor {
    private geminiService: GeminiService;

    constructor(apiKey: string) {
        this.geminiService = new GeminiService(apiKey);
    }

    /**
     * Main entry point: PDF file -> Resume tree, title, and text direction
     */
    async processResume(file: File): Promise<{ tree: ResumeNode[], title: string, textDirection: 'ltr' | 'rtl', language: string }> {
        console.log('📄 Starting PDF processing...');

        // Step 1: Extract text from PDF
        const text = await this.extractTextFromPDF(file);
        console.log('✅ Extracted text:', text.substring(0, 200) + '...');

        if (text.length < 50) {
            throw new Error('PDF text is too short. Please upload a valid resume.');
        }

        // Step 2: Extract styled text metadata
        const styledText = await this.extractStyledTextFromPDF(file);
        console.log('✅ Extracted', styledText.length, 'styled text items');

        // Analyze text styles to provide summary to AI
        const styleSummary = this.analyzeStyles(styledText);
        console.log('✅ Style summary:', styleSummary);

        // Step 3: Convert PDF to images for visual analysis
        const images = await this.convertPDFToImages(file);
        console.log('✅ Converted PDF to', images.length, 'images');

        // Step 4: AI converts text + images + style info to tree structure and extracts title
        // AI focuses on content hierarchy only, not layout
        const { tree, title } = await this.geminiService.structureResumeFromTextAndImages(
            text,
            images,
            styleSummary
        );
        console.log('✅ AI generated tree with', this.countNodes(tree), 'nodes');
        console.log('✅ AI extracted title:', title);

        // Step 5: Apply default styles if AI didn't provide them
        this.applyDefaultStylesToTree(tree, styledText);
        console.log('✅ Applied styling to tree');

        // Step 6: Auto-detect horizontal layouts from spatial positioning
        this.applyDynamicLayoutDetection(tree, styledText);
        console.log('✅ Applied dynamic layout detection');

        // Step 7: Detect text direction and language
        const textDirection = detectTextDirection(text);
        const language = detectLanguage(text);
        console.log('✅ Detected text direction:', textDirection, 'language:', language);

        return { tree, title, textDirection, language };
    }

    /**
     * Extract text from PDF file (simple text only)
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
     * Apply intelligent default styles to tree based on extracted text metadata
     * This is adaptive and works for any resume style
     */
    private applyDefaultStylesToTree(tree: ResumeNode[], styledText: StyledTextItem[]): void {
        if (styledText.length === 0) return;

        // Analyze font characteristics from PDF
        const fontSizes = styledText.map(item => item.fontSize).sort((a, b) => b - a);
        const fontWeights = styledText.map(item => item.fontWeight);

        // Detect size hierarchy (unique sizes)
        const uniqueSizes = [...new Set(fontSizes)].sort((a, b) => b - a);
        const largestSize = uniqueSizes[0];
        const smallestSize = uniqueSizes[uniqueSizes.length - 1];
        const midSize = uniqueSizes.length > 2 ? uniqueSizes[1] : Math.round((largestSize + smallestSize) / 2);

        // Detect if resume uses bold text (adaptive)
        const hasBoldText = fontWeights.some(w => w >= 600);
        const avgWeight = fontWeights.reduce((a, b) => a + b, 0) / fontWeights.length;

        // Detect text transform by sampling first few items
        const sampleTexts = styledText.slice(0, 10).map(item => item.text);
        const hasUppercase = sampleTexts.some(text => text === text.toUpperCase() && text.length > 3);

        console.log('📊 Style analysis:', {
            sizes: uniqueSizes,
            hasBold: hasBoldText,
            hasUppercase,
            avgWeight: Math.round(avgWeight)
        });

        // Apply styles recursively with adaptive defaults
        const applyStyles = (nodes: ResumeNode[], depth: number) => {
            for (const node of nodes) {
                // Only apply if node doesn't already have styles
                if (!node.style) {
                    if (depth === 0) {
                        // Top-level sections - adaptive styling
                        node.style = {
                            level: 1,
                            weight: hasBoldText ? 'bold' : 'semibold',
                            fontSize: `${largestSize}px`,
                            color: '#1a1a1a',
                            marginBottom: '16px'
                        };

                        // Add text transform if detected
                        if (hasUppercase) {
                            node.style.textTransform = 'uppercase';
                        }

                        // Only add border if it seems appropriate (larger headers)
                        if (largestSize > 16) {
                            node.style.borderBottom = '2px solid #333';
                            node.style.paddingBottom = '4px';
                        }
                    } else if (depth === 1) {
                        // Items - medium size, adaptive weight
                        node.style = {
                            level: 2,
                            weight: hasBoldText ? 'semibold' : 'medium',
                            fontSize: `${midSize}px`,
                            color: '#2d3748',
                            marginBottom: '8px'
                        };
                    } else {
                        // Bullets - smaller size, normal weight
                        node.style = {
                            weight: 'regular',
                            fontSize: `${smallestSize}px`,
                            color: '#4a5568',
                            marginBottom: '4px',
                            lineHeight: 1.6
                        };
                    }
                }

                // Recurse into children
                if (node.children) {
                    applyStyles(node.children, depth + 1);
                }
            }
        };

        applyStyles(tree, 0);
    }

    /**
     * Auto-detect and apply horizontal layouts dynamically based on spatial positioning
     * Analyzes Y-coordinates of text items to determine if children should be inline
     */
    private applyDynamicLayoutDetection(tree: ResumeNode[], styledText: StyledTextItem[]): void {
        if (styledText.length === 0) return;

        // Create a map of text content to Y-coordinate for quick lookup
        const textToYPosition = new Map<string, number[]>();

        for (const item of styledText) {
            const cleanText = item.text.trim().toLowerCase();
            if (!cleanText) continue;

            if (!textToYPosition.has(cleanText)) {
                textToYPosition.set(cleanText, []);
            }
            textToYPosition.get(cleanText)!.push(item.y);
        }

        // Recursively analyze nodes and their children
        const analyzeNode = (node: ResumeNode): void => {
            if (!node.children || node.children.length < 2) {
                // No children or only one child - no layout needed
                if (node.children) {
                    node.children.forEach(analyzeNode);
                }
                return;
            }

            // Get Y-positions for all children
            const childPositions: { node: ResumeNode; y: number | null }[] = [];

            for (const child of node.children) {
                const childText = (child.title || child.text || '')?.trim().toLowerCase();
                if (!childText) {
                    childPositions.push({ node: child, y: null });
                    continue;
                }

                // Find Y-position for this child's text
                const positions = textToYPosition.get(childText);
                if (positions && positions.length > 0) {
                    // Use the first (or average) position
                    const avgY = positions.reduce((a, b) => a + b, 0) / positions.length;
                    childPositions.push({ node: child, y: avgY });
                } else {
                    // Try partial match (first few words)
                    const firstWords = childText.split(/\s+/).slice(0, 3).join(' ');
                    let foundY: number | null = null;

                    for (const [text, yPositions] of textToYPosition.entries()) {
                        if (text.includes(firstWords) || firstWords.includes(text)) {
                            foundY = yPositions[0];
                            break;
                        }
                    }

                    childPositions.push({ node: child, y: foundY });
                }
            }

            // Check if children are on the same line (similar Y coordinates)
            const validPositions = childPositions.filter(cp => cp.y !== null);

            if (validPositions.length >= 2) {
                const yValues = validPositions.map(cp => cp.y!);
                const minY = Math.min(...yValues);
                const maxY = Math.max(...yValues);
                const yRange = maxY - minY;

                // If Y-range is small (< 5px), children are on same horizontal line
                // Threshold can be adjusted based on typical line heights
                const HORIZONTAL_THRESHOLD = 5;

                if (yRange < HORIZONTAL_THRESHOLD) {
                    // Children are horizontally aligned - apply grid layout
                    if (!node.layout) {
                        node.layout = 'grid';
                        const content = node.title || node.text || '(untitled)';
                        console.log(`  📐 Auto-detected grid layout for: "${content.substring(0, 30)}..." (Y-range: ${yRange.toFixed(2)}px)`);
                    }
                }
            }

            // Recurse into children
            node.children.forEach(analyzeNode);
        };

        tree.forEach(analyzeNode);
    }

    /**
     * Analyze styled text items to create a summary for AI
     */
    private analyzeStyles(styledItems: StyledTextItem[]): string {
        if (styledItems.length === 0) return 'No style information available.';

        // Group by font size to identify hierarchy
        const fontSizes = new Map<number, number>();
        const fontWeights = new Map<number, number>();

        for (const item of styledItems) {
            fontSizes.set(item.fontSize, (fontSizes.get(item.fontSize) || 0) + 1);
            fontWeights.set(item.fontWeight, (fontWeights.get(item.fontWeight) || 0) + 1);
        }

        // Sort by frequency
        const sortedSizes = Array.from(fontSizes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const sortedWeights = Array.from(fontWeights.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        let summary = 'PDF Style Analysis:\n';
        summary += `Total text items: ${styledItems.length}\n`;
        summary += `Font sizes found (most common): ${sortedSizes.map(([size, count]) => `${size}px (${count} items)`).join(', ')}\n`;
        summary += `Font weights found: ${sortedWeights.map(([weight, count]) => `${weight} (${count} items)`).join(', ')}\n`;

        // Heuristic: Largest font is likely headers
        const maxFontSize = Math.max(...Array.from(fontSizes.keys()));
        const minFontSize = Math.min(...Array.from(fontSizes.keys()));
        summary += `\nStyle hints:\n`;
        summary += `- Main headers likely use: ${maxFontSize}px, bold\n`;
        summary += `- Body text likely uses: ${minFontSize}px, normal weight\n`;
        summary += `- Use intermediate sizes (${Math.round((maxFontSize + minFontSize) / 2)}px) for sub-headers\n`;

        return summary;
    }

    /**
     * Extract rich text with styling information from PDF
     */
    private async extractStyledTextFromPDF(file: File): Promise<StyledTextItem[]> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const styledItems: StyledTextItem[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });

            for (const item of textContent.items) {
                const textItem = item as any;

                if (!textItem.str || textItem.str.trim().length === 0) continue;

                // Extract position from transform matrix
                const transform = textItem.transform;
                const x = transform[4];
                const y = viewport.height - transform[5]; // Flip Y coordinate

                // Calculate font size from transform matrix
                const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);

                // Extract font info
                const fontName = textItem.fontName || '';

                // Infer font weight from font name (heuristic)
                let fontWeight = 400; // normal
                if (fontName.toLowerCase().includes('bold')) fontWeight = 700;
                if (fontName.toLowerCase().includes('black')) fontWeight = 900;
                if (fontName.toLowerCase().includes('light')) fontWeight = 300;

                styledItems.push({
                    text: textItem.str,
                    x,
                    y,
                    width: textItem.width,
                    height: textItem.height,
                    fontSize: Math.round(fontSize),
                    fontName,
                    fontWeight,
                    color: '#000000' // Default black (PDF.js doesn't easily expose color)
                });
            }
        }

        return styledItems;
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
     * Build tree from action array (used by chat/store for incremental updates)
     */
    buildTreeFromActions(actions: AgentAction[]): ResumeNode[] {
        const tree: ResumeNode[] = [];
        const tempIdMap = new Map<string, ResumeNode>();

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            console.log(`🔧 Action ${i + 1}/${actions.length}:`, action.action, action);

            try {
                // Recompute numbering BEFORE each action so addresses are up to date
                const numbering = computeNumbering(tree);
                this.applyAction(tree, action, numbering, tempIdMap);
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
     * Apply a single action to the tree (used by chat/store for incremental updates)
     */
    applyAction(tree: ResumeNode[], action: any, numbering: any, tempIdMap: Map<string, ResumeNode>): void {
        switch (action.action) {
            case 'append':
                this.append(tree, action as any, numbering, tempIdMap);
                break;
            default:
                console.warn('Unknown action type:', action.action);
        }
    }

    /**
     * Unified append - adds a node using temporary ID system
     * Maps temporary IDs (_id, _parentId) to actual tree structure
     */
    private append(tree: ResumeNode[], action: any, _numbering: any, tempIdMap: Map<string, ResumeNode> = new Map()): void {
        if (!action.content) {
            throw new Error('append requires "content" field');
        }

        const content = action.content;

        const newNode: ResumeNode = {
            uid: generateUid(),
            text: content,
            layout: action.layout,
            style: action.style,
            meta: action.meta || {},
            children: []
        };

        // Store in temp ID map if _id is provided
        if (action._id) {
            tempIdMap.set(action._id, newNode);
        }

        // If no parent specified, append to root
        if (!action._parentId && !action.parent) {
            tree.push(newNode);
            console.log(`  ✅ Appended to root: "${content}"${action.layout ? ` with layout: ${action.layout}` : ''}${action.style ? ' with styling' : ''}`);
            return;
        }

        // Find parent using temp ID
        const parentId = action._parentId || action.parent;
        const parent = tempIdMap.get(parentId);

        if (!parent) {
            throw new Error(`Parent ${parentId} not found. Make sure parent is created before children.`);
        }

        if (!parent.children) {
            parent.children = [];
        }

        parent.children.push(newNode);
        console.log(`  ✅ Appended to ${parentId}: "${content}"${action.style ? ' with styling' : ''}`);
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
                if (!node.title && !node.text) {
                    errors.push(`${currentPath}: Missing content (both title and text are empty)`);
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
