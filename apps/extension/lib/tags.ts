export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
}
