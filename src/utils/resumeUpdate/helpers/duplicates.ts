export const isDuplicateContent = (newExp: any, existingExperiences: any[]) => {
  if (!newExp.company || !newExp.title) return false;

  const existing = existingExperiences.find(e =>
    e.company?.toLowerCase().trim() === newExp.company?.toLowerCase().trim() &&
    e.title?.toLowerCase().trim() === newExp.title?.toLowerCase().trim()
  );

  if (!existing) return false;

  const newDescriptions = Array.isArray(newExp.description) ? newExp.description : [newExp.description].filter(Boolean);
  const existingDescriptions = existing.description || [];

  for (const newDesc of newDescriptions) {
    if (!newDesc) continue;
    for (const existingDesc of existingDescriptions) {
      if (!existingDesc) continue;
      const newWords = newDesc.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      const existingWords = existingDesc.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      const overlap = newWords.filter((w: string) => existingWords.includes(w)).length;
      const overlapRatio = overlap / Math.max(newWords.length, existingWords.length);
      if (overlapRatio > 0.4) return true;
    }
  }

  return false;
};
