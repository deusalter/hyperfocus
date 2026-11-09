import { spoken } from '../speech'

describe('spoken', () => {
  it('says points in full, since a screen reader spells out "pts"', () => {
    expect(spoken('33 pts')).toBe('33 points')
    expect(spoken('Done. +18 pts')).toBe('Done. +18 points')
    expect(spoken('1 pts so far today.')).toBe('1 point so far today.')
  })

  it('says minutes in full, since "15m" is read as fifteen metres', () => {
    expect(spoken('15m focused today')).toBe('15 minutes focused today')
    expect(spoken('1m')).toBe('1 minute')
  })

  it('pauses where the screen uses a middle dot', () => {
    expect(spoken('1 of 7 passed · 66 to typical')).toBe('1 of 7 passed, 66 to typical')
    expect(spoken('Typical day · 99')).toBe('Typical day, 99')
  })

  it('leaves clock times and ordinary words alone', () => {
    expect(spoken('until 10:05 PM')).toBe('until 10:05 PM')
    expect(spoken('Mom called')).toBe('Mom called')
    expect(spoken('room 4m2')).toBe('room 4m2')
  })
})
