import { useAppStore } from '../store/useAppStore';
import type { NormalizedResumePatch } from '../types';

export const applyResumePatch = (patch: NormalizedResumePatch) => {
  const {
    addOrUpdateExperience,
    addSkills,
    removeSkills,
    replaceEntireResume,
    resetResume,
    removeExperience,
    clearAllExperiences,
    clearAllSkills,
    setSummary,
    clearSummary,
    setContactInfo
  } = useAppStore.getState();

  console.log('Applying resume patch:', patch);

  if (patch.operation === 'reset') {
    resetResume();
    return;
  }

  if (patch.operation === 'replace') {
    if (patch.completeResume) {
      // Convert CompleteResume to Resume format
      const resumeData = {
        experiences: patch.completeResume.experiences?.map(exp => ({
          id: exp.id,
          company: exp.company || '',
          title: exp.title || '',
          duration: exp.duration,
          description: exp.description || []
        })) || [],
        skills: patch.completeResume.skills || [],
        summary: patch.completeResume.summary || '',
        fullName: patch.completeResume.contact?.fullName,
        email: patch.completeResume.contact?.email,
        phone: patch.completeResume.contact?.phone,
        location: patch.completeResume.contact?.location,
        title: patch.completeResume.contact?.title
      };
      replaceEntireResume(resumeData);
      return;
    } else {
      // no completeResume provided — treat as reset/replace fallback
      replaceEntireResume({ experiences: [], skills: [], summary: '' });
      return;
    }
  }

  if (patch.clearSections?.includes('experiences')) clearAllExperiences();
  if (patch.clearSections?.includes('skills')) clearAllSkills();
  if (patch.clearSections?.includes('summary')) clearSummary();

  // Normalize any experience sources: single experience, experiences array, or completeResume.experiences
  const experienceCandidates: any[] = [];
  if ((patch as any).experiences && Array.isArray((patch as any).experiences)) {
    experienceCandidates.push(...(patch as any).experiences);
  }
  if (patch.experience && typeof patch.experience === 'object') {
    experienceCandidates.push(patch.experience);
  }
  if (patch.completeResume && Array.isArray(patch.completeResume.experiences)) {
    experienceCandidates.push(...patch.completeResume.experiences);
  }

  // Apply each experience item
  for (const e of experienceCandidates) {
    if (!e || !e.company) continue;
    addOrUpdateExperience({
      id: e.id,
      company: e.company || '',
      title: e.title || '',
      duration: e.duration || '',
      description: Array.isArray(e.description) ? e.description : (typeof e.description === 'string' ? [e.description] : [])
    });
  }

  patch.removeExperiences?.forEach(key => removeExperience(key));

  if (patch.skills && patch.skills.length) {
    console.log('Adding skills from patch:', patch.skills);
    addSkills(patch.skills);
  }
  if (patch.removeSkills && patch.removeSkills.length) removeSkills(patch.removeSkills);

  // Summary: prefer patch.summary, otherwise completeResume.summary
  const summarySource = (typeof patch.summary === 'string' && patch.summary.trim())
    ? patch.summary.trim()
    : (patch.completeResume && typeof patch.completeResume.summary === 'string' ? patch.completeResume.summary.trim() : '');

  if (summarySource) {
    setSummary(summarySource);
  }

  if (patch.contact) {
    setContactInfo(patch.contact);
  }
};