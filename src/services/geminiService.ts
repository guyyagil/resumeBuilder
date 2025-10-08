import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeNode, AgentAction, LayoutKind, StyleHints } from '../types';
import { serializeWithMeta } from './prompts';
import { generateUid } from '../utils/treeUtils';
import {
  RESUME_AGENT_SYSTEM_PROMPT,
  JOB_TAILORING_SYSTEM_ADDITION,
  RESUME_STRUCTURING_PROMPT,
} from './systemPrompts';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
  }

  async structureResumeFromText(resumeText: string): Promise<{ actions: AgentAction[], title: string }> {
    const prompt = `${RESUME_STRUCTURING_PROMPT}\n\nResume Text to Parse:\n${resumeText}

IMPORTANT: Before the action array, on the first line, output the main title/header of the resume (usually the person's name or main header). Format:
TITLE: [main title here]
Then output the JSON action array on the following lines.`;

    console.log('🤖 Sending resume to AI for structuring...');
    console.log('Prompt length:', prompt.length);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      console.log('🤖 AI Response:');
      console.log('Response length:', response.length);
      console.log('Full response:', response);

      // Extract title
      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in AI response');
        console.log('Response was:', response);
        throw new Error('AI did not return valid action array');
      }

      const actions = JSON.parse(jsonMatch[0]) as AgentAction[];
      console.log('✅ Parsed actions:', actions.length);
      console.log('✅ Extracted title:', title);

      return { actions, title };
    } catch (error) {
      console.error('❌ Failed to structure resume:', error);
      throw new Error('Failed to parse resume structure');
    }
  }

  async structureResumeFromTextAndImages(resumeText: string, images: string[], styleSummary?: string): Promise<{ tree: ResumeNode[], title: string }> {
    const styleInfo = styleSummary ? `\n\n${styleSummary}\n` : '';

    const visualPrompt = `${RESUME_STRUCTURING_PROMPT}

VISUAL ANALYSIS INSTRUCTIONS:
You are seeing the actual PDF resume as images. Your job is to:
1. Extract the hierarchical content structure (sections → items → bullets)
2. Identify exact section titles as they appear (with exact capitalization)
3. Preserve the visual hierarchy and ordering
4. **PRESERVE STYLING**: Add "style" objects to nodes based on the visual analysis${styleInfo}

IMPORTANT: DO NOT worry about layouts (horizontal/vertical arrangement). The system will
automatically detect layouts from the spatial positioning of text in the PDF.
Your job is ONLY to extract the content hierarchy correctly.

OUTPUT FORMAT - SEQUENTIAL ACTIONS (NOT NESTED STRUCTURE):
Return a JSON array of "append" actions that build the tree sequentially.
Each action creates ONE node. The system assigns addresses automatically.

Action format:
{
  "action": "append",
  "parent": "1",  // Optional: parent address (omit for root level)
  "content": "...",  // Required: the node text
  "style": {...},  // Optional: CSS for THIS node's appearance
  "meta": {...}  // Optional: metadata like dateRange, location, company
}

EXAMPLE - Contact info (system will auto-detect horizontal layout):
[
  {"action": "append", "content": "CONTACT INFO"},  // Parent section
  {"action": "append", "parent": "1", "content": "email@example.com"},
  {"action": "append", "parent": "1", "content": "+1-555-1234"},
  {"action": "append", "parent": "1", "content": "Location"},
  {"action": "append", "content": "EXPERIENCE"},  // Next section
  {"action": "append", "parent": "2", "content": "Software Engineer"}
]

Resume Text (for content extraction):
${resumeText}

CRITICAL - MULTI-LINE CONTENT:
When a field (like a bullet point or description) spans multiple lines in the original resume,
you MUST preserve the line breaks by including \\n in the text string.

Example of multi-line content:
If the resume shows:
  "Full-Stack Development (Python/Flask, Java, TypeScript/React): Designed and developed
   web applications using Flask, integrating data visualization and machine learning models."

You should output:
{
  "action": "append",
  "parent": "2.0",
  "content": "Full-Stack Development (Python/Flask, Java, TypeScript/React): Designed and developed\\nweb applications using Flask, integrating data visualization and machine learning models."
}

STYLE PRESERVATION:
For each node you create, include a "style" object with CSS properties based on what you see visually:

Available style properties:
- fontSize: e.g., "18px", "14px", "12px"
- fontWeight: e.g., 700 (bold), 600 (semibold), 400 (normal), 300 (light)
- fontStyle: "normal" or "italic"
- textTransform: "uppercase", "lowercase", "capitalize", or "none"
- textDecoration: "none", "underline", or "line-through"
- color: Text color, e.g., "#000000", "#1a1a1a", "#333333"
- backgroundColor: Background color
- textAlign: "left", "center", "right", or "justify"
- marginTop, marginBottom, marginLeft, marginRight: e.g., "16px", "8px", "24px"
- paddingTop, paddingBottom, paddingLeft, paddingRight: e.g., "8px", "12px"
- lineHeight: e.g., "1.5", "24px"
- borderTop, borderBottom, borderLeft, borderRight: e.g., "1px solid #ccc", "2px solid #000"

CRITICAL STYLING RULES:
1. Apply styles to each node based on what you see visually for THAT node
2. Match the visual hierarchy: larger/bolder text = higher-level nodes, smaller/lighter = deeper nodes
3. DO NOT add "layout" fields - the system auto-detects layouts from spatial positioning

Example style patterns:
{
  "action": "append",
  "content": "SECTION TITLE",
  "style": {
    "fontSize": "16px",
    "fontWeight": 700,
    "textTransform": "uppercase",
    "textAlign": "center",
    "marginBottom": "20px"
  }
}

{
  "action": "append",
  "parent": "1",
  "content": "Child item",
  "style": {
    "fontSize": "14px",
    "fontWeight": 600,
    "color": "#1a1a1a",
    "marginBottom": "12px"
  }
}

IMPORTANT: Before the action array, on the first line, output the main title/header of the resume (usually the person's name or main header that you see prominently at the top of the visual). Format:
TITLE: [main title here]
Then output the JSON action array on the following lines.

Analyze the images above and the text to generate the title and action array with styling.`;

    console.log('🤖 Sending resume with images to AI for structuring...');
    console.log('Prompt length:', visualPrompt.length);
    console.log('Images:', images.length);

    try {
      // Build content parts: images first, then text prompt
      const contentParts: any[] = [];

      // Add each image
      images.forEach((imageBase64) => {
        contentParts.push({
          inlineData: {
            data: imageBase64,
            mimeType: 'image/png'
          }
        });
      });

      // Add text prompt
      contentParts.push({
        text: visualPrompt
      });

      const result = await this.model.generateContent(contentParts);
      const response = result.response.text();

      console.log('🤖 AI Response:');
      console.log('Response length:', response.length);
      console.log('Full response:', response);

      // Extract title
      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in AI response');
        console.log('Response was:', response);
        throw new Error('AI did not return valid tree array');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Convert parsed data to ResumeNode tree with UIDs
      const tree: ResumeNode[] = [];

      const processNode = (node: any): ResumeNode => {
        const resumeNode: ResumeNode = {
          uid: generateUid(),
          title: node.title,
          text: node.content || node.text || '',
          layout: node.layout as LayoutKind,
          style: node.style as StyleHints,
          meta: node.meta || {},
          children: []
        };

        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
          resumeNode.children = node.children.map((child: any) => processNode(child));
        }

        return resumeNode;
      };

      // Check if this is append actions or direct tree structure
      if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].action === 'append') {
        // Process append actions to build hierarchical tree
        console.log('🏗️ Building tree from append actions');
        const builtTree = this.buildTreeFromAppendActions(parsedData);
        tree.push(...builtTree);
      } else {
        // Process direct tree structure
        for (const rootNode of parsedData) {
          tree.push(processNode(rootNode));
        }
      }

      console.log('✅ Parsed tree with', this.countNodes(tree), 'nodes');
      console.log('✅ Extracted title:', title);

      return { tree, title };
    } catch (error) {
      console.error('❌ Failed to structure resume with images:', error);
      throw new Error('Failed to parse resume structure with visual analysis');
    }
  }

  async processUserMessage(
    userMessage: string,
    resumeTree: ResumeNode[],
    jobDescription?: string,
    conversationHistory: ConversationMessage[] = [],
  ): Promise<{ explanation: string; action?: AgentAction }> {
    const resumeText = serializeWithMeta(resumeTree);

    // Import the serializeForLLM function for numbered outline
    const { serializeForLLM } = await import('../utils/numbering');
    const numberedOutline = serializeForLLM(resumeTree);

    let systemPrompt = RESUME_AGENT_SYSTEM_PROMPT;
    if (jobDescription) {
      systemPrompt += `\n\n${JOB_TAILORING_SYSTEM_ADDITION.replace(
        '{JOB_DESCRIPTION}',
        jobDescription,
      )}`;
    }

    // Add numbered outline to system prompt
    systemPrompt += `\n\n## Current Resume Structure (with addresses):\n\n${numberedOutline}`;

    console.log('🤖 System prompt includes numbered outline:', numberedOutline.substring(0, 200) + '...');

    const messages = [
      {
        role: 'user',
        parts: [
          {
            text: `${systemPrompt}\n\n## Current Resume:\n\n${resumeText}`,
          },
        ],
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    try {
      const chat = this.model.startChat({ history: messages.slice(0, -1) });
      const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
      const response = result.response.text();
      return this.parseResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process request with AI');
    }
  }

  async generateSuggestions(
    resumeTree: ResumeNode[],
    jobDescription?: string,
  ): Promise<string[]> {
    const resumeText = serializeWithMeta(resumeTree);

    let prompt = `Analyze this resume and provide 3-5 specific, actionable suggestions for improvement. Focus on:\n1. Quantifying achievements\n2. Using stronger action verbs\n3. Adding missing technical details\n4. Improving clarity and impact\n\nResume:\n${resumeText}`;

    if (jobDescription) {
      prompt += `\n\nJob Description:\n${jobDescription}\n\nTailor suggestions to match this role.`;
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      return response
        .split('\n')
        .filter((line: string) => /^[\d\-\*]/.test(line.trim()))
        .map((line: string) => line.replace(/^[\d\-\*\.]+\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 0);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }



  /**
   * Build hierarchical tree from append actions with proper x.y.z numbering
   */
  private buildTreeFromAppendActions(actions: any[]): ResumeNode[] {
    const tree: ResumeNode[] = [];
    const nodeMap = new Map<string, ResumeNode>(); // AI's parent reference -> actual node
    let rootCounter = 0;

    console.log('🏗️ Processing', actions.length, 'append actions');

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.action !== 'append') continue;

      // Determine if this should be a heading based on content and style
      const isHeading = !action.parent && (
        action.content?.match(/^[A-Z\s]+$/) || // All caps
        (action.style?.fontWeight && action.style.fontWeight >= 600) ||
        (action.style?.textTransform === 'uppercase')
      );

      const newNode: ResumeNode = {
        uid: generateUid(),
        text: action.content || '',
        layout: (action.layout as LayoutKind) || (isHeading ? 'heading' : 'paragraph'),
        style: action.style as StyleHints,
        meta: action.meta || {},
        children: []
      };

      if (!action.parent) {
        // Root level node
        rootCounter++;
        const realAddress = rootCounter.toString();
        newNode.addr = realAddress;

        // Store this node with its AI index for future parent references
        const aiIndex = (i + 1).toString();
        nodeMap.set(aiIndex, newNode);

        tree.push(newNode);
        console.log(`🏗️ Added root node ${aiIndex} -> ${realAddress}: "${action.content.substring(0, 50)}"`);
      } else {
        // Child node - find parent using AI's parent reference
        const parentNode = nodeMap.get(action.parent);
        if (!parentNode) {
          console.warn(`🏗️ Parent ${action.parent} not found, adding to root instead`);
          rootCounter++;
          const realAddress = rootCounter.toString();
          newNode.addr = realAddress;

          const aiIndex = (i + 1).toString();
          nodeMap.set(aiIndex, newNode);
          tree.push(newNode);
        } else {
          // Add as child with proper x.y.z numbering
          if (!parentNode.children) parentNode.children = [];
          const childIndex = parentNode.children.length + 1;
          const realAddress = `${parentNode.addr}.${childIndex}`;
          newNode.addr = realAddress;

          // Store this node for future parent references
          const aiIndex = (i + 1).toString();
          nodeMap.set(aiIndex, newNode);

          parentNode.children.push(newNode);
          console.log(`🏗️ Added child node ${aiIndex} -> ${realAddress}: "${action.content.substring(0, 50)}" to parent ${parentNode.addr}`);
        }
      }
    }

    console.log('🏗️ Built tree with', tree.length, 'root nodes');
    return tree;
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

  private parseResponse(response: string): { explanation: string; action?: AgentAction } {
    console.log('🔍 Parsing AI response:', response);

    // Try to extract JSON from code blocks first (```json ... ```)
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);

    if (codeBlockMatch) {
      try {
        const action = JSON.parse(codeBlockMatch[1]) as AgentAction;
        const explanation = response.substring(0, codeBlockMatch.index).trim() ||
          response.substring((codeBlockMatch.index || 0) + codeBlockMatch[0].length).trim();
        console.log('✅ Parsed action from code block:', action);
        console.log('📝 Explanation:', explanation);
        return { explanation, action };
      } catch (error) {
        console.error('❌ Failed to parse action from code block:', error);
      }
    }

    // Fallback: try to find JSON object directly
    const jsonMatch = response.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      console.log('ℹ️ No JSON found in response, returning as explanation only');
      return { explanation: response.trim() };
    }

    try {
      const action = JSON.parse(jsonMatch[0]) as AgentAction;
      const explanation = response.substring(0, jsonMatch.index).trim();
      console.log('✅ Parsed action:', action);
      console.log('📝 Explanation:', explanation);
      return { explanation, action };
    } catch (error) {
      console.error('❌ Failed to parse action JSON:', error);
      console.log('📄 Raw JSON string:', jsonMatch[0]);
      return { explanation: response.trim() };
    }
  }
}
