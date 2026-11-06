import { Redirect } from 'expo-router'

/** Anything that doesn't resolve, like a stale deep link, just goes home. */
export default function NotFound() {
  return <Redirect href="/" />
}
