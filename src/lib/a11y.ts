/**
 * For a control whose text stops growing before the largest sizes: a tab, a
 * segment, a day in the week strip. They're capped because their row can't get
 * taller or wider, which leaves someone on the biggest text settings reading the
 * smallest words on the screen. iOS's answer is the Large Content Viewer: press
 * and hold, and the label appears large in the middle of the display. This opts a
 * control into it. iOS only, and ignored everywhere else.
 */
export function largeContent(title: string) {
  return {
    accessibilityShowsLargeContentViewer: true,
    accessibilityLargeContentTitle: title,
  }
}
