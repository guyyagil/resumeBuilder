// src/utils/resumeUpdateHandler.ts
import type { ResumeDataPatch } from '../lib/parseResumeData';
import { useAppStore } from '../store/useAppStore';
import { normalizeExperiences } from './resumeHelpers';

export const handleResumeUpdates = async (
  updates: ResumeDataPatch, 
  addChatMessage: (message: string, type: 'ai' | 'user') => void
) => {
  // === COMPREHENSIVE DEBUG LOGGING ===
  console.log('🔍 === CONTACT DEBUG - START ===');
  console.log('📦 Raw updates received:', JSON.stringify(updates, null, 2));
  console.log('📞 Contact in updates:', updates.contact);
  console.log('📄 Complete resume in updates:', updates.completeResume);
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
      if (tokens.length < 2) return false;
      const techCount = tokens.filter(t => TECH_TOKEN.test(t.replace(/\.$/, '')) && t.length <= 30).length;
      return techCount >= Math.ceil(tokens.length * 0.6);
    };

    const looksLikeGenericPlaceholder = (text: string) => {
      const lower = text.toLowerCase().trim();
      return (
        lower.includes('add measurable accomplishment') ||
        lower.includes('add measurable') ||
        lower.includes('responsibility') ||
        lower === 'key responsibility' ||
        lower.includes('accomplishment or responsibility')
      );
    };

    const looksLikeSentence = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      if (hasHebrew(trimmed)) return true;
      if (/[.!?]$/.test(trimmed)) return true;
      if (WORD_COUNT(trimmed) >= 6) return true;
      if (/\b(develop|developed|build|built|manage|managed|lead|led|implement|implemented|design|designed|maintain|maintained|support|supported)\b/i.test(trimmed)) return true;
      return false;
    };

    const results: string[] = [];
    for (const raw of descriptions) {
      const d = (raw || '').toString().trim();
      if (!d) continue;
      if (looksLikeGenericPlaceholder(d)) continue;
      if (looksLikeTechList(d)) continue; // drop pure tech lists from descriptions
      if (looksLikeSentence(d)) {
        results.push(d);
        continue;
      }
      if (hasHebrew(d) && d.length > 3) results.push(d);
    }
    // Deduplicate by normalized lowercase text
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const s of results) {
      const key = s.trim().replace(/\s+/g, ' ').toLowerCase();
      if (!seen.has(key)) { seen.add(key); deduped.push(s.trim()); }
    }
    return deduped;
  };
  
  function isPlaceholderContact(contact: any) {
    if (!contact) return true;
    // Add more rules as needed
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
      // Handle single experience
      if (updates.experience) {
        const exp = updates.experience;
        const hasValidCompany = exp.company && exp.company !== 'Company Name' && !exp.company.includes('Needed');
        const hasValidTitle = exp.title && exp.title !== 'Job Title' && !exp.title.includes('Needed');
        if (hasValidCompany && hasValidTitle) {
          let descArray = Array.isArray(exp.description) 
            ? exp.description 
            : typeof exp.description === 'string' 
              ? [exp.description] 
              : ['Key responsibility'];
              
          // Filter out English descriptions
          descArray = filterEnglishDescriptions(descArray);
          if (descArray.length === 0) {
            descArray = [`ביצעתי משימות ${exp.title} בחברת ${exp.company} והשגתי תוצאות מצוינות.`];
          }
              
          addOrUpdateExperience({
            id: exp.id,
            company: exp.company!,
            title: exp.title!,
            duration: exp.duration || '2022 - Present',
            description: descArray
          } as any);
          addChatMessage(`✅ Added/updated experience at ${exp.company}!`, 'ai');
        }
      }
      
      // Handle experiences array
      if (updates.experiences && Array.isArray(updates.experiences)) {
        let added = 0;
        updates.experiences.forEach(exp => {
          if (exp.company && exp.title) {
            let descArray = Array.isArray(exp.description)
              ? exp.description
              : typeof exp.description === 'string'
                ? [exp.description]
                : [];
            descArray = filterEnglishDescriptions(descArray);
            if (descArray.length === 0) descArray = ['פיתחתי ותחזקתי תהליכי עבודה ותשתיות.'];
            addOrUpdateExperience({
              id: exp.id,
              company: exp.company!,
              title: exp.title!,
              duration: exp.duration || '2022 - Present',
              description: descArray
            } as any);
            added++;
          }
        });
        if (added > 0) addChatMessage(`✅ Added ${added} experiences!`, 'ai');
      }
      
      if (updates.skills && Array.isArray(updates.skills)) {
        addSkills(updates.skills);
        addChatMessage(`✅ Added ${updates.skills.length} new skills!`, 'ai');
      }
      
      // Fix summary handling - ensure it's properly set
      if (updates.summary && typeof updates.summary === 'string' && updates.summary.trim()) {
        const cleanSummary = updates.summary.trim();
        setSummary(cleanSummary);
        console.log('Setting summary:', cleanSummary);
        addChatMessage('📝 Updated professional summary!', 'ai');
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
      break;
  }
  console.log('🔍 === CONTACT DEBUG - END ===');
};