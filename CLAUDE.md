# Hyperfocus — Claude project notes

ADHD-friendly productivity app on Expo SDK 54 + React Native + NativeWind. See `README.md` for the product pitch.

## Commits
- ❌ NEVER add `Co-Authored-By` tags to commit messages — Abhinav doesn't want them.
- ✅ Match the existing prefix style (`feat:`, `fix:`, `chore:`, `pivot:`, `focus:`) and keep commits granular.

## Dev environment
- `npm install --legacy-peer-deps` — peer dep conflicts otherwise (AsyncStorage / RN combo).
- `npx expo start --ios` — boots iOS simulator with Expo Go. Needs Xcode; on a real iPhone, App Store Expo Go only runs the newest SDK, so use TestFlight.
- `npm run verify` — types, lint, unit and routing tests. `npm run e2e` drives every flow headlessly against `expo start --web --port 8099` and opens no windows. **Don't start that server with `CI=1`**: CI mode turns off Metro's file watching, so edits silently don't reach the browser.
- If a runtime `HostFunction: TypeError` appears (Fabric strict prop check), check for version drift and run `npx expo install --fix` with legacy-peer-deps enabled.
- **`ReferenceError: Property 'x' doesn't exist` while `tsc` is clean** means Metro is serving a stale incremental bundle — it happens after adding exports to a widely-imported module like `src/lib/points.ts`. Restart with `npx expo start --clear`. Don't go hunting in the source; it's the bundler.

## Gotchas worth remembering
- `PressableScale` puts `className`/`style` on the node that also carries the animated transform. Keep it that way — an inner wrapper swallows layout props and silently collapses `flex-1` button rows.
- Score by **local** day. `Completion.completedAt` is an ISO UTC stamp, so slicing its date prefix files evening sessions under tomorrow. `totalsByDay` goes through `dayKey(new Date(...))` for this reason.
- `totalsByDay` **recomputes** points from `(cat, minutes)` and ignores the stored `Completion.points`. Keep it that way — if the formula changes and history keeps old values, the pacer gets set by differently-priced days and becomes unreachable. The stored field is kept only so the recap can show the number banked at the time.
- Nothing in the UI loops. See the doctrine at the top of `src/lib/motion.ts` before adding any animation.
- **The store owns ending a session; the Focus screen only displays it.** One timer in `AppStore` aimed at `endsAt`, plus a check on resume. Don't tick it from a screen, or a session stops ending when that screen isn't mounted, and don't add a per-second tick to the store, or the whole app re-renders.
- **Only a Done tap finishes a task.** A timer reaching zero banks the minutes, keeps the task and asks on the recap. Deleting an unfinished task because 25 minutes passed is the worst failure this app can have.
- **Leave a flow with `router.dismissTo('/')`, not `replace('/')`.** Replace leaves a duplicate Home underneath that a back swipe reveals. `src/__tests__/navigation.test.tsx` shows both.
- **React to change only after `hydrated`.** Loading saved data looks like a change against the pre-load zeros. That's how every cold start used to fire level-up confetti, and how a deep link used to close itself.
- `RCTAsyncStorageExcludeFromBackup: false` in `app.json` is load-bearing. AsyncStorage excludes itself from iCloud backups by default, so without it every phone upgrade loses all of a user's data.
- Web resolves Reanimated from source (`metro.config.js`) so `className` on `Animated.View` works there like it does on native. Without that branch, button rows collapse and card fills vanish, but only in a browser.
- `PressableScale`'s accessibility lives on the outer node, because the touch overlay has no children to build a label from. Don't move it back.
- Limb angles in `Sprite` are clockwise from hanging down, so a right-hand arm reaches outward at a *negative* angle. Positive swings it behind the head, where it can't be seen.
- Import fonts per weight (`@expo-google-fonts/.../400Regular`). The package index bundles all 18 weights of each family.
- `expo prebuild` rewrites the `ios` and `android` scripts in `package.json`. If you run it to inspect the native config, restore them and delete `ios/`.
- Store materials live in `store/`, including what still needs a real device (`store/RELEASE.md`). `docs/` is published to GitHub Pages, so keep anything private out of it.
