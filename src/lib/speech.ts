/**
 * On-screen shorthand rewritten for a screen reader. VoiceOver spells out "pts",
 * reads "15m" as fifteen metres, and may announce a middle dot as "dot", so labels
 * built from what the screen shows go through here first.
 */
export function spoken(text: string): string {
  return text
    .replace(/\s·\s/g, ', ')
    .replace(/\b(\d+) pts\b/g, (_, n) => `${n} ${n === '1' ? 'point' : 'points'}`)
    .replace(/\b(\d+)m\b/g, (_, n) => `${n} ${n === '1' ? 'minute' : 'minutes'}`)
}

/** Ends with a full stop unless it already ends a sentence. */
export function sentence(text: string): string {
  const t = text.trim()
  return /[.!?…]$/.test(t) ? t : `${t}.`
}
