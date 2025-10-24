// Language and text direction detection utilities

/**
 * Detect text direction based on content
 */
export function detectTextDirection(text: string): 'ltr' | 'rtl' {
  // Simple RTL detection based on common RTL characters
  const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  if (rtlChars.test(text)) {
    return 'rtl';
  }
  
  return 'ltr';
}

/**
 * Detect language based on content
 */
export function detectLanguage(text: string): string {
  // Simple language detection - can be enhanced with proper language detection library
  const arabicChars = /[\u0600-\u06FF]/;
  const hebrewChars = /[\u0590-\u05FF]/;
  const chineseChars = /[\u4e00-\u9fff]/;
  const japaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanChars = /[\uac00-\ud7af]/;
  
  if (arabicChars.test(text)) return 'ar';
  if (hebrewChars.test(text)) return 'he';
  if (chineseChars.test(text)) return 'zh';
  if (japaneseChars.test(text)) return 'ja';
  if (koreanChars.test(text)) return 'ko';
  
  // Default to English
  return 'en';
}