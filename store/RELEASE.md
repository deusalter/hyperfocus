# Shipping to the App Store

In order. Each step's gate is what has to be true before moving on. None of this needs Xcode: EAS builds in the cloud.

## 1. Developer account

Apple's Developer Program License Agreement (section 3.1) requires the account holder to be of legal age where they live, which is 18 in most places. Anyone younger needs a parent or guardian to enroll and be the account holder. The fee is $99 a year.

Enroll as an **Individual** at https://developer.apple.com/programs/enroll/. The account holder's legal name appears as the seller on the App Store listing. An organization account shows a company name instead, but needs a legal entity and a D-U-N-S number.

**Gate:** you can sign in to https://appstoreconnect.apple.com.

## 2. Decide the permanent things

Two choices can't be undone after the first upload:

- **Bundle ID**, currently `com.deusalter.hyperfocus` in `app.json`. The old `com.hyperfocus.app` belongs to someone else's live app. Change it now if you'd like something else.
- **App name.** Options are in `listing.md`.

**Gate:** you're happy with both.

## 3. Connect EAS

```bash
npm install -g eas-cli
eas login        # free Expo account
eas init         # writes the project ID into app.json; commit that
```

Then add the team to `app.json`, under `expo.ios`:

```json
"appleTeamId": "XXXXXXXXXX"
```

It's the ten-character Team ID on https://developer.apple.com/account under Membership details. The app now has a second target, the widget extension that draws the Lock Screen Live Activity and the Home Screen widget, and it can't be signed without this. Until it's there, every prebuild prints a warning about it.

**Gate:** `extra.eas.projectId` and `ios.appleTeamId` are in `app.json` and committed.

