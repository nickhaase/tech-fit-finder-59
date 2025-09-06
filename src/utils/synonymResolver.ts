/**
 * Enhanced synonym resolution utility for mapping user inputs to canonical system IDs
 */

/**
 * Resolves input strings to canonical IDs using the provided synonym map
 * @param input - Raw user input or system name
 * @param synonymMap - Mapping of synonyms to canonical IDs
 * @returns Canonical ID if found in synonym map, otherwise returns original input
 */
export function resolveId(input: string, synonymMap: Record<string, string>): string {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  // Normalize the input for matching
  const normalizedInput = input.trim().toLowerCase();
  
  // Direct lookup in synonym map
  const resolved = synonymMap[normalizedInput];
  if (resolved) {
    console.log(`[synonymResolver] Resolved "${input}" → "${resolved}"`);
    return resolved;
  }
  
  // Return original input if no mapping found
  return input;
}

/**
 * Batch resolve multiple inputs using the same synonym map
 * @param inputs - Array of input strings to resolve
 * @param synonymMap - Mapping of synonyms to canonical IDs
 * @returns Array of resolved IDs
 */
export function resolveIds(inputs: string[], synonymMap: Record<string, string>): string[] {
  return inputs.map(input => resolveId(input, synonymMap));
}

/**
 * Creates a reverse lookup map (ID → synonyms) for debugging and validation
 * @param synonymMap - Original synonym map
 * @returns Reverse mapping of canonical IDs to their synonym lists
 */
export function createReverseSynonymMap(synonymMap: Record<string, string>): Record<string, string[]> {
  const reverseMap: Record<string, string[]> = {};
  
  Object.entries(synonymMap).forEach(([synonym, canonicalId]) => {
    if (!reverseMap[canonicalId]) {
      reverseMap[canonicalId] = [];
    }
    reverseMap[canonicalId].push(synonym);
  });
  
  return reverseMap;
}

/**
 * Enhanced resolution with fallback patterns for common variations
 * @param input - Raw input string
 * @param synonymMap - Primary synonym map
 * @param fallbackPatterns - Optional fallback patterns for fuzzy matching
 * @returns Resolved ID with confidence score
 */
export function resolveWithFallback(
  input: string, 
  synonymMap: Record<string, string>,
  fallbackPatterns?: Record<string, RegExp>
): { id: string; confidence: 'exact' | 'pattern' | 'none' } {
  // Try exact match first
  const exactMatch = resolveId(input, synonymMap);
  if (exactMatch !== input) {
    return { id: exactMatch, confidence: 'exact' };
  }
  
  // Try fallback patterns if provided
  if (fallbackPatterns) {
    const normalizedInput = input.toLowerCase();
    
    for (const [canonicalId, pattern] of Object.entries(fallbackPatterns)) {
      if (pattern.test(normalizedInput)) {
        console.log(`[synonymResolver] Pattern match: "${input}" → "${canonicalId}"`);
        return { id: canonicalId, confidence: 'pattern' };
      }
    }
  }
  
  return { id: input, confidence: 'none' };
}

/**
 * Common fallback patterns for industrial systems
 */
export const COMMON_FALLBACK_PATTERNS: Record<string, RegExp> = {
  'palantir_foundry': /foundry|palantir/i,
  'aveva_pi': /pi\s*(system|server)?|osisoft/i,
  'ignition': /ignition|inductive/i,
  'wonderware': /wonderware|aveva.*system/i,
  'schneider': /schneider|aveva.*plant/i,
  'rockwell': /rockwell|factorytalk|rslogix/i,
  'siemens': /siemens|step\s*7|tia/i,
  'honeywell': /honeywell|experion|dcs/i,
  'emerson': /emerson|deltav/i,
  'yokogawa': /yokogawa|centum/i,
};

/**
 * Resolve system names with enhanced industrial system pattern matching
 * @param input - System name from assessment
 * @param synonymMap - Configuration synonym map
 * @returns Resolved system ID
 */
export function resolveSystemId(input: string, synonymMap: Record<string, string>): string {
  const result = resolveWithFallback(input, synonymMap, COMMON_FALLBACK_PATTERNS);
  return result.id;
}