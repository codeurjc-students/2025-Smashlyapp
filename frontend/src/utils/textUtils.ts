/**
 * Text utility functions
 */

/**
 * Converts a string to title case (first letter of each word capitalized)
 * @param str - The string to convert
 * @returns The string in title case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
