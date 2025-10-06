# Dynamic Resume Agent System - Complete Architecture Specification

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Application Flow](#2-application-flow)
3. [Data Model](#3-data-model)
4. [Core Utilities](#4-core-utilities)
5. [PDF Initialization System](#5-pdf-initialization-system)
6. [AI Agent Actions](#6-ai-agent-actions)
7. [Prompt System](#7-prompt-system)
8. [Store Architecture](#8-store-architecture)
9. [AI Service Layer](#9-ai-service-layer)
10. [UI Architecture](#10-ui-architecture)
11. [Data Flow Pipeline](#11-data-flow-pipeline)
12. [Error Handling & Validation](#12-error-handling--validation)
13. [Testing Strategy](#13-testing-strategy)
14. [Performance Considerations](#14-performance-considerations)
15. [Security Considerations](#15-security-considerations)
16. [Data Persistence](#16-data-persistence)

---

## 1. System Overview

The Dynamic Resume Agent is an AI-powered system that manages resume content through a tree-based data structure with intelligent conversational updates. Users start by uploading their resume PDF and providing a target job description, then interact with an AI agent through natural language to optimize their resume.

### Core Principles
- **Tree-First Architecture**: All resume data is represented as a hierarchical tree structure
- **Stable Identifiers**: UIDs ensure consistency across transformations
- **Numeric Addressing**: Human-readable addresses (1.0, 2.1.3) for AI communication
- **Atomic Operations**: Each change is a discrete, reversible action
- **Conversational Interface**: Natural language commands translated to structured updates
- **Job-Targeted Optimization**: AI tailors suggestions based on provided job description

---

## 2. Application Flow

### 2.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Flow                            │
└─────────────────────────────────────────────────────────────────┘

1. Landing/Welcome Screen
   │
   ├─> User uploads resume PDF
   │   └─> File validation (type, size, pages)
   │
   └─> User enters target job description (optional but recommended)
       └─> Text input or paste job posting
   │
   ▼
2. Processing Screen
   │
   ├─> Extract text from PDF (pdf.js)
   │
   ├─> Send to AI for structuring
   │   └─> AI analyzes and returns action array
   │
   ├─> Build tree from actions
   │
   └─> Validate and initialize store
   │
   ▼
3. Main Application
   │
   ├─> Resume View (left panel)
   │   └─> Live resume preview with hover addresses
   │
   ├─> Chat Interface (right panel)
   │   ├─> AI suggestions based on job description
   │   ├─> User asks for improvements
   │   └─> AI applies changes with explanations
   │
   └─> Controls (top bar)
       ├─> Undo/Redo
       ├─> Edit job description
       ├─> Export (PDF, DOCX, JSON)
       └─> Start new resume
```

### 2.2 State Transitions

```
[No Resume] 
    ↓ (upload PDF + job description)
[Processing] 
    ↓ (tree built successfully)
[Active] 
    ↓ (user interactions)
[Modified]
    ↓ (export or start new)
[No Resume]
```

---

## 3. Data Model

### 3.1 Core Types

```typescript
// types.ts

type ResumeNode = {
  uid: string;              // Stable unique identifier (e.g., "uid_abc123")
  addr?: string;            // Computed numeric address (e.g., "2.1.3")
  title: string;            // Node display title
  content?: string;         // Free-form text content (paragraphs, bullets, etc.)
  meta?: {                  // Extensible metadata
    type?: NodeType;        // 'section' | 'item' | 'bullet' | 'text'
    dateRange?: string;     // For experience/education
    location?: string;      // For jobs/schools
    company?: string;       // For work items
    role?: string;          // For positions
    tags?: string[];        // Skill categories, keywords
    [key: string]: any;
  };
  children?: ResumeNode[];  // Nested nodes
};

type NodeType = 
  | 'section'      // Top-level sections (Experience, Education, etc.)
  | 'item'         // Mid-level items (Job, Project, Degree)
  | 'bullet'       // Achievement/responsibility bullet point
  | 'text'         // Free-form text block
  | 'contact';     // Contact information

type ResumeTree = ResumeNode[];  // Root is always an array

type Numbering = {
  addrToUid: Record<string, string>;  // "2.1.3" → "uid_xyz"
  uidToAddr: Record<string, string>;  // "uid_xyz" → "2.1.3"
};

type AppPhase = 
  | 'welcome'      // Initial state, showing upload form
  | 'processing'   // Parsing PDF and building tree
  | 'active'       // Main app with resume and chat
  | 'error';       // Error state with retry option
```

### 3.2 Tree Structure Example

```
1.0 Contact Information (section)
  1.1 John Doe (text)
  1.2 john.doe@email.com (text)
  1.3 (555) 123-4567 (text)
  1.4 San Francisco, CA (text)

2.0 Professional Summary (section)
  2.1 Senior software engineer with 8+ years of experience building scalable backend systems and leading technical teams. (text)

3.0 Work Experience (section)
  3.1 Acme Corp — Senior Backend Engineer (item)
    [dateRange: 2021-Present | location: San Francisco, CA]
    3.1.1 Led migration of monolithic application to microservices architecture, serving 10M+ users (bullet)
    3.1.2 Reduced API latency by 45% through database optimization and caching strategies (bullet)
    3.1.3 Mentored team of 5 junior engineers and conducted technical interviews (bullet)
  3.2 StartupXYZ — Full Stack Developer (item)
    [dateRange: 2018-2021 | location: Remote]
    3.2.1 Built customer-facing dashboard using React and TypeScript (bullet)
    3.2.2 Implemented CI/CD pipeline reducing deployment time by 70% (bullet)

4.0 Education (section)
  4.1 BS Computer Science — MIT (item)
    [dateRange: 2014-2018]
    4.1.1 GPA: 3.8/4.0 (bullet)
    4.1.2 Dean's List 2016-2018 (bullet)

5.0 Skills (section)
  5.1 Languages: Python, TypeScript, Go, SQL (text)
  5.2 Frameworks: React, Node.js, Django, FastAPI (text)
  5.3 Infrastructure: AWS, Docker, Kubernetes, Terraform (text)
```

---

## 4. Core Utilities

### 4.1 Numbering System (`numbering.ts`)

**Purpose**: Generate and maintain bidirectional mappings between numeric addresses and UIDs.

```typescript
// numbering.ts

export function computeNumbering(tree: ResumeNode[]): Numbering {
  const addrToUid: Record<string, string> = {};
  const uidToAddr: Record<string, string> = {};
  
  function walk(nodes: ResumeNode[], prefix: number[] = []): void {
    nodes.forEach((node, idx) => {
      const addr = [...prefix, idx].join('.');
      node.addr = addr;
      addrToUid[addr] = node.uid;
      uidToAddr[node.uid] = addr;
      
      if (node.children) {
        walk(node.children, [...prefix, idx]);
      }
    });
  }
  
  walk(tree);
  return { addrToUid, uidToAddr };
}

export function resolveAddress(
  addr: string, 
  numbering: Numbering
): string | null {
  return numbering.addrToUid[addr] || null;
}

export function getAddress(
  uid: string, 
  numbering: Numbering
): string | null {
  return numbering.uidToAddr[uid] || null;
}
```

### 4.2 Tree Utilities (`treeUtils.ts`)

```typescript
// treeUtils.ts

export function findNodeByUid(
  tree: ResumeNode[], 
  uid: string
): ResumeNode | null {
  for (const node of tree) {
    if (node.uid === uid) return node;
    if (node.children) {
      const found = findNodeByUid(node.children, uid);
      if (found) return found;
    }
  }
  return null;
}

export function findParentByChildUid(
  tree: ResumeNode[], 
  childUid: string
): { parent: ResumeNode | null; index: number } | null {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].uid === childUid) {
      return { parent: null, index: i }; // Root level
    }
    if (tree[i].children) {
      const result = findParentByChildUid(tree[i].children!, childUid);
      if (result) {
        if (result.parent === null) {
          return { parent: tree[i], index: result.index };
        }
        return result;
      }
    }
  }
  return null;
}

export function cloneTree(tree: ResumeNode[]): ResumeNode[] {
  return JSON.parse(JSON.stringify(tree));
}

export function generateUid(): string {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateTree(tree: ResumeNode[]): string[] {
  const errors: string[] = [];
  const seenUids = new Set<string>();
  
  function walk(nodes: ResumeNode[], path: string = 'root'): void {
    nodes.forEach((node, idx) => {
      const currentPath = `${path}[${idx}]`;
      
      if (!node.uid) {
        errors.push(`${currentPath}: Missing uid`);
      } else if (seenUids.has(node.uid)) {
        errors.push(`${currentPath}: Duplicate uid "${node.uid}"`);
      } else {
        seenUids.add(node.uid);
      }
      
      if (!node.title) {
        errors.push(`${currentPath}: Missing title`);
      }
      
      if (node.children) {
        walk(node.children, currentPath);
      }
    });
  }
  
  walk(tree);
  return errors;
}
```

### 4.3 Tree Serialization (`serializationUtils.ts`)

**Purpose**: Export tree to various formats for distribution and sharing.

```typescript
// serializationUtils.ts

import { ResumeNode } from './types';
import { validateTree } from './treeUtils';

export function treeToJSON(tree: ResumeNode[]): string {
  return JSON.stringify(tree, null, 2);
}

export function treeFromJSON(json: string): ResumeNode[] {
  const tree = JSON.parse(json) as ResumeNode[];
  const errors = validateTree(tree);
  
  if (errors.length > 0) {
    throw new Error(`Invalid tree structure: ${errors.join(', ')}`);
  }
  
  return tree;
}

export function treeToPlainText(tree: ResumeNode[]): string {
  const lines: string[] = [];
  
  function walk(nodes: ResumeNode[], depth: number = 0): void {
    nodes.forEach(node => {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}${node.title}`);
      
      if (node.meta) {
        const metaEntries = Object.entries(node.meta)
          .filter(([k, v]) => k !== 'type' && v)
          .map(([k, v]) => `${k}: ${v}`);
        
        if (metaEntries.length > 0) {
          lines.push(`${indent}  [${metaEntries.join(' | ')}]`);
        }
      }
      
      if (node.content && node.content !== node.title) {
        lines.push(`${indent}  ${node.content}`);
      }
      
      if (node.children) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}
```

---

## 5. PDF Initialization System

### 5.1 Welcome Form Component

```typescript
// components/Welcome/WelcomeForm.tsx

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const WelcomeForm: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { initializeFromPDF } = useAppStore();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setPdfFile(file);
      setError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfFile) {
      setError('Please upload your resume PDF');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await initializeFromPDF(pdfFile, jobDescription);
      // Navigation to main app handled by store state change
    } catch (err) {
      console.error('Initialization error:', err);
      setError((err as Error).message || 'Failed to process your resume');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Resume Optimizer
          </h1>
          <p className="text-gray-600">
            Upload your resume and let AI help you tailor it to your dream job
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PDF Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Current Resume (PDF) *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer block"
              >
                {pdfFile ? (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">{pdfFile.name}</p>
                    <p className="text-xs text-gray-500">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">Upload Resume PDF</p>
                    <p className="text-xs text-gray-500">Click to browse or drag and drop</p>
                  </div>
                )}
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Supported: PDF files up to 10 pages
            </p>
          </div>
          
          {/* Job Description Section */}
          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
              Target Job Description (Recommended)
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isProcessing}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Paste the job description here...

Example:
Senior Software Engineer
We're looking for an experienced backend engineer with strong Python skills...

The AI will use this to tailor your resume and suggest relevant improvements."
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 Adding a job description helps the AI provide more targeted suggestions
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={!pdfFile || isProcessing}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Processing your resume...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Optimizing</span>
              </>
            )}
          </button>
        </form>
        
        {/* Features List */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">What happens next:</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>AI analyzes your resume structure and content</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Get instant suggestions tailored to your target job</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Chat with AI to refine specific sections</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Export your optimized resume as PDF or DOCX</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
```

### 5.2 PDF Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     PDF Upload Flow                          │
└─────────────────────────────────────────────────────────────┘

User submits form (PDF + Job Description)
       │
       ▼
┌─────────────────┐
│  PDF Validation │  ← Check file type, size, page count
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Text Extraction│  ← pdf.js extracts raw text
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Structuring │  ← Gemini analyzes and returns actions
└────────┬────────┘
         │
         ▼
   [Action Array]
   [
     {action: 'appendSection', title: 'Contact'},
     {action: 'appendItem', id: '1.0', title: 'John Doe'},
     {action: 'appendSection', title: 'Experience'},
     ...
   ]
         │
         ▼
┌─────────────────┐
│  Tree Builder   │  ← Execute actions sequentially
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validation     │  ← Validate structure
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Store Update   │  ← Set resumeTree + jobDescription
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navigation     │  ← Transition to main app
└─────────────────┘
```

### 5.3 PDF Service Implementation

```typescript
// services/pdfService.ts

import * as pdfjsLib from 'pdfjs-dist';

export class PDFService {
  async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  }
  
  async validatePDF(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages === 0) {
        return { valid: false, error: 'PDF has no pages' };
      }
      
      if (pdf.numPages > 10) {
        return { valid: false, error: 'Resume should be maximum 10 pages' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid PDF file' };
    }
  }
}
```

### 5.4 Resume Structuring System Prompt

```typescript
// systemPrompts.ts

export const RESUME_STRUCTURING_PROMPT = `You are a resume parsing expert. Your task is to analyze a resume text and convert it into a structured tree format using a numbered addressing system.

## Your Task
Analyze the provided resume text and generate a JSON array of actions that will construct the complete resume tree structure.

## Addressing System
- Sections use X.0 format (e.g., 1.0, 2.0, 3.0)
- Items within sections use X.Y format (e.g., 3.1, 3.2)
- Bullets within items use X.Y.Z format (e.g., 3.1.1, 3.1.2)

## Standard Resume Structure
Identify and create these sections in order (skip any that don't exist in the resume):

1.0 Contact Information
2.0 Professional Summary (or Objective)
3.0 Work Experience
4.0 Education
5.0 Skills
6.0 Projects (if present)
7.0 Certifications (if present)
8.0 Awards/Honors (if present)
9.0 Additional sections as needed

## Action Types You Must Use

### 1. appendSection - Create a new section
{
  "action": "appendSection",
  "title": "Section Name"
}

### 2. appendItem - Add item to a section (job, degree, project)
{
  "action": "appendItem",
  "id": "3.0",
  "title": "Company Name — Job Title",
  "content": "Brief description (optional)",
  "meta": {
    "dateRange": "Jan 2020 - Present",
    "location": "City, State",
    "company": "Company Name",
    "role": "Job Title"
  }
}

### 3. appendBullet - Add achievement/responsibility bullet
{
  "action": "appendBullet",
  "id": "3.1",
  "text": "Led team of 5 engineers to deliver..."
}

## Parsing Guidelines

1. **Contact Information**: Extract name, email, phone, location, LinkedIn, etc.
   - Create contact section first
   - Add each contact field as a separate item

2. **Professional Summary**: 
   - Usually appears near the top
   - Create as single item with full text as content

3. **Work Experience**:
   - Each job is an "item" (appendItem)
   - Format title: "Company Name — Job Title"
   - Extract date ranges and locations into meta
   - Each bullet point is appendBullet to that job

4. **Education**:
   - Each degree is an "item"
   - Format: "Degree — Institution"
   - Include graduation date, GPA if present

5. **Skills**:
   - Group by category when possible
   - Each category can be an item with text content

6. **Projects**:
   - Similar to work experience
   - Each project is an item with bullets

## Output Format

Return ONLY a JSON array of actions in the correct execution order. No explanations, no markdown, just the JSON array.

Example output:
[
  {
    "action": "appendSection",
    "title": "Work Experience"
  },
  {
    "action": "appendItem",
    "id": "3.0",
    "title": "Acme Corp — Senior Backend Engineer",
    "meta": {
      "dateRange": "2021-Present",
      "location": "San Francisco, CA",
      "company": "Acme Corp",
      "role": "Senior Backend Engineer"
    }
  },
  {
    "action": "appendBullet",
    "id": "3.1",
    "text": "Led migration of monolithic application to microservices"
  },
  {
    "action": "appendBullet",
    "id": "3.1",
    "text": "Reduced API latency by 45% through optimization"
  }
]

## Important Rules
1. Actions must be in execution order (create section before adding items to it)
2. Parent nodes must exist before adding children
3. Use consistent date formats (YYYY-MM or Month YYYY)
4. Preserve all meaningful content from the original resume
5. Maintain chronological order (most recent first) for experience/education
6. Extract ALL bullet points and achievements
7. Don't add content that's not in the original resume
8. If formatting is unclear, make your best interpretation
9. The first section address will be "1.0", first item in that section "1.1" (not "1.0.1")

Now, analyze the resume text and return the action array:`;

### 5.5 Resume Builder Service

```typescript
// services/resumeBuilder.ts

import { AgentAction, ResumeNode } from '@/types';
import { ActionHandler } from '@/services/actionHandler';
import { computeNumbering } from '@/utils/numbering';
import { validateTree } from '@/utils/treeUtils';
import { PDFService } from './pdfService';
import { GeminiService } from './geminiService';

export class ResumeBuilder {
  async buildFromActions(actions: AgentAction[]): Promise<ResumeNode[]> {
    let tree: ResumeNode[] = [];
    let numbering = computeNumbering(tree);
    
    // Execute actions sequentially
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      try {
        const handler = new ActionHandler(tree, numbering);
        tree = handler.apply(action);
        numbering = computeNumbering(tree);
      } catch (error) {
        console.error(`Failed to apply action ${i}:`, action, error);
        throw new Error(
          `Resume parsing failed at action ${i}: ${(error as Error).message}`
        );
      }
    }
    
    // Validate final tree
    const errors = validateTree(tree);
    if (errors.length > 0) {
      throw new Error(`Invalid resume structure: ${errors.join(', ')}`);
    }
    
    return tree;
  }
  
  async buildFromPDF(
    file: File, 
    geminiApiKey: string
  ): Promise<ResumeNode[]> {
    // Validate PDF
    const pdfService = new PDFService();
    const validation = await pdfService.validatePDF(file);
    
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid PDF');
    }
    
    // Extract text
    const resumeText = await pdfService.extractText(file);
    
    if (!resumeText || resumeText.length < 100) {
      throw new Error('Resume text is too short or empty');
    }
    
    // Get structuring actions from AI
    const geminiService = new GeminiService(geminiApiKey);
    const actions = await geminiService.structureResumeFromText(resumeText);
    
    if (!actions || actions.length === 0) {
      throw new Error('AI failed to structure resume');
    }
    
    // Build tree from actions
    const tree = await this.buildFromActions(actions);
    
    return tree;
  }
}
```

---

## 6. AI Agent Actions

### 6.1 Action Types

```typescript
// actions.ts

type AgentAction = 
  | ReplaceAction
  | AppendBulletAction
  | AppendItemAction
  | AppendSectionAction
  | RemoveAction
  | MoveAction
  | ReorderAction
  | UpdateMetaAction;

// Replace content of existing node
type ReplaceAction = {
  action: 'replace';
  id: string;           // Numeric address (e.g., "3.1.2")
  text: string;         // New content
};

// Add bullet to existing item
type AppendBulletAction = {
  action: 'appendBullet';
  id: string;           // Parent item address (e.g., "3.1")
  text: string;         // Bullet content
};

// Add new item to section
type AppendItemAction = {
  action: 'appendItem';
  id: string;           // Parent section address (e.g., "3.0")
  title: string;        // Item title
  content?: string;     // Item description
  meta?: Record<string, any>;  // Metadata (dates, location, etc.)
};

// Add new top-level section
type AppendSectionAction = {
  action: 'appendSection';
  title: string;        // Section title
  after?: string;       // Insert after this address (optional)
};

// Remove node and its children
type RemoveAction = {
  action: 'remove';
  id: string;           // Address to remove
};

// Move node to new parent
type MoveAction = {
  action: 'move';
  id: string;           // Node to move
  newParent: string;    // Destination parent address
  position?: number;    // Index in new parent's children
};

// Reorder children of a node
type ReorderAction = {
  action: 'reorder';
  id: string;           // Parent node address
  order: string[];      // New order of child addresses
};

// Update node metadata
type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;           // Node address
  meta: Record<string, any>;  // New/updated metadata fields
};
```

### 6.2 Action Examples

```json
// Replace a bullet point
{
  "action": "replace",
  "id": "3.1.2",
  "text": "Reduced API latency by 60% through Redis caching and query optimization, improving user experience for 2M+ daily active users"
}

// Add bullet to job
{
  "action": "appendBullet",
  "id": "3.1",
  "text": "Implemented real-time monitoring dashboard using Grafana"
}

// Add new job to work experience
{
  "action": "appendItem",
  "id": "3.0",
  "title": "Google — Staff Engineer",
  "content": "Led platform infrastructure team",
  "meta": {
    "dateRange": "2023-Present",
    "location": "Mountain View, CA"
  }
}

// Add new section
{
  "action": "appendSection",
  "title": "Certifications",
  "after": "4.0"
}

// Remove a bullet
{
  "action": "remove",
  "id": "3.2.1"
}

// Move education before experience
{
  "action": "move",
  "id": "4.0",
  "newParent": "root",
  "position": 2
}

// Reorder jobs (most recent first)
{
  "action": "reorder",
  "id": "3.0",
  "order": ["3.2", "3.1"]
}
```

### 6.3 Action Handler Implementation

```typescript
// services/actionHandler.ts

import { AgentAction, ResumeNode, Numbering } from '@/types';
import { 
  findNodeByUid, 
  findParentByChildUid, 
  generateUid, 
  cloneTree 
} from '@/utils/treeUtils';
import { resolveAddress } from '@/utils/numbering';

export class ActionHandler {
  constructor(
    private tree: ResumeNode[],
    private numbering: Numbering
  ) {}

  apply(action: AgentAction): ResumeNode[] {
    const newTree = cloneTree(this.tree);
    
    switch (action.action) {
      case 'replace':
        return this.handleReplace(newTree, action);
      case 'appendBullet':
        return this.handleAppendBullet(newTree, action);
      case 'appendItem':
        return this.handleAppendItem(newTree, action);
      case 'appendSection':
        return this.handleAppendSection(newTree, action);
      case 'remove':
        return this.handleRemove(newTree, action);
      case 'move':
        return this.handleMove(newTree, action);
      case 'reorder':
        return this.handleReorder(newTree, action);
      case 'updateMeta':
        return this.handleUpdateMeta(newTree, action);
      default:
        throw new Error(`Unknown action: ${(action as any).action}`);
    }
  }

  private handleReplace(tree: ResumeNode[], action: ReplaceAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.content = action.text;
    node.title = action.text;
    return tree;
  }

  private handleAppendBullet(tree: ResumeNode[], action: AppendBulletAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.text,
      content: action.text,
      meta: { type: 'bullet' }
    });
    
    return tree;
  }

  private handleAppendItem(tree: ResumeNode[], action: AppendItemAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.title,
      content: action.content,
      meta: { type: 'item', ...action.meta },
      children: []
    });
    
    return tree;
  }

  private handleAppendSection(tree: ResumeNode[], action: AppendSectionAction): ResumeNode[] {
    const newSection: ResumeNode = {
      uid: generateUid(),
      title: action.title,
      meta: { type: 'section' },
      children: []
    };
    
    if (action.after) {
      const afterUid = resolveAddress(action.after, this.numbering);
      if (afterUid) {
        const index = tree.findIndex(n => n.uid === afterUid);
        if (index !== -1) {
          tree.splice(index + 1, 0, newSection);
          return tree;
        }
      }
    }
    
    tree.push(newSection);
    return tree;
  }

  private handleRemove(tree: ResumeNode[], action: RemoveAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parentInfo = findParentByChildUid(tree, uid);
    if (!parentInfo) throw new Error(`Node not found: ${action.id}`);
    
    if (parentInfo.parent === null) {
      tree.splice(parentInfo.index, 1);
    } else {
      parentInfo.parent.children!.splice(parentInfo.index, 1);
    }
    
    return tree;
  }

  private handleMove(tree: ResumeNode[], action: MoveAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    const newParentUid = action.newParent === 'root' 
      ? null 
      : resolveAddress(action.newParent, this.numbering);
    
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parentInfo = findParentByChildUid(tree, uid);
    if (!parentInfo) throw new Error(`Node not found: ${action.id}`);
    
    let node: ResumeNode;
    if (parentInfo.parent === null) {
      node = tree.splice(parentInfo.index, 1)[0];
    } else {
      node = parentInfo.parent.children!.splice(parentInfo.index, 1)[0];
    }
    
    if (newParentUid === null) {
      const pos = action.position ?? tree.length;
      tree.splice(pos, 0, node);
    } else {
      const newParent = findNodeByUid(tree, newParentUid);
      if (!newParent) throw new Error(`New parent not found: ${action.newParent}`);
      
      if (!newParent.children) newParent.children = [];
      const pos = action.position ?? newParent.children.length;
      newParent.children.splice(pos, 0, node);
    }
    
    return tree;
  }

  private handleReorder(tree: ResumeNode[], action: ReorderAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent || !parent.children) {
      throw new Error(`Parent with children not found: ${action.id}`);
    }
    
    const orderUids = action.order.map(addr => {
      const u = resolveAddress(addr, this.numbering);
      if (!u) throw new Error(`Invalid order address: ${addr}`);
      return u;
    });
    
    const newChildren: ResumeNode[] = [];
    orderUids.forEach(orderUid => {
      const child = parent.children!.find(c => c.uid === orderUid);
      if (child) newChildren.push(child);
    });
    
    parent.children.forEach(child => {
      if (!orderUids.includes(child.uid)) {
        newChildren.push(child);
      }
    });
    
    parent.children = newChildren;
    return tree;
  }

  private handleUpdateMeta(tree: ResumeNode[], action: UpdateMetaAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.meta = { ...node.meta, ...action.meta };
    return tree;
  }
}
```

---

## 7. Prompt System

### 7.1 Resume Serialization (`prompts.ts`)

```typescript
// prompts.ts

export function serializeForLLM(tree: ResumeNode[]): string {
  const lines: string[] = [];
  
  function walk(nodes: ResumeNode[], depth: number = 0): void {
    nodes.forEach(node => {
      const indent = '  '.repeat(depth);
      const addr = node.addr || '';
      
      if (node.content && node.content !== node.title) {
        lines.push(`${indent}${addr} ${node.title}`);
        lines.push(`${indent}  ${node.content}`);
      } else {
        lines.push(`${indent}${addr} ${node.title}`);
      }
      
      if (node.children) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}

export function serializeWithMeta(tree: ResumeNode[]): string {
  const lines: string[] = [];
  
  function walk(nodes: ResumeNode[], depth: number = 0): void {
    nodes.forEach(node => {
      const indent = '  '.repeat(depth);
      const addr = node.addr || '';
      
      lines.push(`${indent}${addr} ${node.title}`);
      
      if (node.meta) {
        const metaStr = Object.entries(node.meta)
          .filter(([k, v]) => k !== 'type' && v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        if (metaStr) {
          lines.push(`${indent}  [${metaStr}]`);
        }
      }
      
      if (node.content && node.content !== node.title) {
        lines.push(`${indent}  ${node.content}`);
      }
      
      if (node.children) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}
```

### 7.2 System Prompts

```typescript
// systemPrompts.ts

export const RESUME_AGENT_SYSTEM_PROMPT = `You are a professional resume optimization agent. Your role is to help users improve their resumes through precise, targeted modifications.

## Resume Structure
The resume is represented as a numbered tree structure where each node has a unique address:
- Format: X.Y.Z where X = section, Y = item, Z = sub-item/bullet
- Example: "3.1.2" refers to the 2nd bullet under the 1st job in the Work Experience section
- The root level (X.0) represents top-level sections
- Items within sections use X.Y addressing
- Bullets within items use X.Y.Z addressing

## Understanding Addresses
- **Sections**: 1.0, 2.0, 3.0 (top-level categories)
- **Items**: 3.1, 3.2 (jobs within Work Experience section 3.0)
- **Bullets**: 3.1.1, 3.1.2, 3.1.3 (achievements under first job)

## Your Capabilities
You can perform these actions:

### 1. replace
Change the content of an existing node.
Example: {"action": "replace", "id": "3.1.2", "text": "New bullet text"}

### 2. appendBullet
Add a new bullet point to an existing item.
Example: {"action": "appendBullet", "id": "3.1", "text": "Led team of 5 engineers"}

### 3. appendItem
Add a new item (job, project, degree) to a section.
Example: {"action": "appendItem", "id": "3.0", "title": "Google — Senior Engineer", "content": "Led infrastructure team", "meta": {"dateRange": "2023-Present", "location": "NYC"}}

### 4. appendSection
Create a new top-level section.
Example: {"action": "appendSection", "title": "Certifications", "after": "4.0"}

### 5. remove
Delete a node and all its children.
Example: {"action": "remove", "id": "3.2.1"}

### 6. move
Relocate a node to a different parent.
Example: {"action": "move", "id": "4.0", "newParent": "root", "position": 2}

### 7. reorder
Change the order of sibling nodes.
Example: {"action": "reorder", "id": "3.0", "order": ["3.2", "3.1"]}

### 8. updateMeta
Modify node metadata (dates, locations, etc.).
Example: {"action": "updateMeta", "id": "3.1", "meta": {"dateRange": "2020-2023", "location": "Remote"}}

## Response Format
ALWAYS respond with TWO parts:

1. **Explanation** (conversational): Explain what you're changing and why
2. **Action** (JSON): The structured modification to apply

Example:
"I'll strengthen that bullet point to better quantify your impact.

{
  "action": "replace",
  "id": "3.1.2",
  "text": "Reduced API latency by 60% through Redis caching and query optimization, improving UX for 2M+ daily users"
}"

## Best Practices for Resume Content
- **Action verbs**: Start bullets with Led, Implemented, Designed, Architected, etc.
- **Quantify impact**: Include metrics (%, $, time saved, team size, user count)
- **Specificity**: Name technologies, methodologies, tools
- **Results-oriented**: Focus on outcomes, not just activities
- **Concision**: Keep bullets to 1-2 lines maximum
- **Consistency**: Maintain parallel structure and past tense

## Guidelines
- One action per response unless explicitly asked for multiple changes
- Always reference nodes by numeric addresses (e.g., "3.1.2")
- Preserve formatting and structure unless asked to change
- When adding content, match existing style
- Confirm before removing potentially important information

## Context Awareness
- When a job description is provided, tailor content to match requirements
- Consider experience level when suggesting changes
- Maintain chronological order (most recent first) unless instructed otherwise
- Highlight transferable skills when career pivoting`;

export const JOB_TAILORING_SYSTEM_ADDITION = `
## Job Description Context
The user has provided this target job description:

{JOB_DESCRIPTION}

When making changes:
1. Emphasize skills and experience matching job requirements
2. Use keywords from the job description naturally
3. Highlight achievements demonstrating required competencies
4. Adjust tone to match company culture (if discernible)
5. Prioritize content most relevant to this specific role
6. Quantify achievements that align with job responsibilities`;

export const OPTIMIZATION_GUIDELINES = `
## Resume Optimization Principles

### Quantification Examples
❌ Bad: "Worked on improving the website"
✅ Good: "Increased website performance by 40% through lazy loading and code splitting, reducing bounce rate from 35% to 20%"

❌ Bad: "Responsible for managing a team"
✅ Good: "Led cross-functional team of 8 engineers delivering 3 major features ahead of schedule"

### Strong Action Verbs
- Leadership: Led, Spearheaded, Directed, Orchestrated, Championed
- Technical: Architected, Implemented, Engineered, Optimized, Designed
- Impact: Increased, Reduced, Improved, Accelerated, Streamlined
- Innovation: Pioneered, Launched, Established, Transformed, Revolutionized

### Common Weaknesses to Fix
- Vague phrases: "responsible for", "worked on", "helped with", "assisted"
- Missing metrics: No numbers, percentages, or scale indicators
- Technology-light: Not naming specific tools, languages, frameworks
- Activity vs. outcome: Describing what you did instead of what you achieved`;
```

---

## 8. Store Architecture

### 8.1 Store Structure (`useAppStore.ts`)

```typescript
// store/useAppStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ResumeNode, Numbering, AgentAction, AppPhase } from '@/types';
import { computeNumbering } from '@/utils/numbering';
import { ActionHandler } from '@/services/actionHandler';
import { cloneTree, validateTree } from '@/utils/treeUtils';
import { ResumeBuilder } from '@/services/resumeBuilder';
import { StorageService } from '@/services/storageService';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;
};

type HistoryEntry = {
  id: string;
  tree: ResumeNode[];
  numbering: Numbering;
  timestamp: number;
  description: string;
  action?: AgentAction;
};

interface AppState {
  // Phase management
  phase: AppPhase;
  
  // Core data
  resumeTree: ResumeNode[];
  numbering: Numbering;
  jobDescription: string;
  
  // Chat
  messages: ChatMessage[];
  isProcessing: boolean;
  
  // History (for undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Initialization
  isInitializing: boolean;
  initializationError: string | null;
  
  // Actions
  setPhase: (phase: AppPhase) => void;
  setResumeTree: (tree: ResumeNode[]) => void;
  applyAction: (action: AgentAction, description: string) => void;
  
  // Initialization
  initializeFromPDF: (file: File, jobDesc: string) => Promise<void>;
  setJobDescription: (desc: string) => void;
  
  // Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setProcessing: (processing: boolean) => void;
  clearChat: () => void;
  
  // History
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Utility
  recomputeNumbering: () => void;
  validateResume: () => string[];
  reset: () => void;
}

const initialState = {
  phase: 'welcome' as AppPhase,
  resumeTree: [],
  numbering: { addrToUid: {}, uidToAddr: {} },
  jobDescription: '',
  messages: [],
  isProcessing: false,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  isInitializing: false,
  initializationError: null,
};

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    ...initialState,
    
    setPhase: (phase) => set((state) => {
      state.phase = phase;
    }),
    
    setResumeTree: (tree) => set((state) => {
      const errors = validateTree(tree);
      if (errors.length > 0) {
        console.error('Invalid tree:', errors);
        throw new Error(`Invalid tree structure: ${errors.join(', ')}`);
      }
      
      state.resumeTree = cloneTree(tree);
      state.numbering = computeNumbering(state.resumeTree);
      
      // Auto-save
      StorageService.saveResume(state.resumeTree);
      
      // Add to history
      const entry: HistoryEntry = {
        id: `history_${Date.now()}`,
        tree: cloneTree(state.resumeTree),
        numbering: { ...state.numbering },
        timestamp: Date.now(),
        description: 'Resume loaded'
      };
      
      state.history = [entry];
      state.historyIndex = 0;
    }),
    
    applyAction: (action, description) => set((state) => {
      const handler = new ActionHandler(state.resumeTree, state.numbering);
      
      try {
        const newTree = handler.apply(action);
        state.resumeTree = newTree;
        state.numbering = computeNumbering(state.resumeTree);
        
        // Auto-save
        StorageService.saveResume(state.resumeTree);
        
        // Add to history
        const entry: HistoryEntry = {
          id: `history_${Date.now()}`,
          tree: cloneTree(state.resumeTree),
          numbering: { ...state.numbering },
          timestamp: Date.now(),
          description,
          action
        };
        
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        state.history.push(entry);
        state.historyIndex = state.history.length - 1;
        
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.historyIndex = state.history.length - 1;
        }
      } catch (error) {
        console.error('Failed to apply action:', error);
        throw error;
      }
    }),
    
    initializeFromPDF: async (file, jobDesc) => {
      set((state) => {
        state.isInitializing = true;
        state.initializationError = null;
        state.phase = 'processing';
        state.jobDescription = jobDesc;
      });
      
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const builder = new ResumeBuilder();
        const tree = await builder.buildFromPDF(file, apiKey);
        
        set((state) => {
          state.resumeTree = tree;
          state.numbering = computeNumbering(tree);
          state.isInitializing = false;
          state.phase = 'active';
          
          // Save
          StorageService.saveResume(tree);
          StorageService.saveJobDescription(jobDesc);
          
          // Initialize history
          const entry: HistoryEntry = {
            id: `history_${Date.now()}`,
            tree: cloneTree(tree),
            numbering: { ...state.numbering },
            timestamp: Date.now(),
            description: 'Resume initialized from PDF'
          };
          
          state.history = [entry];
          state.historyIndex = 0;
          
          // Welcome message
          state.messages.push({
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: `Great! I've analyzed your resume${jobDesc ? ' and the job description' : ''}. I can help you optimize it for maximum impact. What would you like to improve?`,
            timestamp: Date.now()
          });
        });
      } catch (error) {
        set((state) => {
          state.isInitializing = false;
          state.initializationError = (error as Error).message;
          state.phase = 'error';
        });
        throw error;
      }
    },
    
    setJobDescription: (desc) => set((state) => {
      state.jobDescription = desc;
      StorageService.saveJobDescription(desc);
    }),
    
    addMessage: (message) => set((state) => {
      state.messages.push({
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now()
      });
    }),
    
    setProcessing: (processing) => set((state) => {
      state.isProcessing = processing;
    }),
    
    clearChat: () => set((state) => {
      state.messages = [];
    }),
    
    undo: () => {
      const state = get();
      if (!state.canUndo()) return false;
      
      set((draft) => {
        draft.historyIndex--;
        const entry = draft.history[draft.historyIndex];
        draft.resumeTree = cloneTree(entry.tree);
        draft.numbering = { ...entry.numbering };
      });
      
      return true;
    },
    
    redo: () => {
      const state = get();
      if (!state.canRedo()) return false;
      
      set((draft) => {
        draft.historyIndex++;
        const entry = draft.history[draft.historyIndex];
        draft.resumeTree = cloneTree(entry.tree);
        draft.numbering = { ...entry.numbering };
      });
      
      return true;
    },
    
    canUndo: () => {
      const state = get();
      return state.historyIndex > 0;
    },
    
    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },
    
    recomputeNumbering: () => set((state) => {
      state.numbering = computeNumbering(state.resumeTree);
    }),
    
    validateResume: () => {
      const state = get();
      return validateTree(state.resumeTree);
    },
    
    reset: () => set(() => ({
      ...initialState,
      phase: 'welcome' as AppPhase
    }))
  }))
);
```

---

## 9. AI Service Layer

### 9.1 Gemini Service (`geminiService.ts`)

```typescript
// services/geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResumeNode, AgentAction } from '@/types';
import { serializeWithMeta } from '@/utils/prompts';
import { 
  RESUME_AGENT_SYSTEM_PROMPT,
  RESUME_STRUCTURING_PROMPT,
  JOB_TAILORING_SYSTEM_ADDITION 
} from '@/utils/systemPrompts';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }
  
  async structureResumeFromText(resumeText: string): Promise<AgentAction[]> {
    const prompt = `${RESUME_STRUCTURING_PROMPT}\n\nResume Text:\n${resumeText}`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse JSON response containing actions
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('AI did not return valid action array');
      }
      
      const actions = JSON.parse(jsonMatch[0]) as AgentAction[];
      return actions;
    } catch (error) {
      console.error('Failed to structure resume:', error);
      throw new Error('Failed to parse resume structure');
    }
  }
  
  async processUserMessage(
    userMessage: string,
    resumeTree: ResumeNode[],
    jobDescription?: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{ explanation: string; action?: AgentAction }> {
    
    // Serialize resume
    const resumeText = serializeWithMeta(resumeTree);
    
    // Build system prompt
    let systemPrompt = RESUME_AGENT_SYSTEM_PROMPT;
    if (jobDescription) {
      systemPrompt += '\n\n' + JOB_TAILORING_SYSTEM_ADDITION.replace(
        '{JOB_DESCRIPTION}',
        jobDescription
      );
    }
    
    // Build conversation context
    const messages = [
      {
        role: 'user',
        parts: [{
          text: `${systemPrompt}\n\n## Current Resume:\n\n${resumeText}`
        }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
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
  
  private parseResponse(response: string): { explanation: string; action?: AgentAction } {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { explanation: response.trim() };
    }
    
    try {
      const action = JSON.parse(jsonMatch[0]) as AgentAction;
      const explanation = response.substring(0, jsonMatch.index).trim();
      
      return { explanation, action };
    } catch (error) {
      console.error('Failed to parse action JSON:', error);
      return { explanation: response.trim() };
    }
  }
  
  async generateSuggestions(
    resumeTree: ResumeNode[],
    jobDescription?: string
  ): Promise<string[]> {
    const resumeText = serializeWithMeta(resumeTree);
    
    let prompt = `Analyze this resume and provide 3-5 specific, actionable suggestions for improvement. Focus on:
1. Quantifying achievements
2. Using stronger action verbs
3. Adding missing technical details
4. Improving clarity and impact

Resume:
${resumeText}`;
    
    if (jobDescription) {
      prompt += `\n\nJob Description:\n${jobDescription}\n\nTailor suggestions to match this role.`;
    }
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const suggestions = response
        .split('\n')
        .filter(line => /^[\d\-\*]/.test(line.trim()))
        .map(line => line.replace(/^[\d\-\*\.]\s*/, '').trim())
        .filter(s => s.length > 0);
      
      return suggestions;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }
}
```

### 9.2 Chat Controller (`chatController.ts`)

```typescript
// services/chatController.ts

import { useAppStore } from '@/store/useAppStore';
import { GeminiService } from './geminiService';
import { AgentAction } from '@/types';

export class ChatController {
  private geminiService: GeminiService;
  
  constructor(apiKey: string) {
    this.geminiService = new GeminiService(apiKey);
  }
  
  async sendMessage(userMessage: string): Promise<void> {
    const store = useAppStore.getState();
    
    store.addMessage({
      role: 'user',
      content: userMessage
    });
    
    store.setProcessing(true);
    
    try {
      const history = store.messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      const result = await this.geminiService.processUserMessage(
        userMessage,
        store.resumeTree,
        store.jobDescription,
        history
      );
      
      store.addMessage({
        role: 'assistant',
        content: result.explanation,
        action: result.action
      });
      
      if (result.action) {
        store.applyAction(result.action, this.getActionDescription(result.action));
      }
    } catch (error) {
      console.error('Chat error:', error);
      store.addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      });
    } finally {
      store.setProcessing(false);
    }
  }
  
  async getSuggestions(): Promise<string[]> {
    const store = useAppStore.getState();
    
    try {
      return await this.geminiService.generateSuggestions(
        store.resumeTree,
        store.jobDescription
      );
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }
  
  private getActionDescription(action: AgentAction): string {
    switch (action.action) {
      case 'replace':
        return `Updated content at ${action.id}`;
      case 'appendBullet':
        return `Added bullet to ${action.id}`;
      case 'appendItem':
        return `Added new item to ${action.id}`;
      case 'appendSection':
        return `Added section: ${action.title}`;
      case 'remove':
        return `Removed ${action.id}`;
      case 'move':
        return `Moved ${action.id} to ${action.newParent}`;
      case 'reorder':
        return `Reordered children of ${action.id}`;
      case 'updateMeta':
        return `Updated metadata for ${action.id}`;
      default:
        return 'Applied change';
    }
  }
}
```

---

## 10. UI Architecture

### 10.1 Component Structure

```
src/
├── app/
│   ├── page.tsx                    # Root page with phase routing
│   └── layout.tsx                  # App layout
│
├── components/
│   ├── Welcome/
│   │   └── WelcomeForm.tsx         # PDF upload + job description form
│   │
│   ├── Resume/
│   │   ├── ResumeView.tsx          # Main resume display
│   │   ├── ResumeSection.tsx       # Section component
│   │   ├── ResumeItem.tsx          # Item component (job, project)
│   │   └── ResumeBullet.tsx        # Bullet point component
│   │
│   ├── Chat/
│   │   ├── ChatInterface.tsx       # Main chat UI
│   │   ├── ChatMessage.tsx         # Individual message
│   │   ├── ChatInput.tsx           # Message input
│   │   ├── ActionPreview.tsx       # Preview of AI action
│   │   └── SuggestionsList.tsx     # AI suggestions
│   │
│   ├── Controls/
│   │   ├── UndoRedoButtons.tsx     # History controls
│   │   ├── JobDescriptionModal.tsx # Edit job description
│   │   ├── ExportButton.tsx        # Export to PDF/DOCX
│   │   └── NewResumeButton.tsx     # Start over
│   │
│   └── Layout/
│       ├── MainLayout.tsx          # Main app layout (2-panel)
│       └── Header.tsx              # Top bar with controls
│
├── services/
│   ├── pdfService.ts               # PDF text extraction
│   ├── geminiService.ts            # AI service
│   ├── resumeBuilder.ts            # Tree construction
│   ├── actionHandler.ts            # Action execution
│   ├── chatController.ts           # Chat orchestration
│   └── storageService.ts           # Local storage
│
├── store/
│   └── useAppStore.ts              # Zustand store
│
├── utils/
│   ├── numbering.ts                # Address computation
│   ├── treeUtils.ts                # Tree manipulation
│   ├── serializationUtils.ts       # Import/export
│   └── prompts.ts                  # Serialization for AI
│
└── types/
    └── index.ts                    # Type definitions
```

### 10.2 Root Page Component

```typescript
// app/page.tsx

'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { WelcomeForm } from '@/components/Welcome/WelcomeForm';
import { MainLayout } from '@/components/Layout/MainLayout';

export default function HomePage() {
  const phase = useAppStore(state => state.phase);
  
  switch (phase) {
    case 'welcome':
      return <WelcomeForm />;
    
    case 'processing':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Analyzing your resume...
            </h2>
            <p className="text-gray-600">
              This may take a few moments
            </p>
          </div>
        </div>
      );
    
    case 'active':
      return <MainLayout />;
    
    case 'error':
      const error = useAppStore(state => state.initializationError);
      const reset = useAppStore(state => state.reset);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Process Resume
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'An unexpected error occurred'}
              </p>
              <button
                onClick={reset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    
    default:
      return null;
  }
}
```

### 10.3 Main Layout Component

```typescript
// components/Layout/MainLayout.tsx

import React from 'react';
import { Header } from './Header';
import { ResumeView } from '@/components/Resume/ResumeView';
import { ChatInterface } from '@/components/Chat/ChatInterface';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Resume Panel */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          <ResumeView />
        </div>
        
        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};
```

### 10.4 Header Component

```typescript
// components/Layout/Header.tsx

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { UndoRedoButtons } from '@/components/Controls/UndoRedoButtons';
import { ExportButton } from '@/components/Controls/ExportButton';
import { NewResumeButton } from '@/components/Controls/NewResumeButton';

export const Header: React.FC = () => {
  const jobDescription = useAppStore(state => state.jobDescription);
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            AI Resume Optimizer
          </h1>
          
          {jobDescription && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              Job-Targeted
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <UndoRedoButtons />
          <ExportButton />
          <NewResumeButton />
        </div>
      </div>
    </header>
  );
};
```

### 10.5 Resume View Components

```typescript
// components/Resume/ResumeView.tsx

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ResumeSection } from './ResumeSection';

