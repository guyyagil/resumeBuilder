// src/utils/resumeHelpers.ts
// Resume helper functions for display components

export const normalizeExperiences = (items: any[] = []) =>
  items
    .filter(e => e.company && e.title)
    .map(e => ({
      id: e.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      company: e.company!,
      title: e.title!,
      // don't force a default duration here — keep undefined so store/patch logic can normalize consistently
      duration: e.duration || undefined,
      description: e.description && e.description.length > 0
        ? e.description
        : ['יש להוסיף תיאור תפקיד.']
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

// Helper function to filter English descriptions for display
export const filterEnglishDescriptionsForDisplay = (descriptions: string[]): string[] => {
  const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
  const isGenericEnglish = (text: string) => {
    const lower = text.toLowerCase().trim();
    return (
      lower.includes('add measurable accomplishment') ||
      lower.includes('add measurable') ||
      lower.includes('responsibility') ||
      lower === 'key responsibility' ||
      lower.includes('accomplishment or responsibility') ||
      lower.includes('add responsibility') ||
      // Match any short English-only text that looks like a placeholder
      (lower.match(/^[a-z\s,.'-]+$/i) && !hasHebrew(text) && text.length < 60)
    );
  };
  
  return descriptions.filter(desc => {
    const trimmed = desc.trim();
    if (!trimmed) return false;
    if (isGenericEnglish(trimmed)) {
      console.log('Hiding English description from display:', trimmed);
      return false;
    }
    // Keep Hebrew content or substantial English content
    return hasHebrew(trimmed) || (trimmed.length > 60 && !isGenericEnglish(trimmed));
  });
};

// Helper to get filtered experiences for display
export const getDisplayExperiences = (experiences: any[]): any[] => {
  return experiences.map(exp => ({
    ...exp,
    description: filterEnglishDescriptionsForDisplay(exp.description || [])
  }));
};