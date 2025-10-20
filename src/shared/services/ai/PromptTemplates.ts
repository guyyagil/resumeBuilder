// Centralized AI Prompt Templates - Single source of truth for all AI interactions

// ============================================================================
// CORE SYSTEM PROMPTS - Base instructions for different AI roles
// ============================================================================

export const CORE_PROMPTS = {
  RESUME_PARSER: `You are a professional resume parser and formatter. Extract content from resumes and structure it professionally. Always return valid JSON.`,
  
  RESUME_DESIGNER: `You are a professional resume designer. Generate beautiful, ATS-friendly HTML/CSS for RESUME CONTENT ONLY.

CRITICAL RULES:
1. Do not include any layout panels, split views, or editing interfaces
2. Focus solely on making the resume content beautiful and professional
3. Write all content sections (Profile, Summary, etc.) as complete, well-formed sentences and paragraphs - NEVER as keyword dumps
4. Format skills as clean lists or grids, NOT as run-on comma-separated text
5. Use proper HTML structure with semantic tags (<p>, <ul>, <li>, <h1>-<h3>)
6. The generated HTML must be valid, well-formatted, and render properly in any browser
7. Ensure the exact same content and structure appears whether viewed in preview or printed to PDF

CRITICAL PRINT/PDF REQUIREMENTS:
- NEVER set fixed heights on any container (no height: 100vh, height: 297mm, etc.)
- ALWAYS use height: auto and overflow: visible for print
- Content MUST flow naturally across multiple pages
- Use @media print rules with height: auto !important and overflow: visible !important
- NEVER constrain content with max-height or overflow: hidden`,
  
  WRITING_ASSISTANT: `You are a helpful resume writing assistant. The user is manually editing their resume and needs guidance, suggestions, or help with wording. Provide guidance and advice only - do NOT generate actions or modify content directly.`,
  
  EDITING_AGENT: `You are a specialized resume editing agent. Process multiple editing instructions efficiently and generate precise actions to modify a resume tree structure.`
};

// ============================================================================
// LANGUAGE DETECTION & INSTRUCTIONS
// ============================================================================

export const LANGUAGE_PROMPTS = {
  DETECT_AND_PRESERVE: (detectedLanguage: string) => `
LANGUAGE INSTRUCTION: The content appears to be in ${detectedLanguage}. 
- Generate all content in the SAME LANGUAGE as the original
- Use appropriate section names for the detected language
- Maintain language consistency throughout`,

  RTL_DESIGN_INSTRUCTION: `
CRITICAL RTL REQUIREMENTS:
- This resume contains Hebrew text - use RTL (right-to-left) layout
- Set direction: rtl on the body and main containers
- Align text to the right for Hebrew content
- Use Hebrew-compatible fonts (Arial, Tahoma, or system fonts)
- Ensure proper Hebrew text rendering and spacing`,

  CHAT_LANGUAGE_INSTRUCTION: (detectedLanguage: string) => `
LANGUAGE INSTRUCTION: Respond in ${detectedLanguage} to match the resume content.
- Provide culturally appropriate advice for the detected language/region
- Match the language of the user's question and resume content`
};

// ============================================================================
// TASK-SPECIFIC INSTRUCTIONS
// ============================================================================

