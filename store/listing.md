# App Store listing

Everything App Store Connect asks for, ready to paste. Character counts are measured. Keyword popularity couldn't be checked without a paid ASO tool, so treat the keyword choices as informed guesses and revisit them once App Store Connect shows real search data.

## Name (30 max)

"Hyperfocus" on its own is taken, and so is `com.hyperfocus.app`. At least eight live apps have some form of the word in their name, so the listing needs to stand apart. The name on the home screen stays "Hyperfocus" either way.

| Option | Chars | Trade-off |
|---|---|---|
| **Hyperfocus: ADHD To-Do & Timer** (recommended) | 30 | Says what it is and carries the three search terms that matter most. Reads close to "HyperFocus - ADHD Focus Timer", which has 0 ratings. |
| Hyperfocus Rival: ADHD Tasks | 28 | Most distinct and easiest to recommend by name, but "Rival" explains nothing until you've seen the app. |
| Hyperfocus: Race Yourself | 25 | Best hook, no search terms. |

## Subtitle (30 max)

```
Race your past self, gently
```
27 characters. The name handles discovery, so this carries the idea nobody else has.

## Keywords (100 bytes max)

```
focus,brain,dump,planner,list,tasks,study,homework,executive,function,procrastination,brown,noise
```
97 bytes. Apple indexes each word once across the name, subtitle and this field, so none of these repeat. "Canvas" and "pomodoro" are deliberately left out: both are trademarks, and Guideline 2.3.7 warns against trademarked terms in keywords. The app isn't a Pomodoro timer anyway. "Brown noise" stays because it's what people search for and the app has it, though nothing in the listing claims it helps: the only studies are of white and pink noise. If you pick a different name, words it no longer covers should move here.

## Promotional text (170 max)

```
Free, with no account and no subscription. Miss a day and nothing breaks. Empty your head, start one thing with a tap, and race your recent days.
```
145 characters. Can be changed any time without a new build. It leads with the price on purpose: across 3,273 low-star reviews of 25 apps like this one, subscriptions and paywalls were the most common complaint by a wide margin, and more so in reviews that mention ADHD.

## Description

```
Most task apps punish you. Miss a day and the streak dies, the red numbers pile up, and opening the app starts to feel like bad news. Hyperfocus goes the other way. If you miss a day, nothing breaks. It's free, with no account and no subscription.

EMPTY YOUR HEAD
Type whatever's rattling around, as fast as it comes. Sort it later with a swipe: Today, Later, or let it go.

START ONE THING
Choosing is its own kind of hard, so the app picks for you. One tap starts a focus session. Don't like the pick? "Not this one" offers another. Can't face the whole thing? "Just 5 minutes" starts a short one. Stuck anyway? Name the very first move, and it's waiting on the button next time.

RACE YOUR RECENT DAYS
Your last several active days run on the track with you, and the target is a typical day for you, never your best one. You'll pass some of them on almost any day, and you watch your runner do it the moment a session ends. Points reward starting as well as minutes, so a scattered day with four small starts still adds up.

MADE FOR HOW YOUR ATTENTION WORKS
• A focus timer that shows how long is left and what time that is, and tells you when it's up, even from another app
• The countdown stays on your Lock Screen and in the Dynamic Island while you work
• A widget with the next thing on your list, so you don't have to remember to open the app
• Stop part-way and the minutes still count. The task stays on your list
• Add or take off five minutes when the plan changes
• Pink noise, brown noise and waves that mix with your own music
• One daily nudge at most, and it names the task. It skips days you've already started, and goes quiet if you've been away a week
• Undo on anything quick, so an impulsive tap costs nothing
• Gentle mode turns off every comparison
• Dark mode for late nights, or follow your phone
• No flashing or pulsing for attention, and everything respects Reduce Motion

COMING BACK IS FREE
After a gap there's no backlog on your front page and no debt to pay off. The app offers the easiest thing on your list, not the most overdue. What slipped past waits in a calm weekly review, which opens with what you got done.

SCHOOLWORK COMES TO YOU
Paste your Canvas calendar link and assignments land in Later, then join Today on the day they're due. Google and Outlook calendar links work too.

YOURS, ON YOUR PHONE
No account, no ads, no tracking, no subscription. Everything stays on your device, and you can export it and restore it.

Made by someone with ADHD. Hyperfocus is a productivity tool. It isn't medical advice and doesn't diagnose or treat any condition.
```

The closing line is true to the README, but the seller's name appears right above the description on the listing. If that's a parent's name, "Made by someone with ADHD" could read as being about them, so reword it if that matters to you.

## Screenshots

Upload in this order from `store/screenshots/`. The first three are what most people see, so they carry the idea, the action and the capture. Apple now also indexes caption text.

