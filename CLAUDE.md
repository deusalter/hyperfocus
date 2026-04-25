# Hyperfocus — Claude project notes

ADHD-friendly productivity app on Expo SDK 54 + React Native + NativeWind. See `README.md` for the product pitch.

## Commits
- ❌ NEVER add `Co-Authored-By` tags to commit messages — Abhinav doesn't want them.
- ✅ Match the existing prefix style (`feat:`, `fix:`, `chore:`, `pivot:`, `focus:`) and keep commits granular.

## Dev environment
- `npm install --legacy-peer-deps` — peer dep conflicts otherwise (AsyncStorage / RN combo).
- `npx expo start --ios` — boots iOS simulator with Expo Go.
- If a runtime `HostFunction: TypeError` appears (Fabric strict prop check), check for version drift and run `npx expo install --fix` with legacy-peer-deps enabled.