## 4. First build and TestFlight

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios --latest
```

When EAS asks:
- Sign in with the Apple account from step 1 and let EAS manage credentials.
- "Set up Push Notifications?" **No.** The app only uses local notifications and never talks to a push server. The Live Activity is started and updated on the phone, with no push token.
- EAS will set up a second bundle ID, `com.deusalter.hyperfocus.widgets`, and an App Group, `group.com.deusalter.hyperfocus`, which is how the app hands the widget its data. Let it manage both.

The Expo Go in the App Store only runs the newest Expo SDK, and this project stays on SDK 54 for now, so TestFlight is how you get it on a phone.

**Gate:** the build is installed on your iPhone through TestFlight.

## 5. Test what a computer can't

Most of the app is already checked automatically: unit and store tests, every flow against the web build, and the real Release build driven on iOS 26 simulators by `gh workflow run ios-simulator.yml` (largest text size, iPhone SE, a phone set to dark, Reduce Motion). Run that workflow again after native changes. What's left needs hands and ears on a real phone.

**Timer alerts**
- [ ] Start a session, lock the phone, wait it out: "Time's up" arrives with sound
- [ ] Start a short session and leave the app open on Focus: when it runs out there's a sound as well as the recap, and no banner. With the silent switch on, no sound
- [ ] Pausing cancels the alert, and resuming brings it back at the right time
- [ ] +5 moves the alert later, and −5 moves it earlier
- [ ] Force quit mid-session and reopen: the session is still running at the right time
- [ ] Let it run out with the app closed, then reopen: the recap appears and asks if you finished

**Sound**
- [ ] Pick Brown under You: it previews, then fades
- [ ] Start a session: it fades in, and keeps going with the screen locked and in other apps
- [ ] Play music at the same time: both play, and the music doesn't stop
- [ ] It works with the silent switch on
- [ ] Leave it past 3 minutes and listen for the loop point. It should be nearly inaudible
- [ ] It sounds pleasant. Nobody has heard these yet, only measured them

**Touch and motion**
- [ ] Triage swipe feels right, a quick flick counts, and swiping the sheet down still closes it
- [ ] The buttons that show a system alert work: starting a second session, Reset everything
- [ ] Stop for now, a few minutes into a session: the recap says the minutes were saved and the task is still on Today
- [ ] Keyboard: on You, tap Connect and the field scrolls into view. Same when adding on Calendar
- [ ] Leave Focus with the back button, then check that task off on Home: one recap, no doubled points

**Accessibility** (Settings > Accessibility)
- [ ] VoiceOver: go through the main flow. Every button says what it does
- [ ] Larger Text, at the largest sizes: nothing important gets cut off
- [ ] Reduce Motion: the ring steps instead of sweeping, and there's no confetti
- [ ] Reduce Transparency: the tab bar goes solid

**Lock Screen and widget** (built on a simulator only, so this is their first real test)
- [ ] Start a session and lock the phone: the task, a moving countdown and bar, and the end time are on the Lock Screen
- [ ] On a phone with a Dynamic Island, go Home during a session: the countdown is in the island, and a long press expands it
- [ ] Pause, then lock: it says Paused and holds. Resume: it counts again, to the new end time
- [ ] +5 and −5 move the countdown and the "until" time
- [ ] Let a session run out with the phone locked: the Lock Screen changes to "Time's up" by itself, and the notification arrives
- [ ] Done, Stop for now and stopping in the first minute each take it off the Lock Screen
- [ ] Tap it: the app opens on the Focus screen
- [ ] Add the widget (long-press the Home Screen, +, Hyperfocus): it shows the task Home offers. Finish that task in the app, go Home: the widget has moved on to the next one
- [ ] With nothing on Today the widget invites a brain dump, and tapping it opens one
- [ ] Add the Lock Screen widget (long-press the Lock Screen, Customize): it shows the same task
- [ ] Turn Live Activities off for Hyperfocus in Settings: sessions still work, with nothing on the Lock Screen

**Data**
- [ ] Connect your real Canvas feed: assignments look right and land on the right days
- [ ] Reset everything clears tasks, reminders and sessions
- [ ] Optional: restore from an iCloud backup and confirm tasks come back

**Gate:** you'd hand this phone to a friend.

## 6. Fill in App Store Connect

In the new app record, paste everything from `listing.md` and upload the screenshots. Then:

- **App Privacy:** Data Not Collected. It's the first question.
- **EU:** Apple asks for a trader status declaration on every account, whether or not the app is sold in the EU. "Not a trader" is a valid answer and publishes nothing. Declaring as a trader puts the account holder's address, phone number and email on the product page, so know which you're choosing.
- **TestFlight:** add a few friends if you want real use before launch.

**Gate:** App Store Connect shows nothing missing on the version page.

## 7. Submit

Select the TestFlight build and submit for review. The review notes are in `listing.md`. Review usually takes a day or two. If it's rejected, the message cites a guideline and you can reply in App Store Connect.

**Gate:** approved.

## After launch

- **Ask for ratings** happens on its own: the app requests one once, after a good session, and only in the released app.
- **Crash reports** arrive in App Store Connect, with no third-party SDK. They only include users who opted into sharing.
- **Upgrade Expo before April 2027.** Apple announced on 9 September 2026 that from April 2027 uploads must be built with the iOS 27 SDK. This project is on SDK 54, which builds with Xcode 26: fine for the first submission, and not uploadable after that date. Updates from then on need Expo SDK 57 or later. Expo's current SDK is 58. Do it on a branch, on a real device, since a jump that size can break native modules in ways the web build won't show.
- **Next features worth building:** capture from Siri and Shortcuts through an App Intent (today a Shortcut can open `hyperfocus://dump`, which the support page explains), buttons on the "time's up" notification, and a Start button on the widget that begins a session without opening the app.
- **If the first upload is flagged for a missing microphone purpose string** (ITMS-90683): expo-audio links its recorder code even though the app never records. Set `"microphonePermission": "Hyperfocus doesn't record audio."` in the expo-audio plugin entry in `app.json` and rebuild.
- **Reviewers often use an iPad.** The app is iPhone-only (`supportsTablet: false`), which is allowed and needs no iPad screenshots, but it will be run in iPhone compatibility mode on one. Nothing has driven it there yet.

## Regenerating things

| What | How |
|---|---|
| Icon and splash | `python3 assets/_generate.py` |
| Focus sounds | `python3 assets/sounds/_generate.py` |
| Screenshots | `gh workflow run ios-simulator.yml -f groups='["store-6.9","store-6.3"]'`, then `gh run download <run id> -p 'sim-store-*' -D /tmp/store-raw` and `npm run screenshots -- --raw /tmp/store-raw`. The header of `scripts/screenshots.mjs` has the one-line step for the mid-swipe triage frame. Without `--raw` it renders the web build instead |
| Check everything | `npm run verify`, then `npm run e2e` with the web server running |
