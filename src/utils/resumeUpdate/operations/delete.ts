import type { ResumeDataPatch } from '../../../lib/parseResumeData';

export const handleDelete = async (
  updates: ResumeDataPatch,
  currentResume: any,
  storeActions: any,
  addChatMessage: (m: string, t: 'ai' | 'user') => void
) => {
  const deletedItems: string[] = [];

  if (updates.removeDescriptionFromExperience) {
    const { company, descriptionToRemove } = updates.removeDescriptionFromExperience;
    const experience = currentResume.experiences.find((e: any) =>
      e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
    );
    if (experience && experience.description) {
      const filtered = experience.description.filter((desc: string) =>
        !desc.toLowerCase().includes(descriptionToRemove.toLowerCase())
      );
      if (filtered.length !== experience.description.length) {
        storeActions.addOrUpdateExperience({ ...experience, description: filtered });
        deletedItems.push(`תיאור "${descriptionToRemove}" מחברת ${company}`);
      }
    }
  }

  if (updates.removeDescriptionsFromExperience) {
    const { company, descriptionsToRemove } = updates.removeDescriptionsFromExperience;
    const experience = currentResume.experiences.find((e: any) =>
      e.company?.toLowerCase().trim() === company?.toLowerCase().trim()
    );
    if (experience && experience.description) {
      let filtered = [...experience.description];
      descriptionsToRemove.forEach((d) => {
        filtered = filtered.filter((desc: string) => !desc.toLowerCase().includes(d.toLowerCase()));
      });
      if (filtered.length !== experience.description.length) {
        storeActions.addOrUpdateExperience({ ...experience, description: filtered });
        deletedItems.push(`${descriptionsToRemove.length} תיאורים מחברת ${company}`);
      }
    }
  }

  if (updates.removeExperiences && Array.isArray(updates.removeExperiences)) {
    updates.removeExperiences.forEach((company: string) => {
      const before = currentResume.experiences.length;
      storeActions.removeExperience(company);
      const after = storeActions.resume?.experiences?.length ?? 0;
      if (after < before) deletedItems.push(`ניסיון בחברת ${company}`);
    });
  }

  if (updates.deleteCompany) {
    const before = currentResume.experiences.length;
    storeActions.removeExperience(updates.deleteCompany);
    const after = storeActions.resume.experiences.length;
    if (after < before) deletedItems.push(`ניסיון בחברת ${updates.deleteCompany}`);
  }

  if (updates.deleteExperienceById) {
    const before = currentResume.experiences.length;
    storeActions.removeExperience(updates.deleteExperienceById);
    const after = storeActions.resume.experiences.length;
    if (after < before) deletedItems.push(`ניסיון עבודה`);
  }

  if (updates.removeSkills && Array.isArray(updates.removeSkills)) {
    const beforeSkills = new Set(currentResume.skills);
    storeActions.removeSkills(updates.removeSkills);
    const afterSkills = new Set(storeActions.resume.skills);
    updates.removeSkills.forEach((skill) => {
      if (beforeSkills.has(skill) && !afterSkills.has(skill)) deletedItems.push(`כישור: ${skill}`);
    });
  }

  if (updates.deleteSkill) {
    const beforeSkills = new Set(currentResume.skills);
    storeActions.removeSkills([updates.deleteSkill]);
    const afterSkills = new Set(storeActions.resume.skills);
    if (beforeSkills.has(updates.deleteSkill) && !afterSkills.has(updates.deleteSkill)) {
      deletedItems.push(`כישור: ${updates.deleteSkill}`);
    }
  }

  if (deletedItems.length > 0) {
    addChatMessage(`🗑️ מחקתי בהצלחה: ${deletedItems.join(', ')}`, 'ai');
  } else {
    addChatMessage(`⚠️ לא מצאתי פריטים למחיקה או שהם כבר לא קיימים`, 'ai');
  }
};