export const ResumeView: React.FC = () => {
  const { resumeTree, numbering } = useAppStore();
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      {resumeTree.map((node) => (
        <ResumeSection
          key={node.uid}
          node={node}
          numbering={numbering}
        />
      ))}
    </div>
  );
};
```

```typescript
// components/Resume/ResumeSection.tsx

import React from 'react';
import { ResumeNode, Numbering } from '@/types';
import { ResumeItem } from './ResumeItem';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeSection: React.FC<Props> = ({ node, numbering }) => {
  const isContactSection = node.meta?.type === 'contact';
  
  if (isContactSection) {
    return (
      <div className="mb-6 text-center">
        {node.children?.map((child) => (
          <div key={child.uid} className="text-sm text-gray-600">
            {child.content || child.title}
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">
        {node.title}
      </h2>
      
      {node.content && (
        <p className="mb-4 text-gray-700">{node.content}</p>
      )}
      
      {node.children?.map((child) => (
        <ResumeItem
          key={child.uid}
          node={child}
          numbering={numbering}
        />
      ))}
    </section>
  );
};
```

```typescript
// components/Resume/ResumeItem.tsx

import React from 'react';
import { ResumeNode, Numbering } from '@/types';
import { ResumeBullet } from './ResumeBullet';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeItem: React.FC<Props> = ({ node, numbering }) => {
  const { meta } = node;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{node.title}</h3>
        {meta?.dateRange && (
          <span className="text-sm text-gray-600 italic">
            {meta.dateRange}
          </span>
        )}
      </div>
      
      {meta?.location && (
        <div className="text-sm text-gray-600 mb-2">{meta.location}</div>
      )}
      
      {node.content && (
        <p className="text-gray-700 mb-2">{node.content}</p>
      )}
      
      {node.children && node.children.length > 0 && (
        <ul className="list-disc list-inside space-y-1">
          {node.children.map((bullet) => (
            <ResumeBullet
              key={bullet.uid}
              node={bullet}
              numbering={numbering}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
```

```typescript
// components/Resume/ResumeBullet.tsx

import React, { useState } from 'react';
import { ResumeNode, Numbering } from '@/types';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeBullet: React.FC<Props> = ({ node, numbering }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <li
      className="text-gray-700 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {node.content || node.title}
      
      {isHovered && (
        <span className="absolute -left-16 text-xs text-gray-400 font-mono">
          {node.addr}
        </span>
      )}
    </li>
  );
};
```

### 10.6 Chat Interface

```typescript
// components/Chat/ChatInterface.tsx

import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatController } from '@/services/chatController';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const chatController = new ChatController(apiKey);

export const ChatInterface: React.FC = () => {
  const { messages, isProcessing } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (message: string) => {
    await chatController.sendMessage(message);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSend={handleSend}
        disabled={isProcessing}
      />
    </div>
  );
};
```

```typescript
// components/Chat/ChatInput.tsx

import React, { useState } from 'react';

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<Props> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
          placeholder="Ask me to improve your resume..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
};
```

---

## 11. Data Flow Pipeline

### 11.1 Complete User Journey Flow

```
1. Welcome → Initialization
   User uploads PDF + Job Description
   ↓
   WelcomeForm.handleSubmit()
   ↓
   store.initializeFromPDF(file, jobDesc)
   ↓
   PDFService.extractText(file)
   ↓
   GeminiService.structureResumeFromText(text)
   ↓
   ResumeBuilder.buildFromActions(actions)
   ↓
   store.setResumeTree(tree) + phase = 'active'
   ↓
   MainLayout renders

2. Chat → Resume Update
   User: "Make bullet 3.1.2 more impactful"
   ↓
   ChatInput captures message
   ↓
   ChatController.sendMessage(message)
   ↓
   store.addMessage(userMessage)
   ↓
   GeminiService.processUserMessage()
     ├─> Serialize tree with addresses
     ├─> Build prompt with job description
     └─> Get AI response with action
   ↓
   store.addMessage(aiResponse)
   ↓
   store.applyAction(action)
   ↓
   ActionHandler.apply(action)
     ├─> Resolve address → UID
     ├─> Find target node
     ├─> Apply modification
     └─> Return new tree
   ↓
   store updates resumeTree + numbering
   ↓
   StorageService.saveResume(tree)
   ↓
   React re-renders
     ├─> ResumeView shows updated content
     └─> ChatInterface shows AI response

3. Undo/Redo Flow
   User clicks Undo
   ↓
   store.undo()
   ↓
   Load previous tree from history[historyIndex - 1]
   ↓
   Update resumeTree + numbering
   ↓
   React re-renders with previous state

4. Export Flow
   User clicks Export
   ↓
   ExportButton.handleExport()
   ↓
   Choose format (PDF/DOCX/JSON)
   ↓
   Generate file from tree
   ↓
   Download
```

---

## 12. Error Handling & Validation

### 12.1 Validation Layers

```typescript
// 1. PDF Upload Validation
- File type check (must be PDF)
- File size check (< 10MB)
- Page count check (≤ 10 pages)
- Content check (text extractable)

// 2. Tree Structure Validation
- All nodes have uid
- No duplicate uids
- All nodes have title
- Children arrays are valid

// 3. Action Validation
- Address exists in numbering
- Target node exists
- Parent node exists (for append operations)
- Order addresses valid (for reorder)

// 4. AI Response Validation
- Response contains valid JSON
- Action type is recognized
- Required fields present
```

### 12.2 Error Handling Strategy

```typescript
// services/errorHandler.ts

export class ErrorHandler {
  static handlePDFError(error: Error): string {
    if (error.message.includes('Invalid PDF')) {
      return 'The uploaded file is not a valid PDF. Please try another file.';
    }
    if (error.message.includes('too short')) {
      return 'The resume appears to be empty or has no extractable text.';
    }
    if (error.message.includes('10 pages')) {
      return 'Resume should be maximum 10 pages. Please upload a shorter version.';
    }
    return 'Failed to read PDF file. Please try again.';
  }
  
  static handleAIError(error: Error): string {
    if (error.message.includes('API key')) {
      return 'AI service configuration error. Please contact support.';
    }
    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    return 'AI service temporarily unavailable. Please try again.';
  }
  
  static handleActionError(error: Error): string {
    if (error.message.includes('Invalid address')) {
      return 'Could not apply change: invalid location in resume.';
    }
    if (error.message.includes('not found')) {
      return 'Could not find the specified resume section.';
    }
    return 'Failed to apply change. Please try again.';
  }
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
// __tests__/numbering.test.ts
describe('computeNumbering', () => {
  it('assigns correct addresses to flat tree', () => {});
  it('assigns correct addresses to nested tree', () => {});
  it('creates bidirectional mappings', () => {});
});

// __tests__/actionHandler.test.ts
describe('ActionHandler', () => {
  describe('replace', () => {
    it('updates node content', () => {});
    it('throws on invalid address', () => {});
  });
  
  describe('appendBullet', () => {
    it('adds bullet to item', () => {});
    it('creates children array if missing', () => {});
  });
});

// __tests__/treeUtils.test.ts
describe('findNodeByUid', () => {
  it('finds root node', () => {});
  it('finds nested node', () => {});
  it('returns null for missing node', () => {});
});
```

### 13.2 Integration Tests

```typescript
// __tests__/integration/resumeFlow.test.ts
describe('Resume Update Flow', () => {
  it('processes user message and updates resume', async () => {
    const store = createTestStore();
    const controller = new ChatController(TEST_API_KEY);
    
    await controller.sendMessage('Make bullet 3.1.2 more impactful');
    
    expect(store.getState().resumeTree).toMatchSnapshot();
    expect(store.getState().messages).toHaveLength(2);
  });
});

// __tests__/integration/pdfParsing.test.ts
describe('PDF Parsing Flow', () => {
  it('parses sample resume PDF correctly', async () => {
    const builder = new ResumeBuilder();
    const file = loadTestPDF('sample-resume.pdf');
    
    const tree = await builder.buildFromPDF(file, TEST_API_KEY);
    
    expect(tree).toHaveLength(5); // 5 sections
    expect(tree[0].title).toBe('Contact Information');
    expect(tree[2].title).toBe('Work Experience');
  });
});
```

---

## 14. Performance Considerations

### 14.1 Optimization Strategies

```typescript
// 1. Tree Operations
- Clone only when necessary (actions, history)
- Memoize numbering until tree changes
- Use immer for efficient immutable updates

// 2. React Rendering
- React.memo for resume components
- useMemo for expensive computations
- useCallback for event handlers

// 3. AI Service
- Debounce rapid successive calls
- Limit conversation history to last 10 messages
- Cache suggestions when job description unchanged

// 4. Storage
- Throttle auto-save (save max once per 2 seconds)
- Compress large trees before storing
- IndexedDB for larger resumes (future)
```

### 14.2 Bundle Optimization

```typescript
// next.config.js

module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        pdf: {
          test: /[\\/]node_modules[\\/](pdfjs-dist)[\\/]/,
          name: 'pdf',
          priority: 10,
        },
        ai: {
          test: /[\\/]node_modules[\\/](@google)[\\/]/,
          name: 'ai',
          priority: 10,
        },
      },
    };
    return config;
  },
};
```

---

## 15. Security Considerations

### 15.1 Security Measures

```typescript
// 1. API Key Protection
- Store in environment variables
- Never expose in client code
- Use server-side API routes for sensitive operations

// 2. Input Sanitization
- Validate all user inputs
- Sanitize PDF text before AI processing
- Escape HTML in resume content

// 3. XSS Prevention
- Use React's built-in escaping
- Never use dangerouslySetInnerHTML
- Validate AI responses before rendering

// 4. Rate Limiting
- Limit PDF uploads (max 3 per hour)
- Throttle AI requests
- Implement exponential backoff

// 5. Data Privacy
- All data stored locally (no server)
- Optional: Add encryption for stored resumes
- Clear warning about AI data usage
```

### 15.2 Content Security Policy

```typescript
// next.config.js

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      font-src 'self';
      connect-src 'self' https://generativelanguage.googleapis.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 16. Data Persistence

### 16.1 Storage Service

```typescript
// services/storageService.ts

import { ResumeNode } from '@/types';
import { treeToJSON, treeFromJSON } from '@/utils/serializationUtils';

export class StorageService {
  private static STORAGE_KEY = 'resume_tree_v1';
  private static JOB_DESC_KEY = 'job_description_v1';
  
  static saveResume(tree: ResumeNode[]): void {
    try {
      const json = treeToJSON(tree);
      localStorage.setItem(this.STORAGE_KEY, json);
      localStorage.setItem('resume_saved_at', Date.now().toString());
    } catch (error) {
      console.error('Failed to save resume:', error);
    }
  }
  
  static loadResume(): ResumeNode[] | null {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) return null;
      
      return treeFromJSON(json);
    } catch (error) {
      console.error('Failed to load resume:', error);
      return null;
    }
  }
  
  static saveJobDescription(jobDesc: string): void {
    try {
      localStorage.setItem(this.JOB_DESC_KEY, jobDesc);
    } catch (error) {
      console.error('Failed to save job description:', error);
    }
  }
  
  static loadJobDescription(): string {
    return localStorage.getItem(this.JOB_DESC_KEY) || '';
  }
  
  static clearResume(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.JOB_DESC_KEY);
    localStorage.removeItem('resume_saved_at');
  }
  
  static hasResume(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
  
  static getLastSavedTime(): Date | null {
    const timestamp = localStorage.getItem('resume_saved_at');
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }
}
```

### 16.2 Auto-Save Implementation

```typescript
// hooks/useAutoSave.ts

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StorageService } from '@/services/storageService';

export function useAutoSave(interval: number = 2000) {
  const resumeTree = useAppStore(state => state.resumeTree);
  const jobDescription = useAppStore(state => state.jobDescription);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (resumeTree.length === 0) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule save
    saveTimeoutRef.current = setTimeout(() => {
      StorageService.saveResume(resumeTree);
      StorageService.saveJobDescription(jobDescription);
    }, interval);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [resumeTree, jobDescription, interval]);
}
```

### 16.3 Initial Load with Recovery

```typescript
// app/page.tsx (initialization logic)

useEffect(() => {
  // Check for saved resume
  const savedResume = StorageService.loadResume();
  const savedJobDesc = StorageService.loadJobDescription();
  
  if (savedResume && savedResume.length > 0) {
    // Ask user if they want to continue
    const lastSaved = StorageService.getLastSavedTime();
    const shouldRestore = confirm(
      `Found saved resume from ${lastSaved?.toLocaleString()}. Continue working on it?`
    );
    
    if (shouldRestore) {
      store.setResumeTree(savedResume);
      store.setJobDescription(savedJobDesc);
      store.setPhase('active');
    } else {
      StorageService.clearResume();
      store.setPhase('welcome');
    }
  } else {
    store.setPhase('welcome');
  }
}, []);
```

---

## 17. Export Functionality

### 17.1 Export Service

```typescript
// services/exportService.ts

import { ResumeNode } from '@/types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { treeToJSON } from '@/utils/serializationUtils';

export class ExportService {
  static async exportToPDF(tree: ResumeNode[], filename: string = 'resume.pdf'): Promise<void> {
    const doc = new jsPDF();
    let y = 20;
    
    function addNode(node: ResumeNode, depth: number = 0) {
      const indent = depth * 10;
      const fontSize = depth === 0 ? 16 : depth === 1 ? 12 : 10;
      
      doc.setFontSize(fontSize);
      
      // Add title
      if (depth === 0) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(node.title, 20 + indent, y);
      y += fontSize / 2;
      
      // Add metadata
      if (node.meta?.dateRange || node.meta?.location) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        const metaText = [node.meta.dateRange, node.meta.location]
          .filter(Boolean)
          .join(' | ');
        doc.text(metaText, 20 + indent, y);
        y += 4;
      }
      
      // Add content
      if (node.content && node.content !== node.title) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(node.content, 170 - indent);
        lines.forEach((line: string) => {
          doc.text(line, 20 + indent, y);
          y += 5;
        });
      }
      
      y += 3;
      
      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Process children
      if (node.children) {
        node.children.forEach(child => addNode(child, depth + 1));
      }
    }
    
    tree.forEach(node => addNode(node, 0));
    
    doc.save(filename);
  }
  
  static async exportToDOCX(tree: ResumeNode[], filename: string = 'resume.docx'): Promise<void> {
    const children: Paragraph[] = [];
    
    function addNode(node: ResumeNode, depth: number = 0) {
      // Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: node.title,
              bold: depth === 0,
              size: depth === 0 ? 32 : depth === 1 ? 24 : 20,
            }),
          ],
          spacing: { before: depth === 0 ? 240 : 120, after: 120 },
        })
      );
      
      // Metadata
      if (node.meta?.dateRange || node.meta?.location) {
        const metaText = [node.meta.dateRange, node.meta.location]
          .filter(Boolean)
          .join(' | ');
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: metaText,
                italics: true,
                size: 18,
              }),
            ],
          })
        );
      }
      
      // Content
      if (node.content && node.content !== node.title) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: node.content,
                size: 20,
              }),
            ],
          })
        );
      }
      
      // Children
      if (node.children) {
        node.children.forEach(child => addNode(child, depth + 1));
      }
    }
    
    tree.forEach(node => addNode(node, 0));
    
    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
  }
  
  static exportToJSON(tree: ResumeNode[], filename: string = 'resume.json'): void {
    const json = treeToJSON(tree);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, filename);
  }
}
```

### 17.2 Export Button Component

```typescript
// components/Controls/ExportButton.tsx

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ExportService } from '@/services/exportService';

export const ExportButton: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const resumeTree = useAppStore(state => state.resumeTree);
  
  const handleExport = async (format: 'pdf' | 'docx' | 'json') => {
    setIsExporting(true);
    setShowMenu(false);
    
    try {
      switch (format) {
        case 'pdf':
          await ExportService.exportToPDF(resumeTree);
          break;
        case 'docx':
          await ExportService.exportToDOCX(resumeTree);
          break;
        case 'json':
          ExportService.exportToJSON(resumeTree);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export resume. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExport('docx')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
          >
            Export as DOCX
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
          >
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 18. Configuration

### 18.1 Application Config

```typescript
// config/app.config.ts

export const APP_CONFIG = {
  // AI Service
  geminiModel: 'gemini-2.0-flash-exp',
  maxTokens: 8192,
  temperature: 0.7,
  
  // History
  maxHistorySize: 50,
  
  // Chat
  maxConversationContext: 10,
  
  // UI
  autosaveInterval: 2000, // 2 seconds
  
  // Validation
  maxTreeDepth: 5,
  maxChildrenPerNode: 50,
  maxPDFPages: 10,
  maxPDFSizeMB: 10,
  
  // Export
  pdfPageMargin: 20,
  docxFontSize: 11,
  
  // Storage
  storageVersion: 'v1',
  
  // Features
  enableSuggestions: true,
  enableAutoSave: true,
};
```

### 18.2 Environment Variables

```bash
# .env.local

NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## 19. Future Enhancements

### 19.1 Planned Features

1. **Templates System**
   - Pre-built resume templates
   - Industry-specific formats
   - ATS-friendly designs

2. **Advanced AI Features**
   - Cover letter generation
   - Interview preparation
   - Skills gap analysis
   - Salary negotiation tips

3. **Collaboration**
   - Share resume for feedback
   - Track changes and comments
   - Version comparison

4. **Analytics**
   - ATS compatibility score
   - Keyword optimization
   - Readability analysis

5. **Integration**
   - LinkedIn import
   - Job board API integration
   - Calendar integration for applications

### 19.2 Technical Improvements

1. **Performance**
   - Virtual scrolling for long resumes
   - Service worker for offline support
   - IndexedDB for large datasets

2. **Testing**
   - E2E tests with Playwright
   - Visual regression testing
   - Load testing for AI service

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader optimization
   - Keyboard navigation

4. **Infrastructure**
   - Server-side rendering for SEO
   - Edge caching for static assets
   - CDN for global performance

---

## 20. Deployment Checklist

### 20.1 Pre-Deployment

```bash
✅ Environment variables configured
✅ API keys secured
✅ Security headers set
✅ Error tracking configured (Sentry)
✅ Analytics configured (optional)
✅ Build optimization verified
✅ Bundle size checked (< 500KB initial)
✅ Lighthouse score > 90
✅ Cross-browser testing complete
✅ Mobile responsiveness verified
```

### 20.2 Post-Deployment

```bash
✅ Health check endpoint working
✅ Error monitoring active
✅ Performance metrics tracked
✅ User feedback mechanism in place
✅ Backup strategy implemented
✅ Rate limiting configured
✅ GDPR compliance verified
✅ Terms of service published
✅ Privacy policy published
```

---

## Appendix A: Complete Type Definitions

```typescript
// types/index.ts

export type ResumeNode = {
  uid: string;
  addr?: string;
  title: string;
  content?: string;
  meta?: {
    type?: NodeType;
    dateRange?: string;
    location?: string;
    company?: string;
    role?: string;
    tags?: string[];
    [key: string]: any;
  };
  children?: ResumeNode[];
};

export type NodeType = 
  | 'section' 
  | 'item' 
  | 'bullet' 
  | 'text' 
  | 'contact';

export type ResumeTree = ResumeNode[];

export type Numbering = {
  addrToUid: Record<string, string>;
  uidToAddr: Record<string, string>;
};

export type AppPhase = 
  | 'welcome'
  | 'processing'
  | 'active'
  | 'error';

export type AgentAction = 
  | ReplaceAction
  | AppendBulletAction
  | AppendItemAction
  | AppendSectionAction
  | RemoveAction
  | MoveAction
  | ReorderAction
  | UpdateMetaAction;

export type ReplaceAction = {
  action: 'replace';
  id: string;
  text: string;
};

export type AppendBulletAction = {
  action: 'appendBullet';
  id: string;
  text: string;
};

export type AppendItemAction = {
  action: 'appendItem';
  id: string;
  title: string;
  content?: string;
  meta?: Record<string, any>;
};

export type AppendSectionAction = {
  action: 'appendSection';
  title: string;
  after?: string;
};

export type RemoveAction = {
  action: 'remove';
  id: string;
};

export type MoveAction = {
  action: 'move';
  id: string;
  newParent: string;
  position?: number;
};

export type ReorderAction = {
  action: 'reorder';
  id: string;
  order: string[];
};

export type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;
  meta: Record<string, any>;
};
```

---

## Appendix B: Quick Reference

### Action Quick Reference

| Action | Purpose | Example ID | Use Case |
|--------|---------|------------|----------|
| `replace` | Update existing content | `"3.1.2"` | Improve bullet text |
| `appendBullet` | Add bullet to item | `"3.1"` | Add achievement |
| `appendItem` | Add item to section | `"3.0"` | Add new job |
| `appendSection` | Add new section | N/A | Add certifications |
| `remove` | Delete node | `"3.2.1"` | Remove outdated info |
| `move` | Relocate node | `"4.0"` | Reorder sections |
| `reorder` | Change child order | `"3.0"` | Sort jobs by date |
| `updateMeta` | Modify metadata | `"3.1"` | Update dates |

### Address Format Quick Reference

| Level | Format | Example | Description |
|-------|--------|---------|-------------|
| Section | `X.0` | `3.0` | Work Experience |
| Item | `X.Y` | `3.1` | First job |
| Bullet | `X.Y.Z` | `3.1.2` | Second achievement |

---

**End of Specification**

*Version: 1.0*  
*Last Updated: 2025*"title": "Contact Information"
  },
  {
    "action": "appendItem",
    "id": "1.0",
    "title": "Name",
    "content": "John Doe"
  },
  {
    "action": "appendItem",
    "id": "1.0",
    "title": "Email",
    "content": "john.doe@email.com"
  },
  {
    "action": "appendSection",
    "title": "Professional Summary"
  },
  {
    "action": "appendItem",
    "id": "2.0",
    "title": "Summary",
    "content": "Senior software engineer with 8+ years..."
  },
  {
    "action": "appendSection",
    