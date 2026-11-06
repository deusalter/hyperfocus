import { useRouter } from 'expo-router'

/**
 * Back where you came from, or Home if there's nowhere to go back to, which
 * happens when a screen was opened cold from a deep link.
 *
 * For leaving a whole flow, use router.dismissTo('/') instead: see CLAUDE.md.
 */
export function goBackOrHome(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) router.back()
  else router.replace('/')
}