| # | File | Caption | Under it |
|---|---|---|---|
| 1 | `01-race` | Race your past self | Free, with no account. No streak to lose, and the target is a typical day. |
| 2 | `02-focus` | One tap to start | The app picks the task. The focus timer tells you when time is up. |
| 3 | `03-dump` | Brain dump in seconds | Get it out of your head first. Sort it later. |
| 4 | `04-triage` | Sort it with a swipe | Today, Later, or let it go. Then you only have to look at Today. |
| 5 | `05-recap` | Starting counts | Every start earns points, so a scattered day still adds up. |
| 6 | `06-calendar` | Assignments, no typing | Connect your school's calendar link and what's due shows up on its day. |
| 7 | `07-insights` | See what your week held | Quiet days are allowed. Days you showed up only ever count up. |
| 8 | `08-lock-screen` | On your Lock Screen | The countdown keeps going with the app closed, and tells you when time is up. |

- `6.3-inch` (1206 × 2622) goes in **iPhone with Dynamic Island (medium)**, the one required size.
- `6.9-inch` (1320 × 2868) goes in **iPhone with Dynamic Island (large)**.
- iPhone only, so no iPad set is needed.

These are the Release build itself, captured on iOS 26 simulators (iPhone 17 Pro Max and iPhone 17 Pro), then framed and captioned by `npm run screenshots`. The triage shot is a frame from a screen recording, taken mid-swipe. How to retake them is in `RELEASE.md`.

## Other fields

| Field | Value |
|---|---|
| Primary category | Productivity |
| Secondary category | Education |
| Price | Free, no in-app purchases |
| Age rating | Answer "None" or "No" throughout. Should come out 4+. That includes the newer questions: Social Media (required since September 2026), and Shared Location and Dating and Relationships (in the form from 16 November 2026, due by 12 January 2027). Two answers are worth knowing the reason for. Health or Wellness Topics is None: the app organises tasks and gives no self-care or lifestyle recommendations. Contests is None: the race is against your own past days, and that question is about users competing with one another. Unrestricted Web Access is No, since the in-app browser only opens this app's own help and privacy pages. |
| Support URL | https://deusalter.github.io/hyperfocus/support.html |
| Marketing URL | https://deusalter.github.io/hyperfocus/ |
| Privacy Policy URL | https://deusalter.github.io/hyperfocus/privacy.html |
| App Privacy | **Data Not Collected.** Nothing leaves the device except a calendar request the user opts into, which goes straight to that calendar's host and never to the developer. |
| Copyright | `2026` followed by the seller's name |
| Encryption | Already answered in the build (`ITSAppUsesNonExemptEncryption: false`) |

## Accessibility labels

App Store Connect lets you declare these per device. Only declare what you've confirmed on a real phone, using the checks in `RELEASE.md`:

- Sufficient Contrast: every screen and state is measured against AA in both themes
- Reduced Motion: built for it
- Larger Text: body text scales all the way. Controls whose text is capped (tabs, segments, the week strip) show in the Large Content Viewer on a long press, which is what Apple's criteria ask for in place of scaling. Check that on a phone before declaring
- VoiceOver: built for it, and checked on the simulator, but listen through it yourself before declaring
- Dark Interface: leave this one undeclared for now. Apple's criteria rule out "even temporary flashes of bright content", and the launch screen is always light, because it appears before the app can read the appearance setting. Giving the splash a dark variant would fix that for phones set to dark, at the cost of a dark splash opening onto the default light app
- Differentiate Without Color Alone: probably true, since categories carry an icon and a word as well as a colour, but nobody has audited for it
- Voice Control, Captions, Audio Descriptions: don't declare

## Notes for App Review

```
Hyperfocus has no login and needs no account. All data stays on the device.

To try the main flow:
1. The welcome's last step asks for one task and offers to start five minutes on it. That works as a first look at a focus session, or tap Skip to go straight to Home.
2. Tap the + button (or "Start a brain dump" on an empty Home), type a few things, then tap Sort.
3. Swipe a card right for Today and left for Later, or use the buttons.
4. On Home, tap "Start one thing" to begin a focus session. Done finishes the task. "Stop for now" keeps the minutes and the task. Letting the timer run out keeps the task and asks whether you finished.

Lock Screen and widget: a running session appears as a Live Activity on the Lock Screen and in the Dynamic Island. It's started and updated on the device, with no push token and no server. The Home Screen and Lock Screen widget ("Start one thing") shows the next task. The app shares that with its widget extension through an App Group, which is the only reason for that entitlement. Nothing leaves the phone.

Notifications are local only and aren't required. The app asks the first time you start a session, then schedules a "time's up" alert on the device. A daily reminder is opt-in under You > Reminders. There's no push server.

Background audio: focus sounds are optional. Under You > Focus sound, pick Brown noise and start a session. The sound keeps playing with the screen locked or in another app, which is the reason for the audio background mode. It stops when the session pauses or ends.

Calendar import is optional and isn't needed for anything else. Under You > Import > Connect, paste a calendar feed link. Students use their Canvas link. This public feed works for testing and brings in upcoming holidays:
https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics

Points and levels are a personal motivation mechanic with no monetary value. Nothing is sold.

The app is a productivity tool. It makes no medical claims and doesn't diagnose or treat any condition.
```

## What's New (for later updates)

Not needed for the first version. Keep these specific, for example: "A session that runs out now asks if you finished."
