// ============================================================================
// CENTRALIZED AI PROMPT TEMPLATES
// Single source of truth for all AI interactions with improved organization
// ============================================================================

// ============================================================================
// 1. CORE SYSTEM PROMPTS - Base AI Role Definitions
// ============================================================================

export const CORE_PROMPTS = {
  /**
   * Resume Parser - Extracts and structures resume content
   */
  RESUME_PARSER: `You are a professional resume parser and formatter. Extract content from resumes and structure it professionally. Always return valid JSON.`,

  /**
   * Resume Designer - Generates HTML/CSS for resume content
   */
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

  /**
   * Writing Assistant - Provides guidance without direct modifications
   */
  WRITING_ASSISTANT: `You are a helpful resume writing assistant. The user is manually editing their resume and needs guidance, suggestions, or help with wording. Provide guidance and advice only - do NOT generate actions or modify content directly.`,

  /**
   * Editing Agent - Processes multiple editing instructions efficiently
   */
  EDITING_AGENT: `You are a specialized resume editing agent. Process multiple editing instructions efficiently and generate precise actions to modify a resume tree structure.`,

  /**
   * Tailoring Agent - Specializes in job-specific resume optimization
   */
  TAILORING_AGENT: `You are an expert resume writer specializing in tailoring resumes to job descriptions.

# 🚨 CRITICAL RULE: DON'T LIE! NEVER FABRICATE OR INVENT INFORMATION!
You can ONLY work with what already exists in the resume. Your job is to:
- EMPHASIZE existing relevant experience
- REWORD existing content to highlight job-relevant aspects  
- REORDER sections to prioritize relevant information
- ADD KEYWORDS naturally to existing descriptions
- MAKE EXISTING ACHIEVEMENTS SOUND MORE IMPRESSIVE

❌ NEVER ADD: New skills, fake experience, invented achievements, technologies not mentioned
✅ ALWAYS: Enhance, emphasize, and reorganize what's already there

# Task: Rewrite the resume tree to maximize alignment with the target job.

# Key Actions:
1. **Rewrite content** to emphasize relevant skills/experience that ALREADY EXISTS
2. **Add keywords** from job description using **bold** markdown to EXISTING content
3. **STRATEGICALLY REORDER** sections and items to prioritize what's most relevant
4. **Adjust styling** (weight: 'bold', emphasis: true) for job-relevant content
5. **Enhance existing achievements** with better wording and quantification

# 🔄 REORDERING STRATEGY - YOU HAVE FULL CONTROL:
- **Reorder sections**: Put most job-relevant sections first (e.g., move "Technical Skills" before "Education" for tech jobs)
- **Reorder experiences**: Within work history, put most relevant jobs/projects first
- **Reorder bullet points**: Within each job, put most relevant achievements first
- **Reorder skills**: Within skills sections, prioritize job-relevant technologies/abilities
- **Think strategically**: What should a recruiter see FIRST to get excited about this candidate?

# Strict Rules:
- Preserve tree structure format (uid, layout, title, text, style, children)
- Keep all original UIDs to maintain integrity
- DO NOT remove personal info or fabricate ANY experiences/skills
- DO NOT add technologies, skills, or experiences not in the original resume
- DO modify wording to better highlight existing relevant experience
- DO reorder everything strategically - sections, jobs, bullet points, skills
- Use **bold** for keywords (e.g., "Developed **React** applications") ONLY if React was already mentioned

# Required Output:
Return ONLY valid JSON in this exact format:
\`\`\`json
{
  "tree": [...complete ResumeNode array...],
  "summary": "Brief summary of changes",
  "changes": ["List of key changes"]
}
\`\`\`

Style properties available: weight ('bold'|'normal'|'light'), emphasis (true|false), fontSize, level (1-3)`
} as const;

// ============================================================================
// 2. LANGUAGE & LOCALIZATION PROMPTS
// ============================================================================

export const LANGUAGE_PROMPTS = {
  /**
   * Language detection and preservation instructions
   */
  DETECT_AND_PRESERVE: (detectedLanguage: string) => `
LANGUAGE INSTRUCTION: The content appears to be in ${detectedLanguage}. 
- Generate all content in the SAME LANGUAGE as the original
- Use appropriate section names for the detected language
- Maintain language consistency throughout`,

  /**
   * Right-to-left (RTL) layout instructions for Hebrew/Arabic content
   */
  RTL_DESIGN_INSTRUCTION: `
CRITICAL RTL REQUIREMENTS:
- This resume contains Hebrew text - use RTL (right-to-left) layout
- Set direction: rtl on the body and main containers
- Align text to the right for Hebrew content
- Use Hebrew-compatible fonts (Arial, Tahoma, or system fonts)
- Ensure proper Hebrew text rendering and spacing`,

  /**
   * Chat language matching instructions
   */
  CHAT_LANGUAGE_INSTRUCTION: (detectedLanguage: string) => `
LANGUAGE INSTRUCTION: Respond in ${detectedLanguage} to match the resume content.
- Provide culturally appropriate advice for the detected language/region
- Match the language of the user's question and resume content`
} as const;

