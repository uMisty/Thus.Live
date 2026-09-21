/** Display content dates and archive periods without timezone conversion. */
export function formatDate(value: string): string {
  return value.replace(/[-/]/g, '.')
}
