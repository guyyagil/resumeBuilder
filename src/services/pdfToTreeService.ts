import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode } from '../types';
import { generateUid } from '../utils/treeUtils';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';

// Set up PDF.js worker
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export class PdfToTreeService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent parsing
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }
  
  async convertPdfTextToTree(pdfText: string, jobDescription?: string): Promise<ResumeNode[]> {
    const systemPrompt = this.buildSystemPrompt(jobDescription);
    
    const prompt = `${systemPrompt}

## Resume Text to Parse:
${pdfText}

Please analyze this resume text and return a JSON array of ResumeNode objects that represent the resume structure.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in AI response');
      }
      
      const parsedTree = JSON.parse(jsonMatch[0]) as ResumeNode[];
      
      // Validate and ensure UIDs
      return this.validateAndFixTree(parsedTree);
    } catch (error) {
      console.error('Failed to convert PDF to tree:', error);
      throw new Error('Failed to parse resume. Please try again.');
    }
  }
  
  private buildSystemPrompt(jobDescription?: string): string {
    let prompt = `You are a resume parsing expert. Your job is to convert resume text into a structured tree format.

## Output Format
Return a JSON array of ResumeNode objects with this structure:

\`\`\`typescript
type ResumeNode = {
  uid: string;              // Generate unique ID like "uid_contact_123"
  title: string;            // Section/item title
  content?: string;         // Text content (for paragraphs, bullets)
  meta?: {
    type?: 'section' | 'item' | 'bullet' | 'text' | 'contact';
    dateRange?: string;     // For jobs/education (e.g., "2020-2023")
    location?: string;      // For jobs/schools
    company?: string;       // For work experience
    role?: string;          // Job title
    tags?: string[];        // Skills, technologies
  };
  children?: ResumeNode[];  // Nested items
};
\`\`\`

## Tree Structure Rules
1. **Contact Information** (type: 'contact') - First section with personal details
2. **Professional Summary** (type: 'section') - Summary paragraph
3. **Work Experience** (type: 'section') - Jobs as items, achievements as bullets
4. **Education** (type: 'section') - Degrees as items, details as bullets
5. **Skills** (type: 'section') - Skill categories as text nodes
6. **Additional Sections** - Projects, certifications, etc.

## Example Structure:
\`\`\`json
[
  {
    "uid": "uid_contact_001",
    "title": "Contact Information",
    "meta": { "type": "contact" },
    "children": [
      { "uid": "uid_name_001", "title": "Name", "content": "John Doe", "meta": { "type": "text" } },
      { "uid": "uid_email_001", "title": "Email", "content": "john@email.com", "meta": { "type": "text" } }
    ]
  },
  {
    "uid": "uid_experience_001",
    "title": "Work Experience", 
    "meta": { "type": "section" },
    "children": [
      {
        "uid": "uid_job_001",
        "title": "Google — Senior Engineer",
        "meta": { 
          "type": "item", 
          "dateRange": "2022-Present", 
          "company": "Google", 
          "role": "Senior Engineer" 
        },
        "children": [
          { "uid": "uid_bullet_001", "title": "Led team of 5 engineers", "content": "Led team of 5 engineers", "meta": { "type": "bullet" } }
        ]
      }
    ]
  }
]
\`\`\`

## Parsing Guidelines:
- Extract ALL information from the resume text
- Preserve original wording but clean up formatting
- Group related information logically
- Generate meaningful UIDs (uid_section_number format)
- Include metadata for dates, locations, companies
- Convert bullet points to separate bullet nodes
- Handle multiple formats (chronological, functional, etc.)`;

    if (jobDescription) {
      prompt += `

## Job Description Context:
${jobDescription}

When parsing, prioritize and highlight experience/skills that match this job description.`;
    }

    return prompt;
  }
  
  private validateAndFixTree(tree: ResumeNode[]): ResumeNode[] {
    const fixNode = (node: ResumeNode): ResumeNode => {
      // Ensure UID exists
      if (!node.uid) {
        node.uid = generateUid();
      }
      
      // Ensure title exists
      if (!node.title) {
        node.title = node.content || 'Untitled';
      }
      
      // Fix children recursively
      if (node.children) {
        node.children = node.children.map(fixNode);
      }
      
      return node;
    };
    
    return tree.map(fixNode);
  }
}

// Helper function to extract PDF text (moved from WelcomeForm)
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as any[]).map((item: any) => item.str).join(' ');
      text += pageText + '\n';
    }
    
    return text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please try a different file.');
  }
}