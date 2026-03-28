const SAFE_SCHEMES = ['http:', 'https:', 'kura:']

export function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return SAFE_SCHEMES.includes(protocol)
  } catch {
    return false
  }
}
