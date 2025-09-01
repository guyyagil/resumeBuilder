// src/utils/resumeUpdateHandler.ts
import type { ResumeUpdates, ResumeOperation } from '../types/resume';
import { useAppStore } from '../store/useAppStore';
import { normalizeExperiences } from './resumeHelpers';

export const handleResumeUpdates = async (
  updates: ResumeUpdates, 
  addChatMessage: (message: string, type: 'ai' | 'user') => void
) => {
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
    replaceEntireResume
  } = useAppStore.getState();

  const operation: ResumeOperation = updates.operation || 'add';
  
  console.log('AI Operation:', operation, updates);
  
  switch (operation) {
    case 'reset':
      resetResume();
      addChatMessage('🔄 Resume completely reset!', 'ai');
      break;
      
    case 'redesign':
      if (updates.completeResume) {
        const normalized = {
          experiences: normalizeExperiences(updates.completeResume.experiences || []),
          skills: updates.completeResume.skills || [],
          summary: updates.completeResume.summary || ''
        };
        replaceEntireResume(normalized as any);
        addChatMessage('🎨 Complete resume redesign applied!', 'ai');
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
      
    case 'replace':
      if (updates.experiences && Array.isArray(updates.experiences)) {
        const normalized = normalizeExperiences(updates.experiences);
        replaceAllExperiences(normalized as any);
        addChatMessage('🔄 Replaced all experiences with new ones!', 'ai');
      }
      if (updates.skills && Array.isArray(updates.skills)) {
        replaceSkills(updates.skills);
        addChatMessage('🔄 Replaced all skills with new ones!', 'ai');
      }
      if (updates.summary) {
        setSummary(updates.summary);
        addChatMessage('📝 Updated professional summary!', 'ai');
      }
      break;
      
    case 'update':
    case 'add':
    default:
      if (updates.experience) {
        const exp = updates.experience;
        const hasValidCompany = exp.company && exp.company !== 'Company Name' && !exp.company.includes('Needed');
        const hasValidTitle = exp.title && exp.title !== 'Job Title' && !exp.title.includes('Needed');
        if (hasValidCompany && hasValidTitle) {
          addOrUpdateExperience({
            company: exp.company!,
            title: exp.title!,
            duration: exp.duration || '2022 - Present',
            description: exp.description && exp.description.length
              ? exp.description
              : ['Key responsibility']
          } as any);
          addChatMessage(`✅ ${operation === 'update' ? 'Updated' : 'Added'} experience at ${exp.company}!`, 'ai');
        }
      }
      if (updates.skills && Array.isArray(updates.skills)) {
        addSkills(updates.skills);
        addChatMessage(`✅ Added ${updates.skills.length} new skills!`, 'ai');
      }
      if (updates.summary) {
        setSummary(updates.summary);
        addChatMessage('📝 Updated professional summary!', 'ai');
      }
      break;
  }
};