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
  TAILORING_AGENT: `Expert resume writer. Tailor resume to job by ONLY enhancing existing content - NEVER invent information.

CRITICAL RULES:
✅ DO: Reorder items, bold keywords, rewrite for clarity/impact, emphasize relevant experience
❌ DON'T: Add new skills/experience, fabricate info, remove content

REWRITING GUIDELINES:
You CAN rewrite sentences to express them better, more professionally, or more impactfully:
- "Made the system faster" → "Optimized system performance"
- "Worked with team" → "Collaborated with cross-functional team"
- "Fixed bugs" → "Resolved critical production issues"

But NEVER invent facts or add information that wasn't there:
- ❌ DON'T add technologies not mentioned (if they used React, don't add Vue)
- ❌ DON'T add achievements that didn't happen (if they led 3 people, don't say 5)
- ❌ DON'T add responsibilities they didn't have
- ✅ DO improve how existing facts are expressed
- ✅ DO use stronger action verbs for existing actions
- ✅ DO make existing achievements sound more professional

PRIORITY & ORDERING STRATEGY:
1. SECTION ORDER: Reorder sections to put most relevant first
   - If "Projects" is highly relevant to the job → move Projects section before Education
   - If "Skills" matches job requirements → move Skills section higher up
   - Most relevant sections should appear earlier in the resume

2. ITEM ORDER WITHIN SECTIONS: Reorder items by relevance
   - Work Experience: Most relevant jobs FIRST (even if not chronologically first)
   - Skills: Most relevant skills FIRST in the list
   - Projects: Most relevant projects FIRST
   - Education: Most relevant degree/certification FIRST

3. BULLET POINT ORDER: Reorder achievements by relevance
   - Put job-relevant achievements at the TOP of each job's bullet list
   - Less relevant bullets go at the bottom

KEYWORD BOLDING STRATEGY:
- Identify keywords from the job description (technologies, skills, methodologies, tools)
- Use **double asterisks** to bold keywords that appear in the resume text
- ONLY bold keywords that are ALREADY in the resume - don't add new ones
- Examples:
  * "Developed applications using React" → "Developed applications using **React**"
  * "Led team of 5 engineers" → "**Led** team of 5 engineers"
  * "Managed AWS infrastructure" → "Managed **AWS** infrastructure"

EXAMPLE TRANSFORMATION:
Job requires: Python, Machine Learning, AWS, Team Leadership

BEFORE (original order):
- Education
- Work Experience
  * Junior Developer at Company A (2020-2021)
    - Built web apps with React
    - Worked with databases
  * Senior ML Engineer at Company B (2021-2023)
    - Developed ML models using Python
    - Deployed on AWS
    - Led team of 3 engineers

AFTER (tailored order + bolded):
- Work Experience
  * Senior ML Engineer at Company B (2021-2023)  ← MOST RELEVANT JOB FIRST
    - Developed **ML models** using **Python**  ← MOST RELEVANT BULLETS FIRST
    - **Led team** of 3 engineers
    - Deployed on **AWS**
  * Junior Developer at Company A (2020-2021)  ← LESS RELEVANT JOB SECOND
    - Built web apps with React
    - Worked with databases
- Education

OUTPUT (JSON only):
{
  "tree": [...array of resume nodes with reordered items and **bolded keywords**...],
  "summary": "Brief changes summary",
  "changes": ["key changes made"]
}

NODE STRUCTURE - Include ONLY these fields:
- type: 'heading' | 'paragraph' | 'list-item' | 'key-value' | 'grid' | 'container'
- title: (optional) heading text
- text: (optional) content text with **bold keywords**
- meta: (optional) metadata like dates, company, location
- children: (optional) array of child nodes (REORDERED by relevance!)

DO NOT INCLUDE:
- NO uid or addr (system generates these)
- NO style, fontSize, color, margins, padding, borders
- NO layout or formatting properties
- Focus ONLY on content, structure, ordering, and **keyword bolding**!`
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
   * PDF content extraction and structuring - DYNAMIC APPROACH
   */
  PDF_STRUCTURE_EXTRACTION: `You are an expert resume parser. Extract and structure ALL content from the resume with ZERO information loss.

CRITICAL REQUIREMENTS - 100% DATA CAPTURE:
⚠️ YOU MUST CAPTURE EVERY PIECE OF INFORMATION - MISSING ANYTHING IS UNACCEPTABLE
- Extract ALL text exactly as written - phone numbers, emails, addresses, links, names, dates, everything
- Identify ALL sections dynamically (do NOT assume specific section names)
- Preserve ALL bullet points, paragraphs, and list items exactly as they appear
- Capture ALL metadata like dates, locations, URLs, email addresses, phone numbers
- Do NOT summarize, skip, or omit ANY content
- Do NOT make assumptions about what's important - include EVERYTHING

DYNAMIC SECTION DETECTION:
- Automatically detect all section types (contact info, summary, experience, education, skills, certifications, projects, etc.)
- Use the ACTUAL section names from the resume (in original language)
- If there's no clear section name, infer it from the content
- Common sections include but are NOT limited to:
  * Contact Information / Personal Details (name, phone, email, address, LinkedIn, website, etc.)
  * Summary / Profile / About / Objective
  * Work Experience / Professional Experience / Employment History
  * Education / Academic Background
  * Skills / Technical Skills / Core Competencies
  * Certifications / Licenses
  * Projects / Portfolio
  * Languages / Language Proficiency
  * Achievements / Awards / Honors
  * Volunteer Work / Community Service
  * Publications / Research
  * References

STRUCTURE GUIDELINES:
- Use "heading" layout for section titles
- Use "paragraph" for continuous text (summaries, descriptions)
- Use "container" for grouped items (job entries, education entries)
- Use "list-item" for bullet points
- Use "text" for simple text content
- Nest content logically: sections → containers → items

METADATA EXTRACTION:
- For work experience: capture job title, company, location, dates
- For education: capture degree, institution, location, dates, GPA if present
- For contact info: capture ALL contact methods (phone, email, address, LinkedIn, GitHub, portfolio, etc.)
- Store metadata in a "meta" object within each node

RESPONSE FORMAT:
Return a JSON object with ONLY these fields:
{
  "title": "Person's Full Name from Resume",
  "sections": [
    {
      "type": "heading",
      "text": "Actual Section Name from Resume",
      "children": [
        {
          "type": "container",
          "text": "Main item heading (e.g., Job Title, Degree Name)",
          "meta": {
            "company": "Company Name",
            "location": "City, State",
            "startDate": "Start Date",
            "endDate": "End Date or Present"
          },
          "children": [
            {
              "type": "list-item",
              "text": "Bullet point or detail exactly as written"
            }
          ]
        },
        {
          "type": "paragraph",
          "text": "Continuous paragraph text for summaries/descriptions"
        }
      ]
    }
  ]
}

WHAT YOU MUST INCLUDE:
- type: The layout type (heading, paragraph, list-item, container, etc.)
- text: The actual content text
- title: (optional) For headings or labeled items
- meta: (optional) Structured data like dates, company, location, email, phone
- children: (optional) Nested content

WHAT YOU MUST NOT INCLUDE:
- NO uid or addr fields (system will generate these)
- NO style, fontSize, color, margins, padding, borders
- NO complex formatting or layout properties
- Only include the content and structure!

VALIDATION CHECKLIST - Before responding, verify:
✓ Did I extract the person's name?
✓ Did I extract ALL contact information (email, phone, address, links)?
✓ Did I extract ALL work experience entries with dates and locations?
✓ Did I extract ALL education entries with dates?
✓ Did I extract ALL skills mentioned?
✓ Did I preserve ALL bullet points under each job/project?
✓ Did I include ALL sections found in the resume?
✓ Is every word from the original resume present in my JSON output?

If the answer to ANY question is NO, go back and add the missing information.`,

  /**
   * HTML/CSS design generation template
   */
  DESIGN_GENERATION: `Generate professional HTML + CSS for ONLY the resume content. This will be displayed in a preview panel.

CRITICAL DATA COMPLETENESS REQUIREMENTS:
⚠️ YOU MUST INCLUDE 100% OF ALL CONTENT FROM THE RESUME - NO OMISSIONS ALLOWED
- Every section header must be included
- Every bullet point must be included
- Every skill, job title, company name, date, location must be included
- Every sentence from the summary/profile must be included
- Do NOT skip, shorten, or summarize ANY content
- Do NOT use ellipsis (...) or "etc."
- Include EVERYTHING exactly as provided in the resume data

CRITICAL COLOR ACCURACY REQUIREMENTS:
⚠️ YOU MUST USE THE EXACT COLORS SPECIFIED - DO NOT MODIFY OR APPROXIMATE
- Use the EXACT hex codes provided for each color
- Do NOT lighten, darken, or adjust any colors
- Do NOT use color names like "blue" or "gray" - only hex codes
- Test all color combinations for sufficient contrast (WCAG AA minimum)
- Primary color: Use ONLY for name, section headings as specified
- Secondary color: Use ONLY where explicitly stated
- Text colors: Use exact values for body text and light text
- Background colors: Use exact values, no gradients unless specified
- Accent colors: Use exact values for borders and highlights only

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

    let description = `${layout.name}: ${layout.description}\n\n`;
    description += `## CRITICAL LAYOUT STRUCTURE - FOLLOW EXACTLY:\n\n`;

    // Layout type specific instructions
    if (layout.structure.hasSidebar) {
      const isLeftSidebar = layout.structure.sidebarPosition === 'left';

      description += `### TWO-COLUMN LAYOUT WITH ${layout.structure.sidebarPosition.toUpperCase()} SIDEBAR\n\n`;
      description += `**CSS Implementation:**\n`;
      description += `\`\`\`css\n`;
      description += `.resume-container {\n`;
      description += `  display: flex;\n`;
      description += `  gap: 2rem;\n`;
      description += `  max-width: 210mm;\n`;
      description += `}\n\n`;

      if (isLeftSidebar) {
        description += `.sidebar {\n`;
        description += `  width: ${layout.structure.sidebarWidth};\n`;
        description += `  background: ${colors.sidebarBg || colors.secondary};\n`;
        description += `  padding: 2rem 1.5rem;\n`;
        description += `  order: 1;  /* LEFT SIDE - MUST BE FIRST */\n`;
        description += `}\n\n`;
        description += `.main-content {\n`;
        description += `  width: ${layout.structure.mainContentWidth};\n`;
        description += `  order: 2;  /* RIGHT SIDE - MUST BE SECOND */\n`;
        description += `}\n`;
      } else {
        description += `.main-content {\n`;
        description += `  width: ${layout.structure.mainContentWidth};\n`;
        description += `  order: 1;  /* LEFT SIDE - MUST BE FIRST */\n`;
        description += `}\n\n`;
        description += `.sidebar {\n`;
        description += `  width: ${layout.structure.sidebarWidth};\n`;
        description += `  background: ${colors.sidebarBg || colors.secondary};\n`;
        description += `  padding: 2rem 1.5rem;\n`;
        description += `  order: 2;  /* RIGHT SIDE - MUST BE SECOND */\n`;
        description += `}\n`;
      }
      description += `\`\`\`\n\n`;

      description += `**Content Distribution - CRITICAL:**\n`;
      description += `📌 SIDEBAR (${layout.structure.sidebarPosition}) MUST CONTAIN:\n`;
      description += `  - Contact information (email, phone, address, LinkedIn)\n`;
      description += `  - Skills (display as colored rounded boxes with padding: 0.5rem 1rem, border-radius: 0.5rem)\n`;
      description += `  - Education\n`;
      description += `  - Certifications/Licenses (if present)\n`;
      description += `  - Languages (if present)\n\n`;
      description += `📌 MAIN CONTENT MUST CONTAIN:\n`;
      description += `  - Professional Summary/Profile\n`;
      description += `  - Work Experience (most important section)\n`;
      description += `  - Projects (if present)\n`;
      description += `  - Publications (if present)\n\n`;
      description += `⚠️ DO NOT mix these sections - sidebar sections stay in sidebar, main sections stay in main!\n\n`;

    } else if (layout.structure.headerHeight) {
      // Bold Header / Header-focus layout
      description += `### BOLD HEADER LAYOUT WITH GRID CONTENT BELOW\n\n`;
      description += `**CSS Implementation:**\n`;
      description += `\`\`\`css\n`;
      description += `.resume-header {\n`;
      description += `  min-height: ${layout.structure.headerHeight};\n`;
      description += `  background: ${colors.primary};\n`;
      description += `  color: ${colors.background};\n`;
      description += `  padding: 2rem 2.5rem;\n`;
      description += `  margin: -2rem -2rem 2rem -2rem;\n`;
      description += `  display: flex;\n`;
      description += `  flex-direction: column;\n`;
      description += `  justify-content: center;\n`;
      description += `}\n\n`;
      description += `.resume-name {\n`;
      description += `  font-size: 3rem;  /* XXLARGE - very prominent */\n`;
      description += `  font-weight: bold;\n`;
      description += `  color: ${colors.background};\n`;
      description += `  margin-bottom: 0.5rem;\n`;
      description += `}\n\n`;
      description += `.contact-info {\n`;
      description += `  display: flex;\n`;
      description += `  gap: 1.5rem;\n`;
      description += `  flex-wrap: wrap;\n`;
      description += `  color: ${colors.background};\n`;
      description += `  font-size: 1rem;\n`;
      description += `}\n\n`;

      if (layout.structure.sectionArrangement === 'grid') {
        description += `/* CRITICAL: Content below header uses TWO-COLUMN GRID */\n`;
        description += `.content-grid {\n`;
        description += `  display: grid;\n`;
        description += `  grid-template-columns: 1fr 1fr;  /* EQUAL width columns */\n`;
        description += `  gap: 3rem;\n`;
        description += `  margin-top: 2rem;\n`;
        description += `}\n\n`;
        description += `/* Place grid items explicitly */\n`;
        description += `.grid-left {\n`;
        description += `  grid-column: 1;  /* LEFT column */\n`;
        description += `}\n\n`;
        description += `.grid-right {\n`;
        description += `  grid-column: 2;  /* RIGHT column */\n`;
        description += `}\n`;
      }
      description += `\`\`\`\n\n`;

      description += `**HTML Structure - CRITICAL:**\n`;
      description += `\`\`\`html\n`;
      description += `<div class="resume-header">\n`;
      description += `  <h1 class="resume-name">[Name]</h1>\n`;
      description += `  <div class="resume-title">[Job Title]</div>\n`;
      description += `  <div class="contact-info">\n`;
      description += `    <span>📧 [email]</span>\n`;
      description += `    <span>📱 [phone]</span>\n`;
      description += `    <span>📍 [location]</span>\n`;
      description += `  </div>\n`;
      description += `</div>\n\n`;

      if (layout.structure.sectionArrangement === 'grid') {
        description += `<!-- First 1-2 full-width sections (Summary, Experience) -->\n`;
        description += `<section>[Professional Summary]</section>\n`;
        description += `<section>[Work Experience - FULL WIDTH]</section>\n\n`;
        description += `<!-- Remaining sections in TWO-COLUMN GRID -->\n`;
        description += `<div class="content-grid">\n`;
        description += `  <div class="grid-left">\n`;
        description += `    <section>[Education - LEFT COLUMN]</section>\n`;
        description += `    <section>[Certifications - LEFT COLUMN]</section>\n`;
        description += `  </div>\n`;
        description += `  <div class="grid-right">\n`;
        description += `    <section>[Skills - RIGHT COLUMN]</section>\n`;
        description += `    <!-- Skills as colored SQUARE boxes with border-radius: 0.25rem -->\n`;
        description += `    <section>[Languages - RIGHT COLUMN]</section>\n`;
        description += `  </div>\n`;
        description += `</div>\n`;
        description += `\`\`\`\n\n`;

        description += `**Section Distribution - EXACTLY AS SHOWN:**\n`;
        description += `1. Header section (full width): Name, title, contact info\n`;
        description += `2. Professional Summary (full width below header)\n`;
        description += `3. Work Experience (full width)\n`;
        description += `4. TWO-COLUMN GRID for remaining sections:\n`;
        description += `   - LEFT COLUMN: Education, Certifications, Projects\n`;
        description += `   - RIGHT COLUMN: Skills (as SQUARED colored boxes), Languages, Interests\n\n`;
        description += `⚠️ Skills MUST be displayed as squared colored boxes:\n`;
        description += `   - background: ${colors.primary}\n`;
        description += `   - color: ${colors.background}\n`;
        description += `   - padding: 0.5rem 1rem\n`;
        description += `   - border-radius: 0.25rem  /* SQUARE corners, not rounded */\n`;
        description += `   - display: inline-block\n`;
        description += `   - margin: 0.25rem\n\n`;
      }

    } else {
      // Single column layout
      description += `### SINGLE COLUMN LAYOUT\n\n`;
      description += `**CSS Implementation:**\n`;
      description += `\`\`\`css\n`;
      description += `.resume-container {\n`;
      description += `  max-width: 210mm;\n`;
      description += `  margin: 0 auto;\n`;
      description += `  padding: 2rem;\n`;
      description += `}\n\n`;
      description += `.resume-header {\n`;
      description += `  border-bottom: 2px solid ${colors.accent};\n`;
      description += `  padding-bottom: 1rem;\n`;
      description += `  margin-bottom: 2rem;\n`;
      description += `}\n`;
      description += `\`\`\`\n\n`;
      description += `**Content Flow:**\n`;
      description += `All sections flow vertically in a single column:\n`;
      description += `1. Name and contact info\n`;
      description += `2. Professional Summary\n`;
      description += `3. Work Experience\n`;
      description += `4. Education\n`;
      description += `5. Skills\n`;
      description += `6. Other sections\n\n`;
    }

    // Typography instructions
    description += `## TYPOGRAPHY STYLING:\n`;
    const nameSizes = { 'large': '2rem', 'xlarge': '2.5rem', 'xxlarge': '3rem' };
    description += `- Name font-size: ${nameSizes[layout.typography.nameSize as keyof typeof nameSizes] || '2rem'}\n`;

    if (layout.typography.headingStyle === 'bold') {
      description += `- Section headings: UPPERCASE, bold, letter-spacing: 1px\n`;
    } else if (layout.typography.headingStyle === 'underline') {
      description += `- Section headings: Bold with bottom border (border-bottom: 2px solid ${colors.accent})\n`;
    } else if (layout.typography.headingStyle === 'background') {
      description += `- Section headings: Background color (background: ${colors.secondary}, padding: 0.75rem, border-radius: 0.25rem)\n`;
    } else {
      description += `- Section headings: Minimal styling, bold text only\n`;
    }

    const spacingValues = { 'compact': '1rem', 'normal': '1.5rem', 'spacious': '2.5rem' };
    description += `- Section spacing (margin-bottom): ${spacingValues[layout.typography.bodySpacing as keyof typeof spacingValues] || '1.5rem'}\n`;

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
      `## Critical Requirements:
⚠️ DATA COMPLETENESS - YOU WILL BE PENALIZED FOR MISSING CONTENT:
- Count all sections, bullets, and content items in the resume data
- Verify every single item appears in your generated HTML
- Do a final check: Does your HTML contain every word from the resume? If not, ADD IT.
- Missing even ONE bullet point or skill is UNACCEPTABLE

⚠️ COLOR ACCURACY - YOU WILL BE PENALIZED FOR WRONG COLORS:
- Copy-paste the EXACT hex codes provided (${colorScheme.colors.primary}, ${colorScheme.colors.secondary}, ${colorScheme.colors.text}, etc.)
- Do NOT invent new colors or shades
- Do NOT use rgba() or color names - ONLY the exact hex codes specified
- Verify: Does each CSS color property use the exact hex from the color scheme? If not, FIX IT.

⚠️ LAYOUT STRUCTURE - VALIDATION CHECKLIST:
Before generating the HTML/CSS, verify:
✓ CSS classes match EXACTLY the structure described (e.g., .content-grid, .grid-left, .grid-right for Bold Header)
✓ Sections are placed in the CORRECT containers (sidebar vs main content)
✓ Column widths match exactly (e.g., sidebar: 35%, main: 65%)
✓ Grid layouts use the exact grid-template-columns specified
✓ Skills display style matches the layout requirement (rounded boxes vs squared boxes)
✓ Header structure follows the layout exactly (colored background for Bold Header)
✓ Visual hierarchy matches the nameSize specification (xxlarge = 3rem, xlarge = 2.5rem)
✓ Flexbox order properties are used correctly for sidebar positioning

COMMON MISTAKES TO AVOID:
❌ DO NOT place Experience in the grid - it should be full-width above the grid (Bold Header layout)
❌ DO NOT use rounded skills (border-radius > 0.3rem) for Bold Header - use squared boxes (0.25rem)
❌ DO NOT swap sidebar content with main content
❌ DO NOT ignore the sectionArrangement: 'grid' instruction
❌ DO NOT create new layout structures - follow the template exactly`,
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
    // Compress the tree JSON maximally to save tokens (no whitespace)
    const treeJson = JSON.stringify(originalTree);

    return [
      CORE_PROMPTS.TAILORING_AGENT,
      `\nRESUME: ${resumeTitle}`,
      `TREE: ${treeJson}`,
      `\nJOB:\n${jobDescription}`,
      `\nReturn complete JSON. No truncation.`
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