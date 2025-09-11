import { useAppStore } from '../store/useAppStore';
import type { NormalizedResumePatch } from '../types';

export const handleResumeUpdates = async (
  patch: NormalizedResumePatch,
  addChatMessage: (message: string, type: 'ai' | 'user') => void
) => {
  const store = useAppStore.getState();

  try {
    console.log('🔄 Handling comprehensive resume update:', patch);

    // Handle granular operations FIRST - these should take precedence
    if (patch.addDescriptionLine) {
      const { company, text, newText, newLine } = patch.addDescriptionLine as any;
      const textToAdd = text || newText || newLine;
      if (textToAdd && company) {
        store.addDescriptionLine(company, textToAdd);
        return; // Return early to prevent other operations from overriding
      }
    }

    if (patch.editDescriptionLine) {
      const { company, lineIndex, newText } = patch.editDescriptionLine;
      store.editDescriptionLine(company, lineIndex, newText);
      return;
    }

    if (patch.removeDescriptionLine) {
      const { company, lineIndex } = patch.removeDescriptionLine;
      store.removeDescriptionLine(company, lineIndex);
      return;
    }

    if (patch.editExperienceField) {
      const { company, field, newValue } = patch.editExperienceField;
      store.editExperienceField(company, field, newValue);
      return;
    }

    if (patch.editContactField) {
      const { field, value } = patch.editContactField;
      store.editContactField(field, value);
      return;
    }

    if (patch.editSkill) {
      const { oldSkill, newSkill } = patch.editSkill;
      store.editSkill(oldSkill, newSkill);
      return;
    }

    if (patch.editSummary) {
      const { type, text } = patch.editSummary;
      store.editSummary(type, text);
      return;
    }

    if (patch.reorganize) {
      const storeCompatibleData = {
        experiences: patch.reorganize.experiences?.map(exp => ({
          id: exp.id,
          company: exp.company || '',
          title: exp.title || '',
          duration: exp.duration,
          description: exp.description || []
        })),
        skills: patch.reorganize.skills,
        summary: patch.reorganize.summary,
        contact: patch.reorganize.contact as Partial<Pick<any, 'fullName' | 'email' | 'phone' | 'location' | 'title'>>
      };
      store.reorganizeResume(storeCompatibleData);
      return;
    }

    if (patch.clearSection) {
      store.clearSection(patch.clearSection);
      return;
    }

    // Handle cleanup operations
    if ((patch as any).cleanDuplicates) {
      store.cleanDuplicateDescriptions();
      return;
    }

    // Only apply general patch operations if no specific granular operation was handled
    const storeCompatiblePatch: any = {
      ...patch,
      operation: ['delete', 'rewrite'].includes(patch.operation) ? 'patch' : patch.operation
    };

    // Handle existing operations
    if (patch.operation === 'replace' && patch.completeResume) {
      store.applyResumeDataPatch(storeCompatiblePatch);
    } else if (patch.operation === 'reset') {
      store.resetResume();
    } else if (!['delete', 'rewrite'].includes(patch.operation)) {
      // Apply general patch only for supported operations
      store.applyResumeDataPatch(storeCompatiblePatch);
    }

    console.log('✅ Resume update completed successfully');
  } catch (error) {
    console.error('❌ Error handling resume updates:', error);
    addChatMessage('הייתה בעיה בעדכון קורות החיים', 'ai');
  }
};