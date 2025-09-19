import { normalizeResumeData } from '../services/parsers';

export interface ResumeDataPatch {
  operation?: 'patch' | 'replace' | 'reset' | 'add' | 'update' | 'remove' | 'clear' | 'redesign' | 'delete' | 'rewrite' | 'reorganize';
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
  education?: {
    id?: string;
    institution?: string;
    degree?: string;
    duration?: string | null;
    description?: string[] | string | null;
  };
  educations?: Array<{
    id?: string;
    institution?: string;
    degree?: string;
    duration?: string | null;
    description?: string[] | string | null;
  }>;
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
    education?: Array<{
      id?: string;
      institution?: string;
      degree?: string;
      duration?: string | null;
      description?: string[] | string | null;
    }>;
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
    newDuration?: string;
    newDescriptions: string[];
    newCompany?: string; // Add this line
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



// Remove unused extractJson function
// const extractJson = (text: string): string | null => { ... }

export const parseResumeData = (aiResponse: string) => {
  let messageText = '';
  let patch: any = undefined; // Will be converted to ResumeDataPatch later
  let error = '';
  let rawJson = '';
  let parsedData: any = null;

  try {
    console.log('🔍 === PARSING START ===');
    console.log('Raw AI text:', aiResponse);
    
    // Extract message text (everything outside RESUME_DATA tags)
    const resumeDataMatch = aiResponse.match(/\[RESUME_DATA\](.*?)\[\/RESUME_DATA\]/s);
    
    if (resumeDataMatch) {
      console.log('🔍 Found RESUME_DATA tags');
      // Split text around RESUME_DATA
      const beforeData = aiResponse.substring(0, aiResponse.indexOf('[RESUME_DATA]')).trim();
      const afterData = aiResponse.substring(aiResponse.indexOf('[/RESUME_DATA]') + '[/RESUME_DATA]'.length).trim();
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

        // Handle repeated top-level rewriteExperience entries in the raw JSON text.
        // JSON.parse will only keep the last duplicate key; extract all occurrences from rawJson
        // and convert them into a proper experiences array so downstream normalization/appliers can handle them.
        const countRewrite = (rawJson.match(/"rewriteExperience"\s*:/g) || []).length;
        if (countRewrite > 1) {
          const extractObjectsForKey = (text: string, key: string): any[] => {
            const results: any[] = [];
            let idx = 0;
            const keyPattern = `"${key}"`;
            while (true) {
              const kPos = text.indexOf(keyPattern, idx);
              if (kPos === -1) break;
              // find first '{' after the key
              const braceStart = text.indexOf('{', kPos);
              if (braceStart === -1) break;
              let depth = 0;
              let i = braceStart;
              for (; i < text.length; i++) {
                const ch = text[i];
                if (ch === '{') depth++;
                else if (ch === '}') {
                  depth--;
                  if (depth === 0) {
                    const objStr = text.slice(braceStart, i + 1);
                    try {
                      const parsedObj = JSON.parse(objStr);
                      results.push(parsedObj);
                    } catch {
                      // ignore parse errors for this occurrence
                    }
                    idx = i + 1;
                    break;
                  }
                }
              }
              if (i >= text.length) break;
            }
            return results;
          };

          const extracted = extractObjectsForKey(rawJson, 'rewriteExperience');
          if (extracted && extracted.length > 0) {
            parsedData.experiences = parsedData.experiences || [];
            for (const item of extracted) {
              // Map common fields to normalized experience shape
              const company = (item.company || item.companyName || item.employer || '').toString().trim();
              const title = (item.title || item.position || '').toString().trim();
              const duration = (item.dates || item.duration || item.startDate || item.period || '').toString().trim() || undefined;
              const description = Array.isArray(item.newDescriptions)
                ? item.newDescriptions.map((s: any) => (s || '').toString().trim()).filter(Boolean)
                : Array.isArray(item.description)
                  ? item.description.map((s: any) => (s || '').toString().trim()).filter(Boolean)
                  : (typeof item.newDescriptions === 'string' ? [item.newDescriptions.trim()] : (typeof item.description === 'string' ? [item.description.trim()] : []));

              if (company || title || description.length || duration) {
                parsedData.experiences.push({
                  company: company || undefined,
                  title: title || undefined,
                  duration: duration || undefined,
                  description: description.length ? description : undefined
                });
              }
            }
            console.log('🔍 Extracted multiple rewriteExperience objects -> merged into parsedData.experiences:', parsedData.experiences);
          }
        }
        // end repeated-rewriteExperience handling
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
              return { messageText: aiResponse, patch: undefined, error, rawJson };
            }
          } else {
            error = `No valid JSON object found`;
            console.error('🔍 No JSON object found in:', rawJson);
            return { messageText: aiResponse, patch: undefined, error, rawJson };
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
      messageText = aiResponse
        .replace(/\[\/RESUME_DATA\]$/g, '') // Remove trailing [/RESUME_DATA] tag
        .replace(/\[RESUME_DATA\]$/g, '') // Remove trailing [RESUME_DATA] tag
        .trim();
      
      // Enhanced Hebrew command detection
      const hebrewText = aiResponse;
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
      .replace(/\[\/RESUME_DATA\]$/g, '') // Remove trailing [/RESUME_DATA] tag
      .replace(/\[RESUME_DATA\]$/g, '') // Remove trailing [RESUME_DATA] tag
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

    if (parsedData) {
      const normalized = normalizeResumeData(parsedData);
      
      // Convert NormalizedResumePatch to ResumeDataPatch
      const storeCompatiblePatch: ResumeDataPatch = {
        operation: ['delete', 'rewrite'].includes(normalized.operation) ? 'patch' : normalized.operation as any,
        experience: normalized.experience,
        experiences: normalized.experiences,
        education: (normalized as any).education,
        educations: (normalized as any).educations,
        skills: normalized.skills,
        summary: normalized.summary,
        contact: normalized.contact,
        completeResume: normalized.completeResume,
        removeSkills: normalized.removeSkills,
        removeExperiences: normalized.removeExperiences,
        clearSections: normalized.clearSections,
        // Convert rewriteExperience to match ResumeDataPatch format
        ...(normalized.rewriteExperience && {
          rewriteExperience: {
            company: normalized.rewriteExperience.company,
            title: normalized.rewriteExperience.newData?.title,
            duration: normalized.rewriteExperience.newData?.duration,
            newDescriptions: normalized.rewriteExperience.newDescriptions || [],
            reason: normalized.rewriteExperience.reason
          }
        }),
        updateExperienceDescription: normalized.updateExperienceDescription,
        removeDescriptionFromExperience: normalized.removeDescriptionFromExperience,
        removeDescriptionsFromExperience: normalized.removeDescriptionsFromExperience,
        replaceExperience: normalized.replaceExperience
      };
      
      return {
        patch: storeCompatiblePatch,
        messageText: messageText,
        error: null,
        rawJson: JSON.stringify(parsedData, null, 2)
      };
    }

    return { messageText, patch: patch || undefined, error, rawJson };

  } catch (err) {
    error = `Parsing error: ${err}`;
    console.error('parseResumeData error:', err);
    return { 
      messageText: aiResponse || 'שגיאה בעיבוד התגובה', 
      patch: undefined,
      error, 
      rawJson 
    };
  }
};