export const TASK_PROMPTS = {
  PDF_STRUCTURE_EXTRACTION: `Extract and structure the following resume content into a clean, organized format.

Please return a JSON structure with:
1. A professional title/name for the resume (in detected language)
2. Organized sections with names in the appropriate language
3. Bullet points under each section (preserving original language)
4. Clean, professional language consistent with the detected language

Format as JSON with this structure:
{
  "title": "Professional Name or Title",
  "sections": [
    {
      "type": "heading",
      "text": "Section Name",
      "children": [
        {
          "type": "container", 
          "text": "Job Title at Company",
          "children": [
            {
              "type": "list-item",
              "text": "Achievement or responsibility"
            }
          ]
        }
      ]
    }
  ]
}`,

  DESIGN_GENERATION: `Generate professional HTML + CSS for ONLY the resume content. This will be displayed in a preview panel.

REQUIREMENTS:
- Generate ONLY the resume content HTML/CSS
- MUST include the person's name/title prominently at the TOP of the resume
- Do NOT include any split layout, panels, or editing interfaces
- Focus on making the resume content beautiful and professional
- Make it print-ready and ATS-friendly
- Use clean, modern styling
- Ensure proper spacing and typography
- The name should be the first and most prominent element

CRITICAL CONTENT FORMATTING RULES:
- **Profile/Summary sections**: Write as complete, well-formed paragraphs (2-4 sentences)
- **Skills sections**: Format as a clean list or grid of individual skills (NOT a paragraph of comma-separated items)
- **Experience bullet points**: Write complete sentences describing achievements and responsibilities
- **Contact information**: Format clearly with labels (Phone:, Email:, etc.)
- NEVER output raw keyword dumps or unformatted text
- NEVER create walls of text without proper paragraph breaks
- Use proper HTML semantic tags: <p> for paragraphs, <ul>/<li> for lists, <h1>-<h3> for headings
- Ensure content flows naturally across multiple pages if needed (use page-break-inside: avoid for sections)

Return format:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <style>
    /* CSS for RESUME CONTENT ONLY */
    body {
        font-family: {FONT_FAMILY};
        color: {TEXT_COLOR};
        background: {BACKGROUND_COLOR};
        margin: 0;
        padding: 0;
        line-height: 1.6;{RTL_STYLES}
    }
    .resume-content {
        padding: 40px;
        max-width: 100%;
    }

    /* CRITICAL: Force browsers to print colors and backgrounds */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }

    /* Print-friendly styles */
    @media print {
        /* Force color printing in all browsers */
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        html, body {
            background: white;
            height: auto;
            overflow: visible;
        }
        body, .resume-content {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
        }
        .resume-content {
            padding: 15mm;
        }
        section, .section {
            page-break-inside: avoid;
        }
        h1, h2, h3 {
            page-break-after: avoid;
        }
        * {
            max-height: none !important;
        }
    }
    /* More resume-specific styles here */
    </style>
</head>
<body>
    <!-- RESUME CONTENT ONLY -->
    <div class="resume-content">
        <!-- Resume sections here with proper internal padding -->
    </div>
</body>
</html>
\`\`\``,

  WRITING_GUIDANCE: `Provide helpful, concise advice based on their current resume content. Focus on:
- Better wording and phrasing for their specific content
- Professional language suggestions appropriate for their language/region
- Content improvement ideas relevant to their resume
- Formatting recommendations
- Industry best practices for their region
- Specific suggestions for their current sections

Keep responses brief and actionable. Do NOT generate any actions or modifications - just provide guidance.`
};

// ============================================================================
// CONTEXT BUILDERS - Functions to build complete prompts
// ============================================================================

export class PromptBuilder {
  static buildPDFStructurePrompt(pdfText: string, jobDescription?: string): string {
    const isHebrew = /[\u0590-\u05FF]/.test(pdfText);
    const detectedLanguage = isHebrew ? 'Hebrew' : 'English';
    
    return [
      CORE_PROMPTS.RESUME_PARSER,
      LANGUAGE_PROMPTS.DETECT_AND_PRESERVE(detectedLanguage),
      TASK_PROMPTS.PDF_STRUCTURE_EXTRACTION,
      jobDescription ? `\nJob Description Context:\n${jobDescription}\n\nPlease tailor the content to be relevant for this role.` : '',
      `\nPDF Content:\n${pdfText}`
    ].filter(Boolean).join('\n\n');
  }

  static buildDesignPrompt(
    resumeText: string,
    title: string,
    template: any,
    jobDescription?: string
  ): string {
    const hasHebrew = /[\u0590-\u05FF]/.test(resumeText + title);
    const isRTL = hasHebrew;

    // Extract layout and color scheme from new template structure
    const layout = template.layout;
    const colorScheme = template.colorScheme;
    const colors = colorScheme.colors;

    // Build layout description
    let layoutDescription = `${layout.name}: ${layout.description}\n`;

    if (layout.structure.hasSidebar) {
      layoutDescription += `- Layout: Two-column with ${layout.structure.sidebarPosition} sidebar\n`;
      layoutDescription += `- Sidebar width: ${layout.structure.sidebarWidth}, Main content: ${layout.structure.mainContentWidth}\n`;
      layoutDescription += `- Use sidebar background color: ${colors.sidebarBg}\n`;
      layoutDescription += `- Place skills, education, and contact info in the sidebar\n`;
      layoutDescription += `- Place work experience and summary in main content area\n`;
    } else if (layout.structure.headerHeight) {
      layoutDescription += `- Layout: Large header (${layout.structure.headerHeight}) with content below\n`;
      layoutDescription += `- Header should be prominent with background color\n`;
    } else {
      layoutDescription += `- Layout: Single column, clean and traditional\n`;
    }

    layoutDescription += `- Name size: ${layout.typography.nameSize}\n`;
    layoutDescription += `- Heading style: ${layout.typography.headingStyle}\n`;
    layoutDescription += `- Body spacing: ${layout.typography.bodySpacing}\n`;

    let designPrompt = [
      CORE_PROMPTS.RESUME_DESIGNER,
      `# RESUME CONTENT\nTitle: ${title}\n${resumeText}`,
      jobDescription ? `# JOB DESCRIPTION\n${jobDescription}` : '',
      `# LAYOUT STRUCTURE\n${layoutDescription}`,
      `# COLOR SCHEME: ${colorScheme.name}\nYou MUST use these exact colors:\n- Primary (headings, name): ${colors.primary}\n- Secondary: ${colors.secondary}\n- Text color: ${colors.text}\n- Light text (meta info, dates): ${colors.textLight}\n- Background: ${colors.background}\n- Accent (borders, highlights): ${colors.accent}${colors.sidebarBg ? `\n- Sidebar background: ${colors.sidebarBg}` : ''}`,
      `# TYPOGRAPHY\n- Heading font: ${template.fonts.heading}\n- Body font: ${template.fonts.body}${template.fonts.accent ? `\n- Accent font: ${template.fonts.accent}` : ''}`,
      `## Critical Requirements:\n- Follow the EXACT layout structure described above\n- Use the EXACT colors specified - do not change them\n- Ensure the layout matches the selected template (sidebar position, header style, etc.)\n- Maintain excellent readability and ATS compatibility`,
      TASK_PROMPTS.DESIGN_GENERATION
        .replace('{FONT_FAMILY}', template.fonts.body)
        .replace('{TEXT_COLOR}', colors.text)
        .replace('{BACKGROUND_COLOR}', colors.background)
        .replace('{RTL_STYLES}', isRTL ? '\n        direction: rtl;\n        text-align: right;' : '')
    ].filter(Boolean).join('\n\n');

    if (isRTL) {
      designPrompt += '\n\n' + LANGUAGE_PROMPTS.RTL_DESIGN_INSTRUCTION;
    }

    return designPrompt;
  }

