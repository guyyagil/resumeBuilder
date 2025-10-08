/**
 * Language detection and RTL support utilities
 */

// RTL language Unicode ranges
const RTL_RANGES = [
  [0x0590, 0x05FF], // Hebrew
  [0x0600, 0x06FF], // Arabic
  [0x0700, 0x074F], // Syriac
  [0x0750, 0x077F], // Arabic Supplement
  [0x0780, 0x07BF], // Thaana
  [0x07C0, 0x07FF], // N'Ko
  [0x0800, 0x083F], // Samaritan
  [0x0840, 0x085F], // Mandaic
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB1D, 0xFB4F], // Hebrew presentation forms
  [0xFB50, 0xFDFF], // Arabic presentation forms A
  [0xFE70, 0xFEFF], // Arabic presentation forms B
];

/**
 * Check if a character is RTL
 */
function isRTLChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return RTL_RANGES.some(([start, end]) => code >= start && code <= end);
}

/**
 * Detect if text contains RTL characters
 * Returns the percentage of RTL characters in the text
 */
export function detectRTLPercentage(text: string): number {
  if (!text || text.length === 0) return 0;

  // Only check actual letter characters, skip spaces and punctuation
  const letters = text.split('').filter(char => /\p{L}/u.test(char));

  if (letters.length === 0) return 0;

  const rtlCount = letters.filter(char => isRTLChar(char)).length;
  return (rtlCount / letters.length) * 100;
}

/**
 * Detect text direction from content
 * Returns 'rtl' if RTL percentage is above threshold, otherwise 'ltr'
 */
export function detectTextDirection(text: string, threshold: number = 30): 'ltr' | 'rtl' {
  const rtlPercentage = detectRTLPercentage(text);
  return rtlPercentage >= threshold ? 'rtl' : 'ltr';
}

/**
 * Detect primary language from text content
 */
export function detectLanguage(text: string): string {
  const rtlPercentage = detectRTLPercentage(text);

  // Simple heuristic-based detection
  if (rtlPercentage >= 30) {
    // Check which RTL language
    const hebrewChars = text.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code >= 0x0590 && code <= 0x05FF;
    }).length;

    const arabicChars = text.split('').filter(char => {
      const code = char.charCodeAt(0);
      return (code >= 0x0600 && code <= 0x06FF) ||
             (code >= 0x0750 && code <= 0x077F) ||
             (code >= 0x08A0 && code <= 0x08FF);
    }).length;

    if (hebrewChars > arabicChars) {
      return 'he'; // Hebrew
    } else if (arabicChars > 0) {
      return 'ar'; // Arabic
    }
    return 'rtl'; // Generic RTL
  }

  // Default to English for LTR
  return 'en';
}

/**
 * Get text alignment based on direction
 */
export function getAlignmentForDirection(direction: 'ltr' | 'rtl'): 'left' | 'right' {
  return direction === 'rtl' ? 'right' : 'left';
}
