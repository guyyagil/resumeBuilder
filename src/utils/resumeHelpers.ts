// src/utils/resumeHelpers.ts
import type { ExperienceInput } from '../types/resume';

export const normalizeExperiences = (items: ExperienceInput[] = []) =>
  items
    .filter(e => e.company && e.title)
    .map(e => ({
      id: e.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      company: e.company!,
      title: e.title!,
      duration: e.duration || '2022 - Present',
      description: e.description && e.description.length > 0
        ? e.description
        : ['Add measurable accomplishment or responsibility']
    }));

export const generateProfessionalSummary = (userBasicInfo: any, resumeSummary?: string) => {
  if (resumeSummary) return resumeSummary;
  
  if (userBasicInfo?.experienceYears) {
    return `Experienced ${userBasicInfo.currentRole?.toLowerCase()} with ${userBasicInfo.experienceYears} of experience${userBasicInfo.industry ? ` in ${userBasicInfo.industry}` : ''}. Ready to contribute expertise and drive results in a dynamic environment.`;
  }
  
  return `Professional ${userBasicInfo?.currentRole || 'individual'} ready to contribute expertise and drive results in a dynamic environment.`;
};

export const combineSkills = (userSkills?: string, resumeSkills: string[] = []) => {
  return [...new Set([
    ...(userSkills?.split(',').map(s => s.trim()).filter(s => s) || []),
    ...resumeSkills
  ])];
};