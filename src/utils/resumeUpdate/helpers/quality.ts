export const hasQualityContent = (exp: any) => {
  if (!exp.description || exp.description.length === 0) return false;

  const descriptions = Array.isArray(exp.description) ? exp.description : [exp.description];
  return descriptions.some((desc: string) => {
    if (!desc || desc.trim().length < 10) return false;
    const hasActionVerb = /^(פיתחתי|ניהלתי|הובלתי|יצרתי|בניתי|תכננתי|עבדתי|אחראי|ביצעתי|השתתפתי)/.test(desc.trim());
    const hasDetails = /\d+|[A-Z][a-z]+\s*[A-Z][a-z]*|פרויקט|מערכת|אפליקציה|טכנולוגיה/.test(desc);
    return hasActionVerb || hasDetails || desc.trim().split(/\s+/).length > 8;
  });
};
