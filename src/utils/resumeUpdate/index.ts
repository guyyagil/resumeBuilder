import type { ResumeDataPatch } from '../../lib/parseResumeData';
import { useAppStore } from '../../store/useAppStore';
import { normalizeExperiences } from '../resumeHelpers';

import { filterEnglishDescriptions } from './helpers/descriptionFilter';
import { isDuplicateContent } from './helpers/duplicates';
import { hasQualityContent } from './helpers/quality';
import { isPlaceholderContact } from './helpers/contact';

import { handleRewrite } from './operations/rewrite';
import { handleDelete } from './operations/delete';
import { handlePatch } from './operations/patch';

export const handleResumeUpdates = async (
  updates: ResumeDataPatch,
  addChatMessage: (message: string, type: 'ai' | 'user') => void
) => {
  console.log('🔍 [modular] updates:', updates);

  const currentState = useAppStore.getState();
  const storeActions = {
    ...currentState,
    addOrUpdateExperience: currentState.addOrUpdateExperience,
    removeExperience: currentState.removeExperience,
    addSkills: currentState.addSkills,
    removeSkills: currentState.removeSkills,
    replaceAllExperiences: currentState.replaceAllExperiences,
    replaceEntireResume: currentState.replaceEntireResume,
    setSummary: currentState.setSummary,
    setContactInfo: currentState.setContactInfo,
    clearAllExperiences: currentState.clearAllExperiences,
    clearAllSkills: currentState.clearAllSkills,
    clearSummary: currentState.clearSummary,
    resetResume: currentState.resetResume,
    replaceSkills: currentState.replaceSkills,
  };

  const operation = updates.operation || 'patch';

  // Quick delegations: keep behavior stable and preserve in-place updates
  switch (operation) {
    case 'reset':
      storeActions.resetResume();
      addChatMessage('🔄 נקיתי את כל קורות החיים!', 'ai');
      break;

    case 'redesign':
    case 'replace':
      if (updates.completeResume) {
        const filteredExperiences = (updates.completeResume.experiences || []).map(exp => ({
          ...exp,
          duration: exp.duration || undefined,
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
        storeActions.replaceEntireResume(normalized as any);
        addChatMessage('🎨 Complete resume redesign applied!', 'ai');
      } else {
        // small replacements delegated to patch handler so we reuse its logic
        await handlePatch(updates, useAppStore.getState().resume, storeActions, addChatMessage, {
          filterEnglishDescriptions,
          isDuplicateContent,
          hasQualityContent,
          isPlaceholderContact,
        });
      }
      break;

    case 'remove':
    case 'delete':
      await handleDelete(updates, useAppStore.getState().resume, storeActions, addChatMessage);
      break;

    case 'rewrite':
      await handleRewrite(updates, useAppStore.getState().resume, storeActions, addChatMessage, {
        filterEnglishDescriptions,
      });
      break;

    case 'patch':
    case 'add':
    case 'update':
    default:
      await handlePatch(updates, useAppStore.getState().resume, storeActions, addChatMessage, {
        filterEnglishDescriptions,
        isDuplicateContent,
        hasQualityContent,
        isPlaceholderContact,
      });
      break;
  }

  console.log('🔍 [modular] final resume:', useAppStore.getState().resume);
};
  console.log('🔍 [modular] final resume:', useAppStore.getState().resume);

