import { readFileSync } from 'fs'
import { join } from 'path'
import { APP_GROUP, activityPayload, syncLiveActivity, syncWidget, widgetState } from '../liveActivity'
import { FocusSession } from '../session'

const NOW = 1_800_000_000_000
const MIN = 60 * 1000

const running = (overrides: Partial<FocusSession> = {}): FocusSession => ({
  taskId: 'a',
  title: 'Essay',
  cat: 'grind',
  totalSec: 1500,
  running: true,
  endsAt: NOW + 17 * MIN,
  pausedRemaining: 1500,
  ...overrides,
})

const paused = (): FocusSession => running({ running: false, endsAt: NOW - 5 * MIN, pausedRemaining: 600 })

describe('activityPayload', () => {
  it('describes a running session by when it ends', () => {
    expect(activityPayload(running(), { title: 'Essay', firstStep: 'open the doc' }, NOW)).toEqual({
      title: 'Essay',
      firstStep: 'open the doc',
      running: true,
      endsAt: NOW + 17 * MIN,
      totalSec: 1500,
      remainingSec: 17 * 60,
    })
  })

  it('describes a paused one by what is left, with no stale end time', () => {
    const payload = activityPayload(paused(), null, NOW)
    expect(payload.running).toBe(false)
    expect(payload.remainingSec).toBe(600)
    // the saved end time is in the past once paused, and must not be passed on
    expect(payload.endsAt).toBe(NOW + 600 * 1000)
  })

  it('prefers the task as it is now over the title the session started with', () => {
    expect(activityPayload(running(), { title: 'Essay, second draft' }, NOW).title).toBe('Essay, second draft')
    expect(activityPayload(running(), null, NOW).title).toBe('Essay')
    expect(activityPayload(running({ title: undefined }), null, NOW).title).toBe('One thing')
  })

  it('leaves out a first move that is only spaces', () => {
    expect(activityPayload(running(), { title: 'Essay', firstStep: '   ' }, NOW).firstStep).toBeUndefined()
  })
})

describe('widgetState', () => {
  it('offers the next task and the usual length', () => {
    expect(widgetState({ title: 'Email', firstStep: 'open the thread' }, 25, null)).toEqual({
      title: 'Email',
      firstStep: 'open the thread',
      focusLen: 25,
    })
  })

  it('has nothing to offer on an empty Today, which the widget turns into an invitation', () => {
    expect(widgetState(undefined, 15, null)).toEqual({ focusLen: 15 })
  })

  it('shows a running session, and not a paused one', () => {
    const state = widgetState({ title: 'Email' }, 25, running(), 'Essay')
    expect(state.sessionTitle).toBe('Essay')
    expect(state.sessionEndsAt).toBe(NOW + 17 * MIN)
    expect(widgetState({ title: 'Email' }, 25, paused()).sessionEndsAt).toBeUndefined()
  })
})

describe('without the native module', () => {
  it('every call does nothing, so web, Android and Expo Go are unaffected', () => {
    expect(() => syncLiveActivity(running(), { title: 'Essay' })).not.toThrow()
    expect(() => syncLiveActivity(null)).not.toThrow()
    expect(() => syncWidget(widgetState(undefined, 25, null))).not.toThrow()
  })
})

describe('the native side', () => {
  const root = join(__dirname, '..', '..', '..')
  const read = (path: string) => readFileSync(join(root, path), 'utf8')

  // ActivityKit pairs the app and the extension by this type's name and shape. They
  // are separate Swift modules, so the file exists twice, and a change to one copy
  // only would compile and then silently show nothing.
  it('keeps both copies of the Live Activity attributes identical', () => {
    expect(read('targets/widgets/FocusAttributes.swift')).toBe(
      read('modules/focus-activity/ios/FocusAttributes.swift')
    )
  })

  it('uses one App Group everywhere', () => {
    const config = JSON.parse(read('app.json'))
    expect(config.expo.ios.entitlements['com.apple.security.application-groups']).toEqual([APP_GROUP])
    expect(read('targets/widgets/WidgetState.swift')).toContain(`"${APP_GROUP}"`)
  })

  it('declares Live Activities, which iOS ignores otherwise', () => {
    const config = JSON.parse(read('app.json'))
    expect(config.expo.ios.infoPlist.NSSupportsLiveActivities).toBe(true)
  })

  it('reads the widget state under the key the app writes it to', () => {
    expect(read('modules/focus-activity/ios/FocusActivityModule.swift')).toContain('forKey: "widgetState"')
    expect(read('targets/widgets/WidgetState.swift')).toContain('forKey: "widgetState"')
  })
})
