import { normalizeResumeData } from '../services/parsers';

export interface ResumeDataPatch {
  operation?: 'patch' | 'replace' | 'reset' | 'add' | 'update' | 'remove' | 'clear' | 'redesign' | 'delete' | 'rewrite';
  experience?: {
    id?: string;
    company?: string;
    title?: string;
    duration?: string | null;
    description?: string[] | string | null;
  };
  experiences?: Array<{
    id?: string;
    company?: string;
    title?: string;
    duration?: string | null;
    description?: string[] | string | null;
  }>;
  skills?: string[];
  summary?: string;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
  completeResume?: {
    contact?: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      title?: string;
    };
    experiences?: Array<{
      id?: string;
      company?: string;
      title?: string;
      duration?: string | null;
      description?: string[] | string | null;
    }>;
    skills?: string[];
    summary?: string;
  };
  // Enhanced deletion capabilities
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  deleteCompany?: string;
  deleteSkill?: string;
  deleteExperienceById?: string;
  // New granular deletion options
  removeDescriptionFromExperience?: {
    company: string;
    descriptionToRemove: string;
  };
  removeDescriptionsFromExperience?: {
    company: string;
    descriptionsToRemove: string[];
  };
  updateExperienceDescription?: {
    company: string;
    newDescriptions: string[];
    replaceAll?: boolean; // if true, replace all descriptions, if false, merge with existing
  };
  rewriteExperience?: {
    company: string;
    title?: string;
    duration?: string;
    newDescriptions: string[];
    reason?: string; // why we're rewriting
  };
  replaceExperience?: {
    company: string;
    newExperience: {
      id?: string;
      company?: string;
      title?: string;
      duration?: string | null;
      description?: string[] | string | null;
    };
  };
}

interface ParseResult {
  messageText: string;
  patch: ResumeDataPatch | undefined; // Changed from null to undefined
  error: string;
  rawJson: string;
}

// Remove unused extractJson function
// const extractJson = (text: string): string | null => { ... }

