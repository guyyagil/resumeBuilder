export const filterEnglishDescriptions = (descriptions: string[]): string[] => {
  const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
  const WORD_COUNT = (t: string) => (t.trim().split(/\s+/).filter(Boolean).length);
  const TECH_TOKEN = /^[A-Za-z0-9+.#-]{2,30}$/;

  const looksLikeTechList = (text: string) => {
    const tokens = text.split(/[,/|•;]+|\s{2,}/).map(t => t.trim()).filter(Boolean);
    if (tokens.length < 3) return false;
    const techCount = tokens.filter(t => TECH_TOKEN.test(t.replace(/\.$/, '')) && t.length <= 30).length;
    return techCount >= Math.ceil(tokens.length * 0.7);
  };

  const looksLikeGenericPlaceholder = (text: string) => {
    const lower = text.toLowerCase().trim();
    return (
      lower.includes('add measurable accomplishment') ||
      lower.includes('key responsibility') ||
      lower.includes('accomplishment or responsibility') ||
      lower === 'responsibility' ||
      lower === 'accomplishment'
    );
  };

  const looksLikeSentence = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (hasHebrew(trimmed)) return true;
    if (/[.!?]$/.test(trimmed)) return true;
    if (WORD_COUNT(trimmed) >= 4) return true;
    if (/\b(develop|developed|build|built|manage|managed|lead|led|implement|implemented|design|designed|maintain|maintained|support|supported|responsible|worked|created|achieved)\b/i.test(trimmed)) return true;
    return false;
  };

  const results: string[] = [];
  for (const raw of descriptions || []) {
    const d = (raw || '').toString().trim();
    if (!d) continue;
    if (looksLikeGenericPlaceholder(d)) continue;
    if (looksLikeTechList(d)) continue;
    if (looksLikeSentence(d) || (hasHebrew(d) && d.length > 3)) results.push(d);
  }

  return [...new Set(results.map(s => s.trim()))];
};
