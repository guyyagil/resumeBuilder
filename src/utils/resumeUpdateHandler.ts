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
  
  const currentState = useAppStore.getState();
  const currentResume = currentState.resume;
  console.log('🏢 Current store state before update:', currentResume);
  
  // Enhanced duplicate detection helper
  const isDuplicateContent = (newExp: any, existingExperiences: any[]) => {
    if (!newExp.company || !newExp.title) return false;
    
    const existing = existingExperiences.find(e => 
      e.company?.toLowerCase().trim() === newExp.company?.toLowerCase().trim() &&
      e.title?.toLowerCase().trim() === newExp.title?.toLowerCase().trim()
    );
    
    if (!existing) return false;
    
    // Check if descriptions are similar
    const newDescriptions = Array.isArray(newExp.description) ? newExp.description : [newExp.description].filter(Boolean);
    const existingDescriptions = existing.description || [];
    
    // Simple similarity check - look for similar meaning
    for (const newDesc of newDescriptions) {
      if (!newDesc) continue;
      
      for (const existingDesc of existingDescriptions) {
        if (!existingDesc) continue;
        
        // Extract key words and check overlap
        const newWords = newDesc.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const existingWords = existingDesc.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const overlap = newWords.filter((w: string) => existingWords.includes(w)).length;
        const overlapRatio = overlap / Math.max(newWords.length, existingWords.length);
        
        if (overlapRatio > 0.4) {
          console.log(`🔍 Duplicate content detected: ${overlapRatio.toFixed(2)} overlap`);
          console.log(`New: ${newDesc}`);
          console.log(`Existing: ${existingDesc}`);
          return true;
        }
      }
    }
    
    return false;
  };

  // Enhanced content quality checker
  const hasQualityContent = (exp: any) => {
    if (!exp.description || exp.description.length === 0) return false;
    
    const descriptions = Array.isArray(exp.description) ? exp.description : [exp.description];
    return descriptions.some((desc: string) => {
      if (!desc || desc.trim().length < 10) return false;
      
      // Check for action verbs in Hebrew
      const hasActionVerb = /^(פיתחתי|ניהלתי|הובלתי|יצרתי|בניתי|תכננתי|עבדתי|אחראי|ביצעתי|השתתפתי)/.test(desc.trim());
      
      // Check for specific details (numbers, technologies, achievements)
      const hasDetails = /\d+|[A-Z][a-z]+\s*[A-Z][a-z]*|פרויקט|מערכת|אפליקציה|טכנולוגיה/.test(desc);
      
      return hasActionVerb || hasDetails || desc.trim().split(/\s+/).length > 8;
    });
  };

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
  } = currentState;

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
      addChatMessage('🔄 נקיתי את כל קורות החיים!', 'ai');
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
              addChatMessage('🗑️ מחקתי את כל ניסיון העבודה', 'ai');
              break;
            case 'skills':
              clearAllSkills();
              addChatMessage('🗑️ מחקתי את כל הכישורים', 'ai');
              break;
            case 'summary':
              clearSummary();
              addChatMessage('🗑️ מחקתי את התקציר המקצועי', 'ai');
              break;
          }
        });
      }
      break;
      
    case 'rewrite':
      console.log('🔄 === REWRITE OPERATION START ===');
      if (updates.rewriteExperience) {
        const { company, title, duration, newDescriptions, reason } = updates.rewriteExperience;
        console.log('🔄 Rewriting experience for company:', company);
        console.log('🔄 New descriptions:', newDescriptions);
        console.log('🔄 Reason:', reason);
        
        // Find and update the experience - with robust matching
        const companyToFind = company?.toLowerCase().trim();
        const currentExp = currentResume.experiences.find(e => {
          const existingCompany = e.company?.toLowerCase().trim();
          if (!existingCompany || !companyToFind) return false;
          
          const normExisting = existingCompany.replace(/\s+/g, '').replace('בע"מ', '').replace('בעמ', '');
          const normToFind = companyToFind.replace(/\s+/g, '').replace('בע"מ', '').replace('בעמ', '');
          
          return normExisting.includes(normToFind) || normToFind.includes(normExisting);
        });
        
        if (currentExp) {
          console.log('🔄 Found matching experience:', currentExp);
          const updatedExp = {
            ...currentExp,
            ...(title && { title }),
            ...(duration !== undefined && { duration }),
            description: filterEnglishDescriptions(newDescriptions || [])
          };
          
          console.log('🔄 Updated experience object:', updatedExp);
          
          // Update in-place (preserve the original position) — do NOT remove then re-add
          addOrUpdateExperience(updatedExp as any);
          
          const reasonText = reason ? ` (${reason})` : '';
          addChatMessage(`🔄 כתבתי מחדש את הניסיון בחברת ${currentExp.company}${reasonText}`, 'ai');
          console.log('🔄 Successfully updated experience');
        } else {
          console.log('🔄 No matching experience found for company:', company);
          console.log('🔄 Available companies:', currentResume.experiences.map(e => e.company));
          addChatMessage(`⚠️ לא מצאתי ניסיון בחברת ${company} לכתיבה מחדש`, 'ai');
        }
      } else {
        console.log('🔄 No rewriteExperience data in updates');
      }
      break;
      
    case 'remove':
    case 'delete':
      console.log('🗑️ === DELETION OPERATION START ===');
      let deletedItems: string[] = [];
      
      // Handle granular deletions from experiences
      if (updates.removeDescriptionFromExperience) {
        const { company, descriptionToRemove } = updates.removeDescriptionFromExperience;
        console.log(`🗑️ Removing specific description from ${company}: ${descriptionToRemove}`);
        
        const experience = currentResume.experiences.find(e => 
          e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
        );
        
        if (experience && experience.description) {
          const filteredDescriptions = experience.description.filter(desc => 
            !desc.toLowerCase().includes(descriptionToRemove.toLowerCase())
          );
          
          if (filteredDescriptions.length !== experience.description.length) {
            const updatedExp = { ...experience, description: filteredDescriptions };
            // Update in-place (preserve position)
            addOrUpdateExperience(updatedExp as any);
            deletedItems.push(`תיאור "${descriptionToRemove}" מחברת ${company}`);
          } else {
            console.log(`❌ Description not found: ${descriptionToRemove}`);
          }
        }
      }
      
      if (updates.removeDescriptionsFromExperience) {
        const { company, descriptionsToRemove } = updates.removeDescriptionsFromExperience;
        console.log(`🗑️ Removing multiple descriptions from ${company}`);
        
        const experience = currentResume.experiences.find(e => 
          e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
        );
        
        if (experience && experience.description) {
          let filteredDescriptions = [...experience.description];
          
          descriptionsToRemove.forEach(descToRemove => {
            filteredDescriptions = filteredDescriptions.filter(desc => 
              !desc.toLowerCase().includes(descToRemove.toLowerCase())
            );
          });
          
          if (filteredDescriptions.length !== experience.description.length) {
            const updatedExp = { ...experience, description: filteredDescriptions };
            // Update in-place (preserve position)
            addOrUpdateExperience(updatedExp as any);
            deletedItems.push(`${descriptionsToRemove.length} תיאורים מחברת ${company}`);
          }
        }
      }
      
      // Remove experiences by company name
      if (updates.removeExperiences && Array.isArray(updates.removeExperiences)) {
        console.log('🗑️ Removing experiences:', updates.removeExperiences);
        updates.removeExperiences.forEach((company: string) => {
          const beforeCount = currentResume.experiences.length;
          console.log(`🗑️ Attempting to remove experience: ${company}`);
          removeExperience(company);
          const afterCount = useAppStore.getState().resume.experiences.length;
          console.log(`🗑️ Before: ${beforeCount}, After: ${afterCount}`);
          if (afterCount < beforeCount) {
            deletedItems.push(`ניסיון בחברת ${company}`);
            console.log(`✅ Successfully removed experience: ${company}`);
          } else {
            console.log(`❌ Failed to remove experience: ${company}`);
          }
        });
      }
      
      // Remove single company
      if (updates.deleteCompany) {
        console.log('🗑️ Removing single company:', updates.deleteCompany);
        const beforeCount = currentResume.experiences.length;
        removeExperience(updates.deleteCompany);
        const afterCount = useAppStore.getState().resume.experiences.length;
        if (afterCount < beforeCount) {
          deletedItems.push(`ניסיון בחברת ${updates.deleteCompany}`);
        }
      }
      
      // Remove experience by ID
      if (updates.deleteExperienceById) {
        console.log('🗑️ Removing experience by ID:', updates.deleteExperienceById);
        const beforeCount = currentResume.experiences.length;
        removeExperience(updates.deleteExperienceById);
        const afterCount = useAppStore.getState().resume.experiences.length;
        if (afterCount < beforeCount) {
          deletedItems.push(`ניסיון עבודה`);
        }
      }
      
      // Remove skills
      if (updates.removeSkills && Array.isArray(updates.removeSkills)) {
        console.log('🗑️ Removing skills:', updates.removeSkills);
        const beforeSkills = new Set(currentResume.skills);
        removeSkills(updates.removeSkills);
        const afterSkills = new Set(useAppStore.getState().resume.skills);
        updates.removeSkills.forEach(skill => {
          if (beforeSkills.has(skill) && !afterSkills.has(skill)) {
            deletedItems.push(`כישור: ${skill}`);
            console.log(`✅ Successfully removed skill: ${skill}`);
          } else {
            console.log(`❌ Failed to remove skill: ${skill}`);
          }
        });
      }
      
      // Remove single skill
      if (updates.deleteSkill) {
        console.log('🗑️ Removing single skill:', updates.deleteSkill);
        const beforeSkills = new Set(currentResume.skills);
        removeSkills([updates.deleteSkill]);
        const afterSkills = new Set(useAppStore.getState().resume.skills);
        if (beforeSkills.has(updates.deleteSkill) && !afterSkills.has(updates.deleteSkill)) {
          deletedItems.push(`כישור: ${updates.deleteSkill}`);
        }
      }
      
      console.log('🗑️ === DELETION OPERATION END ===');
      console.log('🗑️ Deleted items:', deletedItems);
      
      if (deletedItems.length > 0) {
        addChatMessage(`🗑️ מחקתי בהצלחה: ${deletedItems.join(', ')}`, 'ai');
      } else {
        addChatMessage(`⚠️ לא מצאתי פריטים למחיקה או שהם כבר לא קיימים`, 'ai');
      }
      break;
      
    case 'update':
    case 'add':
    case 'patch':
    default:
      console.log('🔍 Processing patch/add/update operation with granular controls');
      
      // Handle dynamic rewrite during patch operation
      if (updates.rewriteExperience) {
        console.log('🔄 Processing rewriteExperience in patch operation');
        const { company, title, duration, newDescriptions, reason } = updates.rewriteExperience;
        console.log('🔄 Rewriting in patch - company:', company);
        console.log('🔄 Rewriting in patch - descriptions:', newDescriptions);
        
        // Find experience with robust matching
        const companyToFind = company?.toLowerCase().trim();
        const currentExp = currentResume.experiences.find(e => {
          const existingCompany = e.company?.toLowerCase().trim();
          if (!existingCompany || !companyToFind) return false;
          
          const normExisting = existingCompany.replace(/\s+/g, '').replace('בע"מ', '').replace('בעמ', '');
          const normToFind = companyToFind.replace(/\s+/g, '').replace('בע"מ', '').replace('בעמ', '');
          
          return normExisting.includes(normToFind) || normToFind.includes(normExisting);
        });
        
        if (currentExp) {
          console.log('🔄 Found matching experience for patch rewrite:', currentExp);
          const updatedExp = {
            ...currentExp,
            ...(title && { title }),
            ...(duration !== undefined && { duration }),
            description: filterEnglishDescriptions(newDescriptions || [])
          };
          
          console.log('🔄 Updating experience in patch:', updatedExp);
          
          removeExperience(currentExp.company);
          addOrUpdateExperience(updatedExp as any);
          
          const reasonText = reason ? ` (${reason})` : '';
          addChatMessage(`🔄 כתבתי מחדש את הניסיון בחברת ${currentExp.company}${reasonText}`, 'ai');
        } else {
          console.log('🔄 No experience found to rewrite in patch operation');
          console.log('🔄 Looking for:', company);
          console.log('🔄 Available experiences:', currentResume.experiences);
        }
      }
      
      // Handle granular description updates
      if (updates.updateExperienceDescription) {
        const { company, newDescriptions, replaceAll } = updates.updateExperienceDescription;
        console.log(`🔄 Updating descriptions for ${company}, replaceAll: ${replaceAll}`);
        
        const experience = currentResume.experiences.find(e => 
          e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
        );
        
        if (experience) {
          const filteredNewDescriptions = filterEnglishDescriptions(newDescriptions);
          
          const updatedDescriptions = replaceAll 
            ? filteredNewDescriptions
            : [...(experience.description || []), ...filteredNewDescriptions];
          
          const updatedExp = { 
            ...experience, 
            description: Array.from(new Set(updatedDescriptions)) // Remove duplicates
          };
          
          // Update in-place (preserve position)
          addOrUpdateExperience(updatedExp as any);
          
          const action = replaceAll ? 'החלפתי' : 'הוספתי';
          addChatMessage(`✅ ${action} תיאורים בחברת ${company}`, 'ai');
        } else {
          addChatMessage(`⚠️ לא מצאתי חברת ${company} לעדכון`, 'ai');
        }
      }
      
      // Handle granular deletions in patch operation
      if (updates.removeDescriptionFromExperience) {
        const { company, descriptionToRemove } = updates.removeDescriptionFromExperience;
        const experience = currentResume.experiences.find(e => 
          e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
        );
        
        if (experience && experience.description) {
          const filteredDescriptions = experience.description.filter(desc => 
            !desc.toLowerCase().includes(descriptionToRemove.toLowerCase())
          );
          
          if (filteredDescriptions.length !== experience.description.length) {
            const updatedExp = { ...experience, description: filteredDescriptions };
            // Update in-place
            addOrUpdateExperience(updatedExp as any);
            addChatMessage(`🗑️ הסרתי את התיאור "${descriptionToRemove}" מחברת ${company}`, 'ai');
          }
        }
      }
      
      if (updates.removeDescriptionsFromExperience) {
        const { company, descriptionsToRemove } = updates.removeDescriptionsFromExperience;
        const experience = currentResume.experiences.find(e => 
          e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
        );
        
        if (experience && experience.description) {
          let filteredDescriptions = [...experience.description];
          
          descriptionsToRemove.forEach(descToRemove => {
            filteredDescriptions = filteredDescriptions.filter(desc => 
              !desc.toLowerCase().includes(descToRemove.toLowerCase())
            );
          });
          
          if (filteredDescriptions.length !== experience.description.length) {
            const updatedExp = { ...experience, description: filteredDescriptions };
            // Update in-place
            addOrUpdateExperience(updatedExp as any);
            addChatMessage(`🗑️ הסרתי ${descriptionsToRemove.length} תיאורים מחברת ${company}`, 'ai');
          }
        }
      }
      
      // Handle deletions FIRST (before adding new content)
      let deletionsProcessed = false;
      
      if (updates.removeExperiences && Array.isArray(updates.removeExperiences)) {
        console.log('🗑️ Processing removeExperiences in patch operation');
        updates.removeExperiences.forEach((company: string) => {
          removeExperience(company);
          console.log(`🗑️ Removed experience: ${company}`);
        });
        addChatMessage(`🗑️ הסרתי ניסיון עבודה: ${updates.removeExperiences.join(', ')}`, 'ai');
        deletionsProcessed = true;
      }
      
      if (updates.deleteCompany) {
        console.log('🗑️ Processing deleteCompany in patch operation');
        removeExperience(updates.deleteCompany);
        addChatMessage(`🗑️ מחקתי את הניסיון בחברת ${updates.deleteCompany}`, 'ai');
        deletionsProcessed = true;
      }
      
      if (updates.removeSkills && Array.isArray(updates.removeSkills)) {
        console.log('🗑️ Processing removeSkills in patch operation');
        removeSkills(updates.removeSkills);
        addChatMessage(`🗑️ הסרתי כישורים: ${updates.removeSkills.join(', ')}`, 'ai');
        deletionsProcessed = true;
      }
      
      if (updates.deleteSkill) {
        console.log('🗑️ Processing deleteSkill in patch operation');
        removeSkills([updates.deleteSkill]);
        addChatMessage(`🗑️ מחקתי את הכישור: ${updates.deleteSkill}`, 'ai');
        deletionsProcessed = true;
      }
      
      // Handle experience replacement
      if (updates.replaceExperience) {
        console.log('🔄 Processing replaceExperience');
        const { company, newExperience } = updates.replaceExperience;
        // Try to preserve original position: reuse existing id if present so addOrUpdateExperience updates in-place
        const existing = currentResume.experiences.find(e => e.company?.toLowerCase().trim() === company?.toLowerCase().trim());
        const assignedId = existing?.id || newExperience.id || `${newExperience.company}-${newExperience.title}`;
        if (newExperience.company && newExperience.title) {
          const experienceToAdd = {
            id: assignedId,
            company: newExperience.company,
            title: newExperience.title,
            duration: newExperience.duration,
            description: Array.isArray(newExperience.description) 
              ? newExperience.description 
              : typeof newExperience.description === 'string' 
                ? [newExperience.description] 
                : []
          };
          addOrUpdateExperience(experienceToAdd as any);
          addChatMessage(`🔄 החלפתי את הניסיון בחברת ${company} עם ${newExperience.company}`, 'ai');
        } else {
          // If no replacement payload provided, perform a deletion
          removeExperience(company);
          addChatMessage(`🗑️ מחקתי את הניסיון בחברת ${company}`, 'ai');
        }
        deletionsProcessed = true;
      }
      
      // Log if deletions were processed
      if (deletionsProcessed) {
        console.log('🗑️ Deletions processed successfully in patch operation');
      }
      
      // Handle single experience with enhanced validation
      if (updates.experience) {
        console.log('🔍 Processing single experience:', updates.experience);
        const exp = updates.experience;
        
        // Basic validation
        const hasValidCompany = exp.company && exp.company.trim() && exp.company !== 'Company Name';
        const hasValidTitle = exp.title && exp.title.trim() && exp.title !== 'Job Title';
          
        console.log(`🔍 Experience validation: company=${hasValidCompany}, title=${hasValidTitle}`);
        
        if (hasValidCompany && hasValidTitle) {
          // Enhanced duplicate check
          if (isDuplicateContent(exp, currentResume.experiences)) {
            console.log('🔍 Skipping duplicate content for:', exp.company, exp.title);
            addChatMessage(`⚠️ לא הוספתי תיאור נוסף עבור ${exp.company} - ${exp.title} כי כבר קיים תוכן דומה.`, 'ai');
            return;
          }
          
          let descArray = Array.isArray(exp.description) 
            ? exp.description 
            : typeof exp.description === 'string' 
              ? [exp.description] 
              : [];
              
          // Filter and validate content
          descArray = filterEnglishDescriptions(descArray);
          
          // Quality check
          if (descArray.length === 0) {
            if (currentResume.experiences.some(e => 
              e.company?.toLowerCase() === exp.company?.toLowerCase() && 
              e.title?.toLowerCase() === exp.title?.toLowerCase()
            )) {
              console.log('🔍 Experience exists but no quality new content to add');
              addChatMessage(`💭 התפקיד ב${exp.company} כבר קיים במערכת עם תיאורים. לא הוספתי תוכן חדש.`, 'ai');
              return;
            } else {
              descArray = [`עבדתי כ${exp.title} בחברת ${exp.company}.`];
              console.log('🔍 Added minimal default description');
            }
          } else if (!hasQualityContent({ description: descArray })) {
            console.log('🔍 Content quality too low, enhancing...');
            descArray = [
              `כ${exp.title} בחברת ${exp.company}, ${descArray[0] || 'ביצעתי משימות מקצועיות ותרמתי להצלחת הצוות.'}`
            ];
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
          addChatMessage(`✅ הוספתי/עדכנתי ניסיון בחברת ${exp.company} עם תוכן חדש ומועיל!`, 'ai');
        } else {
          console.log('🔍 Experience validation failed - basic requirements not met');
          addChatMessage(`⚠️ לא הצלחתי להוסיף את הניסיון - חסרים פרטים בסיסיים.`, 'ai');
        }
      }
      
      // Handle experiences array with enhanced validation
      if (updates.experiences && Array.isArray(updates.experiences)) {
        console.log('🔍 Processing experiences array:', updates.experiences);
        let added = 0;
        let skipped = 0;
        
        updates.experiences.forEach((exp, index) => {
          console.log(`🔍 Processing experience ${index}:`, exp);
          
          const hasValidCompany = exp.company && exp.company.trim() && exp.company !== 'Company Name';
          const hasValidTitle = exp.title && exp.title.trim() && exp.title !== 'Job Title';
            
          if (hasValidCompany && hasValidTitle) {
            // Check for duplicates
            if (isDuplicateContent(exp, currentResume.experiences)) {
              console.log('🔍 Skipping duplicate experience:', exp.company, exp.title);
              skipped++;
              return;
            }
            
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
        
        if (added > 0 || skipped > 0) {
          addChatMessage(
            `✅ הוספתי ${added} ניסיונות עבודה חדשים${skipped > 0 ? ` ודילגתי על ${skipped} כפילויות` : ''}!`, 
            'ai'
          );
        }
      }
      
      // Handle skills with duplicate detection
      if (updates.skills && Array.isArray(updates.skills)) {
        const existingSkills = new Set(currentResume.skills.map(s => s.toLowerCase().trim()));
        const newSkills = updates.skills.filter(skill => {
          if (!skill || !skill.trim()) return false;
          return !existingSkills.has(skill.toLowerCase().trim());
        });
        
        if (newSkills.length > 0) {
          addSkills(newSkills);
          addChatMessage(`✅ הוספתי ${newSkills.length} כישורים חדשים!`, 'ai');
        } else if (updates.skills.length > 0) {
          addChatMessage(`💭 כל הכישורים שהזכרת כבר קיימים במערכת.`, 'ai');
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