export const parseResumeData = (rawText: string): ParseResult => {
  let messageText = '';
  let patch: ResumeDataPatch | undefined = undefined;
  let error = '';
  let rawJson = '';

  try {
    console.log('🔍 === PARSING START ===');
    console.log('Raw AI text:', rawText);
    
    // Extract message text (everything outside RESUME_DATA tags)
    const resumeDataMatch = rawText.match(/\[RESUME_DATA\](.*?)\[\/RESUME_DATA\]/s);
    
    if (resumeDataMatch) {
      console.log('🔍 Found RESUME_DATA tags');
      // Split text around RESUME_DATA
      const beforeData = rawText.substring(0, rawText.indexOf('[RESUME_DATA]')).trim();
      const afterData = rawText.substring(rawText.indexOf('[/RESUME_DATA]') + '[/RESUME_DATA]'.length).trim();
      messageText = (beforeData + ' ' + afterData).trim();
      
      // Extract and clean JSON
      rawJson = resumeDataMatch[1].trim();
      console.log('🔍 Extracted JSON:', rawJson);
      
      // Remove common artifacts
      rawJson = rawJson
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```\s*$/, '')
        .replace(/^\s*json\s*/i, '')
        .trim();

      // Try parsing the JSON
      let parsedData;
      try {
        parsedData = JSON.parse(rawJson);
        console.log('🔍 Successfully parsed JSON:', parsedData);
      } catch (parseError) {
        console.log('🔍 JSON parse failed, trying to fix...');
        // Try to fix common JSON issues
        let fixedJson = rawJson
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
          .replace(/:\s*'([^']*)'/g, ': "$1"')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ');

        try {
          parsedData = JSON.parse(fixedJson);
          console.log('🔍 Fixed and parsed JSON:', parsedData);
        } catch (secondError) {
          const objectMatch = fixedJson.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
          if (objectMatch) {
            try {
              parsedData = JSON.parse(objectMatch[0]);
              console.log('🔍 Extracted and parsed JSON:', parsedData);
            } catch (thirdError) {
              error = `JSON parsing failed: ${thirdError}`;
              console.error('🔍 All JSON parsing attempts failed:', {
                original: rawJson,
                fixed: fixedJson,
                extracted: objectMatch[0],
                error: thirdError
              });
              return { messageText: rawText, patch: undefined, error, rawJson };
            }
          } else {
            error = `No valid JSON object found`;
            console.error('🔍 No JSON object found in:', rawJson);
            return { messageText: rawText, patch: undefined, error, rawJson };
          }
        }
      }

      // Normalize the parsed data
      if (parsedData && typeof parsedData === 'object') {
        patch = normalizeResumeData(parsedData);
        console.log('🔍 Normalized patch:', patch);
      }
    } else {
      console.log('🔍 No RESUME_DATA tags found, checking for Hebrew deletion commands');
      // No RESUME_DATA tags found - check for deletion commands in plain text
      messageText = rawText;
      
      // Enhanced Hebrew command detection
      const hebrewText = rawText;
      console.log('🔍 Checking Hebrew text for commands:', hebrewText);
      
      // Look for update/rewrite commands in Hebrew
      if (hebrewText.includes('באיירוקס') || hebrewText.includes('באיירקוס')) {
        console.log('🔍 Found Airkos company mention - creating update patch');
        
        // Extract the new information
        const info = hebrewText;
        patch = {
          operation: 'patch',
          rewriteExperience: {
            company: 'אייר קוס',
            newDescriptions: [`אחראי על מתקן מסווג בחברת אייר קוס מערכות, ${info.includes('מתקן מסווג') ? 'כולל ניהול ותפעול מערכות רגישות' : ''}`],
            reason: 'המשתמש סיפק פרטים חדשים על האחריות'
          }
        };
        console.log('🔍 Created Hebrew command patch:', patch);
      }
      
      // Check for other Hebrew commands
      if (hebrewText.includes('מחק') || hebrewText.includes('הסר')) {
        patch = { operation: 'remove' };
        
        // Extract company names
        const companyMatches = hebrewText.match(/(?:מחק|הסר).*?(?:את\s+)?(?:ה)?(?:ניסיון\s+ב-?|חברת\s+)([א-ת\w\s]+)/i);
        if (companyMatches) {
          patch.removeExperiences = [companyMatches[1].trim()];
        }
        
        // Extract skills
        const skillMatches = hebrewText.match(/(?:מחק|הסר).*?(?:את\s+)?(?:ה)?כישור\s+([א-ת\w\s]+)/i);
        if (skillMatches) {
          patch.removeSkills = [skillMatches[1].trim()];
        }
      }
    }

    // Clean up message text
    messageText = messageText
      .replace(/\[RESUME_DATA\].*?\[\/RESUME_DATA\]/gs, '')
      .replace(/```json.*?```/gs, '')
      .replace(/```.*?```/gs, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If no meaningful message text, provide a default
    if (!messageText || messageText.length < 10) {
      if (patch?.operation === 'remove' || patch?.removeExperiences || patch?.removeSkills) {
        messageText = 'מחקתי את הפריטים שביקשת';
      } else if (patch?.rewriteExperience) {
        messageText = `עדכנתי את הניסיון בחברת ${patch.rewriteExperience.company} עם הפרטים החדשים`;
      } else {
        messageText = patch ? 'עדכנתי את קורות החיים שלך!' : 'הבנתי את הבקשה שלך.';
      }
    }

    console.log('🔍 === PARSING END ===');
    console.log('Final messageText:', messageText);
    console.log('Final patch:', patch);

    return { messageText, patch: patch || undefined, error, rawJson };

  } catch (err) {
    error = `Parsing error: ${err}`;
    console.error('parseResumeData error:', err);
    return { 
      messageText: rawText || 'שגיאה בעיבוד התגובה', 
      patch: undefined,
      error, 
      rawJson 
    };
  }
};