/**
 * Converts a lower case string to a Title Case String.
 *
 * @param str the lowercase string
 * @returns a Title Case String
 */
export function toTitleCase(str: string): string {
  return str.replace(/\S+/g, str => str.charAt(0).toUpperCase() + str.substr(1).toLowerCase());
}
