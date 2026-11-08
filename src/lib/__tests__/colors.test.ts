import colors from '../colors.json'

/**
 * The palette against WCAG AA, in both themes. e2e measures every rendered screen;
 * this catches a bad value in seconds, before anything renders.
 */

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
/** an alpha tint flattened over a background */
const tint = (hex: string, over: string, alpha: number) =>
  '#' +
  channels(hex)
    .map((v, i) => Math.round(v * alpha + channels(over)[i] * (1 - alpha)))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')

const AA = 4.5

describe.each(['light', 'dark'] as const)('%s palette', (theme) => {
  const p = colors[theme]

  it.each([
    ['ink on the ground', p.ink, p.background],
    ['ink on a card', p.ink, p.surface],
    ['muted on the ground', p.muted, p.background],
    ['muted on a card', p.muted, p.surface],
    ['muted on a soft pill', p.ink, p.soft],
    ['accent text on the ground', p.accent, p.background],
    ['accent text on a card', p.accent, p.surface],
    ['accent text on its soft tint', p.accent, p.accentSoft],
    ['muted on the soft accent tint', p.muted, p.accentSoft],
    ['what sits on an accent fill', p.onAccent, p.accent],
    ['past-due text on the ground', p.dangerText, p.background],
    ['past-due text on a card', p.dangerText, p.surface],
    ['toast text', '#ffffff', p.toast],
    ['toast Undo', '#a9c8e8', p.toast],
  ])('%s clears AA', (_, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(AA)
  })

  it.each(Object.entries(p.cats))('the %s chip reads on its tint and when selected', (_, cat) => {
    // chips sit on cards, at a 13% tint of their own colour
    expect(ratio(cat.textColor, tint(cat.color, p.surface, 0.13))).toBeGreaterThanOrEqual(AA)
    expect(ratio(p.onAccent, cat.textColor)).toBeGreaterThanOrEqual(AA)
  })
})
