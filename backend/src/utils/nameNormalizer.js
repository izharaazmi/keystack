/**
 * Normalizes a name for duplicate detection by:
 * - Converting to lowercase
 * - Removing extra spaces
 * - Replacing dashes, underscores, and dots with spaces
 * - Removing special characters
 * - Trimming whitespace
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[-_.]/g, ' ')  // Replace dashes, underscores, dots with spaces
    .replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
    .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
    .trim();
}

/**
 * Checks if two names are similar enough to be considered duplicates
 */
export function areNamesSimilar(name1, name2) {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Check for very similar names (only if both have meaningful length)
  if (normalized1.length > 3 && normalized2.length > 3) {
    const words1 = normalized1.split(' ').filter(w => w.length > 1);
    const words2 = normalized2.split(' ').filter(w => w.length > 1);
    
    // If one name is significantly shorter, check if it's contained in the longer one
    if (words1.length === 1 && words2.length > 1) {
      const shortWord = words1[0];
      const longWords = words2.join(' ');
      if (longWords.includes(shortWord) && shortWord.length > 2) {
        return true;
      }
    } else if (words2.length === 1 && words1.length > 1) {
      const shortWord = words2[0];
      const longWords = words1.join(' ');
      if (longWords.includes(shortWord) && shortWord.length > 2) {
        return true;
      }
    }
    
    // Check for common abbreviations (Dev vs Development, etc.)
    const abbreviations = {
      'dev': 'development',
      'admin': 'administration',
      'mgr': 'manager',
      'mgt': 'management',
      'ops': 'operations',
      'eng': 'engineering',
      'tech': 'technology'
    };
    
    for (const [abbr, full] of Object.entries(abbreviations)) {
      if ((normalized1.includes(abbr) && normalized2.includes(full)) ||
          (normalized1.includes(full) && normalized2.includes(abbr))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Finds the most similar duplicate in a list of existing names
 * Returns the first (most similar) match, or empty array if no duplicates
 */
export function findDuplicates(newName, existingNames) {
  const normalizedNewName = normalizeName(newName);
  
  // First, check for exact matches after normalization
  for (const existingName of existingNames) {
    if (normalizeName(existingName) === normalizedNewName) {
      return [existingName];
    }
  }
  
  // Then check for similar matches (partial word matches)
  for (const existingName of existingNames) {
    if (areNamesSimilar(newName, existingName)) {
      return [existingName];
    }
  }
  
  return [];
}
