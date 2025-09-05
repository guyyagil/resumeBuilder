// src/utils/resumeUpdateHandler.ts
import type { ResumeDataPatch } from '../lib/parseResumeData';
import { useAppStore } from '../store/useAppStore';
import { normalizeExperiences } from './resumeHelpers';

export const handleResumeUpdates = async (
  updates: ResumeDataPatch, 
  addChatMessage: (message: string, type: 'ai' | 'user') => void
) => {
  // === COMPREHENSIVE DEBUG LOGGING ===
  console.log('🔍 === EXPERIENCE DEBUG - START ===');
  console.log('📦 Raw updates received:', JSON.stringify(updates, null, 2));
  console.log('🏢 Current store state before update:', useAppStore.getState().resume);
  
  const {
    addSkills, 
    addOrUpdateExperience, 
    setSummary,
    removeExperience,
    clearAllExperiences,
    replaceAllExperiences,
    removeSkills,
    replaceSkills,
    clearAllSkills,
    clearSummary,
    resetResume,
    replaceEntireResume,
    setContactInfo
  } = useAppStore.getState();

  const operation = updates.operation || 'patch';
  
  console.log('AI Operation:', operation, updates);

  // Helper function to filter out tech-lists and keep actual sentences (Hebrew or English)
  const filterEnglishDescriptions = (descriptions: string[]): string[] => {
    const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
    const WORD_COUNT = (t: string) => (t.trim().split(/\s+/).filter(Boolean).length);
    const TECH_TOKEN = /^[A-Za-z0-9+.#-]{2,30}$/;

    const looksLikeTechList = (text: string) => {
      const tokens = text.split(/[,/|•;]+|\s{2,}/).map(t => t.trim()).filter(Boolean);
      if (tokens.length < 3) return false;
      const techCount = tokens.filter(t => TECH_TOKEN.test(t.replace(/\.$/, '')) && t.length <= 30).length;
      return techCount >= Math.ceil(tokens.length * 0.7);
    };

    const looksLikeGenericPlaceholder = (text: string) => {
      const lower = text.toLowerCase().trim();
      return (
        lower.includes('add measurable accomplishment') ||
        lower.includes('key responsibility') ||
        lower.includes('accomplishment or responsibility') ||
        lower === 'responsibility' ||
        lower === 'accomplishment'
      );
    };

    const looksLikeSentence = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      if (hasHebrew(trimmed)) return true;
      if (/[.!?]$/.test(trimmed)) return true;
      if (WORD_COUNT(trimmed) >= 4) return true;
      if (/\b(develop|developed|build|built|manage|managed|lead|led|implement|implemented|design|designed|maintain|maintained|support|supported|responsible|worked|created|achieved)\b/i.test(trimmed)) return true;
      return false;
    };

    console.log('🔍 Filtering descriptions:', descriptions);
    const results: string[] = [];
    for (const raw of descriptions) {
      const d = (raw || '').toString().trim();
      if (!d) continue;
      
      if (looksLikeGenericPlaceholder(d)) {
        console.log(`Skipping placeholder: ${d}`);
        continue;
      }
      if (looksLikeTechList(d)) {
        console.log(`Skipping tech list: ${d}`);
        continue;
      }
      if (looksLikeSentence(d)) {
        console.log(`Keeping sentence: ${d}`);
        results.push(d);
        continue;
      }
      if (hasHebrew(d) && d.length > 3) {
        console.log(`Keeping Hebrew text: ${d}`);
        results.push(d);
      }
    }
    
    // Simple deduplication by exact match only
    const deduped = [...new Set(results.map(s => s.trim()))];
    
    console.log('🔍 Final filtered descriptions:', deduped);
    return deduped;
  };
  
  function isPlaceholderContact(contact: any) {
    if (!contact) return true;
    return (
      !contact.email ||
      contact.email.includes('example.com') ||
      !contact.phone ||
      contact.phone === '050-1234567' ||
      !contact.location ||
      contact.location === 'תל אביב'
    );
  }

  switch (operation) {
    case 'reset':
      resetResume();
      addChatMessage('🔄 Resume completely reset!', 'ai');
      break;
      
    case 'redesign':
    case 'replace':
      if (updates.completeResume) {
        // Filter English descriptions from experiences
        const filteredExperiences = (updates.completeResume.experiences || []).map(exp => ({
          ...exp,
          duration: exp.duration || undefined, // Convert null to undefined
          description: exp.description ? filterEnglishDescriptions(
            Array.isArray(exp.description) ? exp.description : [exp.description]
          ) : []
        }));

        const normalized = {
          experiences: normalizeExperiences(filteredExperiences),
          skills: updates.completeResume.skills || [],
          summary: updates.completeResume.summary || '',
          fullName: updates.completeResume.contact?.fullName || '',
          email: updates.completeResume.contact?.email || '',
          phone: updates.completeResume.contact?.phone || '',
          location: updates.completeResume.contact?.location || '',
          title: updates.completeResume.contact?.title || ''
        };
        replaceEntireResume(normalized as any);
        addChatMessage('🎨 Complete resume redesign applied!', 'ai');
      } else {
        // Handle individual field replacements
        if (updates.experiences && Array.isArray(updates.experiences)) {
          const filteredExperiences = updates.experiences.map(exp => ({
            ...exp,
            duration: exp.duration || undefined, // Convert null to undefined
            description: exp.description ? filterEnglishDescriptions(
              Array.isArray(exp.description) ? exp.description : [exp.description]
            ) : []
          }));
          const normalized = normalizeExperiences(filteredExperiences);
          replaceAllExperiences(normalized as any);
          addChatMessage('🔄 Replaced all experiences!', 'ai');
        }
        if (updates.skills && Array.isArray(updates.skills)) {
          replaceSkills(updates.skills);
          addChatMessage('🔄 Replaced all skills!', 'ai');
        }
        if (updates.summary && updates.summary.trim()) {
          setSummary(updates.summary.trim());
          addChatMessage('📝 Updated summary!', 'ai');
        }
        if (updates.contact) {
          console.log('📞 === CONTACT PROCESSING ===');
          console.log('Contact data being set:', updates.contact);
          if (!isPlaceholderContact(updates.contact)) {
            setContactInfo(updates.contact);
            addChatMessage('👤 Updated contact information!', 'ai');
          } else {
            console.log('Skipped placeholder contact info:', updates.contact);
          }
        }
      }
      break;
      
    case 'clear':
      if (updates.clearSections && Array.isArray(updates.clearSections)) {
        updates.clearSections.forEach((section: string) => {
          switch (section) {
            case 'experiences':
              clearAllExperiences();
              break;
            case 'skills':
              clearAllSkills();
              break;
            case 'summary':
              clearSummary();
              break;
          }
        });
        addChatMessage(`🗑️ Cleared sections: ${updates.clearSections.join(', ')}`, 'ai');
      }
      break;
      
    case 'remove':
      if (updates.removeExperiences && Array.isArray(updates.removeExperiences)) {
        updates.removeExperiences.forEach((company: string) => {
          removeExperience(company);
        });
        addChatMessage(`❌ Removed experiences: ${updates.removeExperiences.join(', ')}`, 'ai');
      }
      
      if (updates.removeSkills && Array.isArray(updates.removeSkills)) {
        removeSkills(updates.removeSkills);
        addChatMessage(`❌ Removed skills: ${updates.removeSkills.join(', ')}`, 'ai');
      }
      break;
      
    case 'update':
    case 'add':
    case 'patch':
    default:
      console.log('🔍 Processing patch/add/update operation');
      
      // Handle single experience - simplified, trust AI
      if (updates.experience) {
        console.log('🔍 Processing single experience:', updates.experience);
        const exp = updates.experience;
        
        // Basic validation only
        const hasValidCompany = exp.company && exp.company.trim() && exp.company !== 'Company Name';
        const hasValidTitle = exp.title && exp.title.trim() && exp.title !== 'Job Title';
          
        console.log(`🔍 Experience validation: company=${hasValidCompany}, title=${hasValidTitle}`);
        
        if (hasValidCompany && hasValidTitle) {
          let descArray = Array.isArray(exp.description) 
            ? exp.description 
            : typeof exp.description === 'string' 
              ? [exp.description] 
              : [];
              
          // Only filter out obvious placeholders and tech lists
          descArray = filterEnglishDescriptions(descArray);
          
          // If no descriptions remain, add a simple default
          if (descArray.length === 0) {
            descArray = [`עבדתי כ${exp.title} בחברת ${exp.company}.`];
            console.log('🔍 Added minimal default description');
          }
          
          // Handle duration
          let duration = exp.duration;
          if (!duration || duration.trim() === '' || duration === 'לא צוין') {
            duration = undefined;
          } else if (duration.trim()) {
            duration = duration.trim();
          }
          
          const experienceToAdd = {
            id: exp.id || `${exp.company}-${exp.title}`,
            company: exp.company!,
            title: exp.title!,
            duration: duration,
            description: descArray
          };
          
          console.log('🔍 Adding experience:', experienceToAdd);
          addOrUpdateExperience(experienceToAdd as any);
          addChatMessage(`✅ הוספתי/עדכנתי ניסיון בחברת ${exp.company}!`, 'ai');
        } else {
          console.log('🔍 Experience validation failed - basic requirements not met');
        }
      }
      
      // Handle experiences array - simplified
      if (updates.experiences && Array.isArray(updates.experiences)) {
        console.log('🔍 Processing experiences array:', updates.experiences);
        let added = 0;
        updates.experiences.forEach((exp, index) => {
          console.log(`🔍 Processing experience ${index}:`, exp);
          
          const hasValidCompany = exp.company && exp.company.trim() && exp.company !== 'Company Name';
          const hasValidTitle = exp.title && exp.title.trim() && exp.title !== 'Job Title';
            
          if (hasValidCompany && hasValidTitle) {
            let descArray = Array.isArray(exp.description)
              ? exp.description
              : typeof exp.description === 'string'
                ? [exp.description]
                : [];
                
            descArray = filterEnglishDescriptions(descArray);
            
            if (descArray.length === 0) {
              descArray = [`עבדתי כ${exp.title} בחברת ${exp.company}.`];
            }
            
            // Handle duration
            let duration = exp.duration;
            if (!duration || duration.trim() === '' || duration === 'לא צוין') {
              duration = undefined;
            } else if (duration.trim()) {
              duration = duration.trim();
            }
            
            const experienceToAdd = {
              id: exp.id || `${exp.company}-${exp.title}`,
              company: exp.company!,
              title: exp.title!,
              duration: duration,
              description: descArray
            };
            
            console.log(`🔍 Adding experience ${index}:`, experienceToAdd);
            addOrUpdateExperience(experienceToAdd as any);
            added++;
          }
        });
        if (added > 0) {
          addChatMessage(`✅ הוספתי ${added} ניסיונות עבודה!`, 'ai');
          console.log(`🔍 Successfully added ${added} experiences`);
        }
      }
      
      // Handle skills - trust AI completely
      if (updates.skills && Array.isArray(updates.skills)) {
        const validSkills = updates.skills.filter(skill => skill && skill.trim());
        if (validSkills.length > 0) {
          addSkills(validSkills);
          addChatMessage(`✅ הוספתי ${validSkills.length} כישורים!`, 'ai');
        }
      }
      
      // Handle summary
      if (updates.summary && typeof updates.summary === 'string' && updates.summary.trim()) {
        const cleanSummary = updates.summary.trim();
        setSummary(cleanSummary);
        console.log('Setting summary:', cleanSummary);
        addChatMessage('📝 עדכנתי תקציר מקצועי!', 'ai');
      }
      
      // Handle contact
      if (updates.contact) {
        console.log('📞 === CONTACT PROCESSING ===');
        console.log('Contact data being set:', updates.contact);
        if (!isPlaceholderContact(updates.contact)) {
          setContactInfo(updates.contact);
          addChatMessage('👤 עדכנתי פרטי קשר!', 'ai');
        } else {
          console.log('Skipped placeholder contact info:', updates.contact);
        }
      }
      break;
  }
  console.log('🔍 === EXPERIENCE DEBUG - END ===');
  console.log('🏢 Final store state after update:', useAppStore.getState().resume);
};