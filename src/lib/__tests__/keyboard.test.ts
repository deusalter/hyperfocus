import { keyboardOverlap } from '../keyboard'

// an iPhone 17 Pro: 874pt tall, 34pt home indicator inset
const SCREEN = 874
const INSET = 34
const frame = (screenY: number, height = SCREEN - screenY) => ({ screenX: 0, screenY, width: 402, height })

describe('keyboardOverlap', () => {
  it('lifts the bottom of the screen clear of the keyboard, less the inset it already pads', () => {
    expect(keyboardOverlap(SCREEN, frame(538), INSET)).toBe(302)
  })

  it("doesn't depend on where a sheet starts, only on the keyboard's top", () => {
    // the same keyboard gives the same answer for any sheet, which is the point
    expect(keyboardOverlap(SCREEN, frame(538), INSET)).toBe(SCREEN - 538 - INSET)
  })

  it('is nothing once the keyboard has gone below the screen', () => {
    expect(keyboardOverlap(SCREEN, frame(SCREEN, 336), INSET)).toBe(0)
  })

  it('reads an all-zero frame as hidden, which is how Prefer Cross-Fade Transitions reports it', () => {
    expect(keyboardOverlap(SCREEN, { screenX: 0, screenY: 0, width: 0, height: 0 }, INSET)).toBe(0)
  })

  it('is never negative, even for a keyboard shorter than the inset', () => {
    expect(keyboardOverlap(SCREEN, frame(SCREEN - 20), INSET)).toBe(0)
  })
})
