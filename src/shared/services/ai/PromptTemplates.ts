// Centralized AI Prompt Templates - Single source of truth for all AI interactions

// ============================================================================
// CORE SYSTEM PROMPTS - Base instructions for different AI roles
// ============================================================================

export const CORE_PROMPTS = {
  RESUME_PARSER: `You are a professional resume parser and formatter. Extract content from resumes and structure it professionally. Always return valid JSON.`,
  
  RESUME_DESIGNER: `You are a professional resume designer. Generate beautiful, ATS-friendly HTML/CSS for RESUME CONTENT ONLY. Do not include any layout panels, split views, or editing interfaces. Focus solely on making the resume content beautiful and professional for display in a preview panel.`,
  
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
- Do NOT include any split layout, panels, or editing interfaces
- Focus on making the resume content beautiful and professional
- Make it print-ready and ATS-friendly
- Use clean, modern styling
- Ensure proper spacing and typography

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
        padding: 20px;
        line-height: 1.6;{RTL_STYLES}
    }
    /* More resume-specific styles here */
    </style>
</head>
<body>
    <!-- RESUME CONTENT ONLY -->
    <div class="resume-content">
        <!-- Resume sections here -->
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
    
    let designPrompt = [
      CORE_PROMPTS.RESUME_DESIGNER,
      `# RESUME CONTENT\nTitle: ${title}\n${resumeText}`,
      jobDescription ? `# JOB DESCRIPTION\n${jobDescription}` : '',
      `# DESIGN TEMPLATE: ${template.name}\nStyle: ${template.style}\nDescription: ${template.description}`,
      `## Colors\n- Primary: ${template.colors.primary}\n- Secondary: ${template.colors.secondary}\n- Text: ${template.colors.text}\n- Background: ${template.colors.background}`,
      `## Typography\n- Heading Font: ${template.fonts.heading}\n- Body Font: ${template.fonts.body}`,
      TASK_PROMPTS.DESIGN_GENERATION
        .replace('{FONT_FAMILY}', template.fonts.body)
        .replace('{TEXT_COLOR}', template.colors.text)
        .replace('{BACKGROUND_COLOR}', template.colors.background)
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

    return [
      CORE_PROMPTS.EDITING_AGENT,
      `# CURRENT RESUME CONTEXT\n${resumeContext}`,
      jobDescription ? `# TARGET JOB DESCRIPTION\n${jobDescription}\n\nPlease tailor the edits to align with this job description.` : '',
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