// ============================================================================
// 3. TASK-SPECIFIC INSTRUCTION TEMPLATES
// ============================================================================

export const TASK_PROMPTS = {
  /**
   * PDF content extraction and structuring
   */
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

  /**
   * HTML/CSS design generation template
   */
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

  /**
   * Writing guidance and suggestions
   */
  WRITING_GUIDANCE: `Provide helpful, concise advice based on their current resume content. Focus on:
- Better wording and phrasing for their specific content
- Professional language suggestions appropriate for their language/region
- Content improvement ideas relevant to their resume
- Formatting recommendations
- Industry best practices for their region
- Specific suggestions for their current sections

Keep responses brief and actionable. Do NOT generate any actions or modifications - just provide guidance.`
} as const;

// ============================================================================
// 4. UTILITY FUNCTIONS - Language & Content Detection
// ============================================================================

const LanguageUtils = {
  /**
   * Detects if content contains Hebrew characters
   */
  hasHebrew: (text: string): boolean => /[\u0590-\u05FF]/.test(text),

  /**
   * Detects primary language of content
   */
  detectLanguage: (text: string): string => {
    return LanguageUtils.hasHebrew(text) ? 'Hebrew' : 'English';
  },

  /**
   * Determines if RTL layout is needed
   */
  isRTL: (text: string): boolean => LanguageUtils.hasHebrew(text)
} as const;

// ============================================================================
// 5. TEMPLATE PROCESSING UTILITIES
// ============================================================================

const TemplateUtils = {
  /**
   * Builds layout description from template structure
   */
  buildLayoutDescription: (template: any): string => {
    const { layout, colorScheme } = template;
    const colors = colorScheme.colors;

    let description = `${layout.name}: ${layout.description}\n`;

    if (layout.structure.hasSidebar) {
      description += `- Layout: Two-column with ${layout.structure.sidebarPosition} sidebar\n`;
      description += `- Sidebar width: ${layout.structure.sidebarWidth}, Main content: ${layout.structure.mainContentWidth}\n`;
      description += `- Use sidebar background color: ${colors.sidebarBg}\n`;
      description += `- Place skills, education, and contact info in the sidebar\n`;
      description += `- Place work experience and summary in main content area\n`;
    } else if (layout.structure.headerHeight) {
      description += `- Layout: Large header (${layout.structure.headerHeight}) with content below\n`;
      description += `- Header should be prominent with background color\n`;
    } else {
      description += `- Layout: Single column, clean and traditional\n`;
    }

    description += `- Name size: ${layout.typography.nameSize}\n`;
    description += `- Heading style: ${layout.typography.headingStyle}\n`;
    description += `- Body spacing: ${layout.typography.bodySpacing}\n`;

    return description;
  },

  /**
   * Builds color scheme instructions
   */
  buildColorInstructions: (colorScheme: any): string => {
    const { colors } = colorScheme;

    let instructions = `# COLOR SCHEME: ${colorScheme.name}\nYou MUST use these exact colors:\n`;
    instructions += `- Primary (headings, name): ${colors.primary}\n`;
    instructions += `- Secondary: ${colors.secondary}\n`;
    instructions += `- Text color: ${colors.text}\n`;
    instructions += `- Light text (meta info, dates): ${colors.textLight}\n`;
    instructions += `- Background: ${colors.background}\n`;
    instructions += `- Accent (borders, highlights): ${colors.accent}`;

    if (colors.sidebarBg) {
      instructions += `\n- Sidebar background: ${colors.sidebarBg}`;
    }

    return instructions;
  },

  /**
   * Builds typography instructions
   */
  buildTypographyInstructions: (fonts: any): string => {
    let instructions = `# TYPOGRAPHY\n- Heading font: ${fonts.heading}\n- Body font: ${fonts.body}`;

    if (fonts.accent) {
      instructions += `\n- Accent font: ${fonts.accent}`;
    }

    return instructions;
  }
} as const;

// ============================================================================
// 6. MAIN PROMPT BUILDER CLASS - Centralized Prompt Construction
// ============================================================================

