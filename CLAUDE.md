# Hyperfocus — Claude project notes

ADHD-friendly productivity app on Expo SDK 54 + React Native + NativeWind. See `README.md` for the product pitch.

## Commits
- ❌ NEVER add `Co-Authored-By` tags to commit messages — Abhinav doesn't want them.
- ✅ Match the existing prefix style (`feat:`, `fix:`, `chore:`, `pivot:`, `focus:`) and keep commits granular.

## Dev environment
- `npm install --legacy-peer-deps` — peer dep conflicts otherwise (AsyncStorage / RN combo).
- `npx expo start --ios` — boots iOS simulator with Expo Go.
- If a runtime `HostFunction: TypeError` appears (Fabric strict prop check), check for version drift and run `npx expo install --fix` with legacy-peer-deps enabled.
- **`ReferenceError: Property 'x' doesn't exist` while `tsc` is clean** means Metro is serving a stale incremental bundle — it happens after adding exports to a widely-imported module like `src/lib/points.ts`. Restart with `npx expo start --clear`. Don't go hunting in the source; it's the bundler.

## Gotchas worth remembering
- `PressableScale` puts `className`/`style` on the node that also carries the animated transform. Keep it that way — an inner wrapper swallows layout props and silently collapses `flex-1` button rows.
- Score by **local** day. `Completion.completedAt` is an ISO UTC stamp, so slicing its date prefix files evening sessions under tomorrow. `totalsByDay` goes through `dayKey(new Date(...))` for this reason.
- Nothing in the UI loops. See the doctrine at the top of `src/lib/motion.ts` before adding any animation.
