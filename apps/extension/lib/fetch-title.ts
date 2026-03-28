export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function fetchTitle(url: string): Promise<string> {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return domainFromUrl(url)
    }
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^::1$/,
      /^0\.0\.0\.0$/,
    ]
    if (privatePatterns.some(p => p.test(parsed.hostname))) {
      return domainFromUrl(url)
    }
  } catch {
    return url
  }

  try {
    const res = await fetch(url)
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match?.[1]?.trim() || domainFromUrl(url)
  } catch {
    return domainFromUrl(url)
  }
}