export class PromptBuilder {
  /**
   * Builds prompt for PDF content extraction and structuring
   */
  static buildPDFStructurePrompt(pdfText: string, jobDescription?: string): string {
    const detectedLanguage = LanguageUtils.detectLanguage(pdfText);

    const sections = [
      CORE_PROMPTS.RESUME_PARSER,
      LANGUAGE_PROMPTS.DETECT_AND_PRESERVE(detectedLanguage),
      TASK_PROMPTS.PDF_STRUCTURE_EXTRACTION
    ];

    if (jobDescription) {
      sections.push(`\nJob Description Context:\n${jobDescription}\n\nPlease tailor the content to be relevant for this role.`);
    }

    sections.push(`\nPDF Content:\n${pdfText}`);

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Builds comprehensive design generation prompt
   */
  static buildDesignPrompt(
    resumeText: string,
    title: string,
    template: any,
    jobDescription?: string
  ): string {
    const isRTL = LanguageUtils.isRTL(resumeText + title);
    const { colorScheme } = template;

    const sections = [
      CORE_PROMPTS.RESUME_DESIGNER,
      `# RESUME CONTENT\nTitle: ${title}\n${resumeText}`
    ];

    if (jobDescription) {
      sections.push(`# JOB DESCRIPTION\n${jobDescription}`);
    }

    sections.push(
      `# LAYOUT STRUCTURE\n${TemplateUtils.buildLayoutDescription(template)}`,
      TemplateUtils.buildColorInstructions(colorScheme),
      TemplateUtils.buildTypographyInstructions(template.fonts),
      `## Critical Requirements:\n- Follow the EXACT layout structure described above\n- Use the EXACT colors specified - do not change them\n- Ensure the layout matches the selected template (sidebar position, header style, etc.)\n- Maintain excellent readability and ATS compatibility`,
      TASK_PROMPTS.DESIGN_GENERATION
        .replace('{FONT_FAMILY}', template.fonts.body)
        .replace('{TEXT_COLOR}', colorScheme.colors.text)
        .replace('{BACKGROUND_COLOR}', colorScheme.colors.background)
        .replace('{RTL_STYLES}', isRTL ? '\n        direction: rtl;\n        text-align: right;' : '')
    );

    if (isRTL) {
      sections.push(LANGUAGE_PROMPTS.RTL_DESIGN_INSTRUCTION);
    }

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Builds chat assistance prompt with context
   */
  static buildChatPrompt(
    userMessage: string,
    resumeContent: string,
    resumeTitle?: string
  ): string {
    const detectedLanguage = LanguageUtils.detectLanguage(resumeContent + userMessage);

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

  /**
   * Builds editing instructions processing prompt
   */
  static buildEditingPrompt(
    instructions: any[],
    resumeContext: string,
    jobDescription?: string
  ): string {
    const instructionsText = instructions
      .map((inst, index) => `${index + 1}. [${inst.id}] ${inst.content}`)
      .join('\n');

    const sections = [
      CORE_PROMPTS.EDITING_AGENT,
      `# CURRENT RESUME CONTEXT\n${resumeContext}`
    ];

    if (jobDescription) {
      sections.push(`# JOB TAILORING MODE - TARGET POSITION

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

Always explain how your suggested changes improve alignment with the target position.`);
    }

    sections.push(
      `# EDITING INSTRUCTIONS TO PROCESS\n${instructionsText}`,
      `# TASK\nProcess these editing instructions and generate the appropriate actions to modify the resume.\nReturn the JSON response with the actions and summary.`
    );

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Builds job-specific resume tailoring prompt
   */
  static buildTailoringPrompt(
    originalTree: any[],
    resumeTitle: string,
    jobDescription: string
  ): string {
    // Compress the tree JSON to save tokens
    const treeJson = JSON.stringify(originalTree);

    return [
      CORE_PROMPTS.TAILORING_AGENT,
      `# Original Resume`,
      `Title: ${resumeTitle}`,
      ``,
      `Resume Tree: ${treeJson}`,
      ``,
      `# Target Job Description`,
      jobDescription,
      ``,
      `# CRITICAL OUTPUT INSTRUCTIONS`,
      `You MUST return ONLY a valid JSON object in this exact format:`,
      `\`\`\`json`,
      `{`,
      `  "tree": [...your modified ResumeNode array...],`,
      `  "summary": "Brief summary of changes made",`,
      `  "changes": ["List of key changes made"]`,
      `}`,
      `\`\`\``,
      ``,
      `IMPORTANT: Ensure the JSON is complete and properly closed. Do not truncate the response.`
    ].join('\n');
  }
}

// ============================================================================
// 7. LEGACY EXPORTS - Backward Compatibility
// ============================================================================

/**
 * @deprecated Use CORE_PROMPTS.RESUME_PARSER instead
 */
export const RESUME_STRUCTURING_PROMPT = CORE_PROMPTS.RESUME_PARSER;

/**
 * @deprecated Use CORE_PROMPTS.WRITING_ASSISTANT instead
 */
export const RESUME_AGENT_SYSTEM_PROMPT = CORE_PROMPTS.WRITING_ASSISTANT;

/**
 * @deprecated Use CORE_PROMPTS.EDITING_AGENT instead
 */
export const EDITING_AGENT_SYSTEM_PROMPT = CORE_PROMPTS.EDITING_AGENT;