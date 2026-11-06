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

**Gate:** `extra.eas.projectId` is in `app.json` and committed.

## 4. First build and TestFlight

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios --latest
```

When EAS asks:
- Sign in with the Apple account from step 1 and let EAS manage credentials.
- "Set up Push Notifications?" **No.** The app only uses local notifications and never talks to a push server.

The Expo Go in the App Store only runs the newest Expo SDK, and this project stays on SDK 54 for now, so TestFlight is how you get it on a phone.

**Gate:** the build is installed on your iPhone through TestFlight.

## 5. Test what a computer can't

Everything in the app has been checked by automated tests against the web build, but these need a real phone.

**Timer alerts**
- [ ] Start a session, lock the phone, wait it out: "Time's up" arrives with sound
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
- [ ] The buttons that show a system alert work: Stop without saving after a minute, starting a second session, Reset everything
- [ ] Keyboard: on You, tap Connect and the field scrolls into view. Same when adding on Calendar
- [ ] Leave Focus with the back button, then check that task off on Home: one recap, no doubled points

**Accessibility** (Settings > Accessibility)
- [ ] VoiceOver: go through the main flow. Every button says what it does
- [ ] Larger Text, at the largest sizes: nothing important gets cut off
- [ ] Reduce Motion: the ring steps instead of sweeping, and there's no confetti
- [ ] Reduce Transparency: the tab bar goes solid

**Data**
- [ ] Connect your real Canvas feed: assignments look right and land on the right days
- [ ] Reset everything clears tasks, reminders and sessions
- [ ] Optional: restore from an iCloud backup and confirm tasks come back

**Gate:** you'd hand this phone to a friend.

## 6. Fill in App Store Connect

In the new app record, paste everything from `listing.md` and upload the screenshots. Then:

- **App Privacy:** Data Not Collected. It's the first question.
- **EU:** Apple requires a trader status declaration to sell in the EU. Either complete it, or leave EU storefronts off under Pricing and Availability for now.
- **TestFlight:** add a few friends if you want real use before launch.

**Gate:** App Store Connect shows nothing missing on the version page.

## 7. Submit

Select the TestFlight build and submit for review. The review notes are in `listing.md`. Review usually takes a day or two. If it's rejected, the message cites a guideline and you can reply in App Store Connect.

**Gate:** approved.

## After launch

- **Ask for ratings** happens on its own: the app requests one once, after a good session, and only in the released app.
- **Crash reports** arrive in App Store Connect, with no third-party SDK. They only include users who opted into sharing.
- **Upgrade Expo** before Apple's next SDK deadline. This project is on SDK 54, which builds with Xcode 26 and satisfies today's rule. Apple has been raising the minimum every April, and Xcode 27 is out, so plan on April 2027. Expo's current SDK is 58. Do it on a branch, on a real device, since a jump that size can break native modules in ways the web build won't show.
- **Next features worth building:** Lock Screen Live Activity for the timer, and an import to go with the export.

## Regenerating things

| What | How |
|---|---|
| Icon and splash | `python3 assets/_generate.py` |
| Focus sounds | `python3 assets/sounds/_generate.py` |
| Screenshots | `npx expo start --web --port 8099`, then `npm run screenshots` |
| Check everything | `npm run verify`, then `npm run e2e` with the web server running |
