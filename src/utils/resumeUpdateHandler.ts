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
      console.log('🔄 Processing reorganize operation:', patch.reorganize);
      const currentData = store.resume;
      if (!currentData) {
        console.error('❌ No current resume data to reorganize');
        return;
      }
      // Handle experience reorganization
      if (patch.reorganize.experiences && Array.isArray(patch.reorganize.experiences)) {
        const currentExperiences = currentData.experiences || [];
        const newOrder = patch.reorganize.experiences;
        // Check if we have strings (company names) or Experience objects
        const isStringArray = newOrder.length > 0 && typeof (newOrder as any[])[0] === 'string';
        if (isStringArray) {
          // Handle string array (company names)
          const reorderedExperiences = [];
          
          for (const companyName of newOrder as string[]) {
            const experience = currentExperiences.find((exp: any) => 
              exp.company === companyName || 
              exp.company.includes(companyName) ||
              companyName.includes(exp.company)
            );
            if (experience) {
              reorderedExperiences.push(experience);
            }
          }
          
          // Add any experiences not found in the new order at the end
          const addedCompanies = reorderedExperiences.map((exp: any) => exp.company);
          const remainingExperiences = currentExperiences.filter((exp: any) => 
            !addedCompanies.includes(exp.company)
          );
          
          const finalExperiences = [...reorderedExperiences, ...remainingExperiences];
          
          // Update store with reordered experiences
          const updatedData = {
            ...currentData,
            experiences: finalExperiences
          };
          
          store.replaceEntireResume(updatedData);
          console.log('✅ Experiences reordered successfully');
        } else {
          // Handle Experience objects - use existing store method with a properly typed payload
          const dataForStore: Parameters<typeof store.reorganizeResume>[0] = {
            experiences: patch.reorganize.experiences as any,
            skills: patch.reorganize.skills,
            summary: patch.reorganize.summary,
            contact: patch.reorganize.contact as any
          };
          store.reorganizeResume(dataForStore);
        }
      }
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