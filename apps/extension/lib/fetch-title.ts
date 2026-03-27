export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function fetchTitle(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match?.[1]?.trim() || domainFromUrl(url)
  } catch {
    return domainFromUrl(url)
  }
}