  static buildChatPrompt(
    userMessage: string,
    resumeContent: string,
    resumeTitle?: string
  ): string {
    const hasHebrew = /[\u0590-\u05FF]/.test(resumeContent + userMessage);
    const detectedLanguage = hasHebrew ? 'Hebrew' : 'English';
    
    const currentResumeContext = resumeContent 
      ? `Resume Title: ${resumeTitle || 'Untitled'}\n\nCurrent Resume Content:\n${resumeContent}`
      : 'No resume content loaded yet.';

    return [
      CORE_PROMPTS.WRITING_ASSISTANT,
      LANGUAGE_PROMPTS.CHAT_LANGUAGE_INSTRUCTION(detectedLanguage),
      `CURRENT RESUME CONTEXT:\n${currentResumeContext}`,
      `User question: ${userMessage}`,
      TASK_PROMPTS.WRITING_GUIDANCE
    ].join('\n\n');
  }

  static buildEditingPrompt(
    instructions: any[],
    resumeContext: string,
    jobDescription?: string
  ): string {
    const instructionsText = instructions
      .map((inst, index) => `${index + 1}. [${inst.id}] ${inst.content}`)
      .join('\n');

    const jobTailoringSection = jobDescription ? `
# JOB TAILORING MODE - TARGET POSITION

${jobDescription}

## Your Enhanced Objectives:
When processing edits, actively tailor the resume to this job by:

1. **Keyword Optimization**: Identify key terms, technologies, and skills from the job description and ensure they appear naturally in the resume
2. **Experience Prioritization**: Highlight and reorder experiences that most closely match the job requirements
3. **Skills Alignment**: Emphasize technical and soft skills that directly relate to the position
4. **Achievement Relevance**: Focus on accomplishments that demonstrate capabilities needed for this specific role
5. **Language Matching**: Use similar terminology and phrasing as found in the job description

## Tailoring Strategies:
- **Reorder sections** to put most relevant content first
- **Strengthen bullet points** that align with job requirements
- **Add missing keywords** naturally into existing content
- **Quantify achievements** that demonstrate required competencies
- **Adjust emphasis** to highlight relevant experience over less relevant items

Always explain how your suggested changes improve alignment with the target position.
` : '';

    return [
      CORE_PROMPTS.EDITING_AGENT,
      `# CURRENT RESUME CONTEXT\n${resumeContext}`,
      jobTailoringSection,
      `# EDITING INSTRUCTIONS TO PROCESS\n${instructionsText}`,
      `# TASK\nProcess these editing instructions and generate the appropriate actions to modify the resume.\nReturn the JSON response with the actions and summary.`
    ].filter(Boolean).join('\n\n');
  }
}

// ============================================================================
// LEGACY EXPORTS - For backward compatibility (will be removed)
// ============================================================================

export const RESUME_STRUCTURING_PROMPT = CORE_PROMPTS.RESUME_PARSER;
export const RESUME_AGENT_SYSTEM_PROMPT = CORE_PROMPTS.WRITING_ASSISTANT;
export const EDITING_AGENT_SYSTEM_PROMPT = CORE_PROMPTS.EDITING_AGENT;