import { Text } from 'react-native'
import { Stack, Tabs, router } from 'expo-router'
import { act, renderRouter, screen } from 'expo-router/testing-library'

/**
 * Leaving the focus flow has to leave a clean stack. A stray copy of the tabs
 * underneath means swiping back from Home lands on a second, stale Home.
 * The app uses dismissTo('/') for this; these pin down why.
 */
const routes = {
  _layout: () => <Stack />,
  '(tabs)/_layout': () => <Tabs />,
  '(tabs)/index': () => <Text>home</Text>,
  '(tabs)/you': () => <Text>you</Text>,
  focus: () => <Text>focus</Text>,
  recap: () => <Text>recap</Text>,
  onboarding: () => <Text>onboarding</Text>,
}

// expo-router adds this at runtime, but its types don't reach the Screen it exports
const pathname = () => (screen as unknown as { getPathname(): string }).getPathname()

describe('leaving a flow', () => {
  it('focus → recap → home leaves nothing to swipe back to', () => {
    renderRouter(routes, { initialUrl: '/' })
    act(() => router.push('/focus'))
    act(() => router.replace('/recap'))
    expect(pathname()).toBe('/recap')
    act(() => router.dismissTo('/'))
    expect(pathname()).toBe('/')
    expect(router.canGoBack()).toBe(false)
  })

  it('returns to Home even if the session began from another tab', () => {
    renderRouter(routes, { initialUrl: '/you' })
    expect(pathname()).toBe('/you')
    act(() => router.push('/focus'))
    act(() => router.replace('/recap'))
    act(() => router.dismissTo('/'))
    expect(pathname()).toBe('/')
    expect(router.canGoBack()).toBe(false)
  })

  it('first run: onboarding replaced the root, and finishing still lands on Home', () => {
    renderRouter(routes, { initialUrl: '/' })
    act(() => router.replace('/onboarding'))
    expect(pathname()).toBe('/onboarding')
    act(() => router.dismissTo('/'))
    expect(pathname()).toBe('/')
    expect(router.canGoBack()).toBe(false)
  })

  it('replaying the welcome from settings does not stack a second Home', () => {
    renderRouter(routes, { initialUrl: '/you' })
    act(() => router.push('/onboarding'))
    act(() => router.dismissTo('/'))
    expect(pathname()).toBe('/')
    expect(router.canGoBack()).toBe(false)
  })

  it('a plain replace would have left a duplicate behind', () => {
    renderRouter(routes, { initialUrl: '/' })
    act(() => router.push('/recap'))
    act(() => router.replace('/'))
    expect(pathname()).toBe('/')
    expect(router.canGoBack()).toBe(true)
  })
})
