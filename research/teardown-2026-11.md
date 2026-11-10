# Teardown, November 2026

A full pass over the app's UI and UX before it goes to the App Store: every screen and state walked and screenshotted, the source read, and three pieces of research commissioned to check the design against. This is what was found, what changed because of it, and what didn't.

## What it was checked against

- **The science** ([`sources-science.md`](sources-science.md), 73 sources). What is actually measured about ADHD that bears on a to-do and timer app, with the strength of each claim marked.
- **The market** ([`sources-market.md`](sources-market.md)). 13,237 App Store reviews across 25 competing apps, of which 3,273 are one to three stars, plus Reddit and Hacker News threads on why people quit these apps.
- **The App Store's own rules** as they stand this month, against `store/` and `app.json`.

Two things about the science are worth saying before anything else. The underlying differences are well measured: timing (g ≈ 0.69), steeper discounting of delayed reward (d ≈ 0.43), emotion dysregulation in adults (g ≈ 1.17). But **no trial of a to-do or timer app for ADHD exists**, in adults or teenagers. Almost every ADHD-specific experiment is on children in a lab. So "evidence-based" here means "follows what's measured about the condition", and never "this feature is shown to work".

## What was wrong, in order of how much it mattered

### 1. A session had no honest way to end early

Focus offered Pause, Done, and Stop without saving. Done takes the task off the list. Stop without saving threw the minutes away, behind a confirm. Nothing covered the most ordinary ending there is: fifteen minutes in, something comes up, the task isn't finished.

The only ways to keep those minutes were to mark an unfinished task done, or to sit and wait for the clock. The app's own README says starting is the thing being rewarded, and this punished exactly that. The market report found the same complaint in a competitor's reviews ("ending early earns zero").

**Changed:** Stop for now keeps the minutes and the task. The recap says so, and offers Don't count this session as the way back, for the time the clock was left running on an empty desk. That replaces the confirm, which was also the one place the app broke its own rule that undo beats "are you sure?".

### 2. The race paid out where nobody could see it

Home stays mounted underneath the Focus screen and the recap. Points are earned on those screens, so the runner made its move behind them and was standing still in its new place by the time anyone came back. The recap itself, the moment of reward, had a cheering sprite and two numbers. The race wasn't on it.

Steeper delay discounting is the best-supported finding in the whole literature review, and it says reward works when it's immediate and visible.

**Changed:** the recap now shows the lane. The runner starts where it stood before the session, runs to where it stands now, past whichever recent days that covers, then cheers. On Home the runner waits until Home is in front before it moves.

**Also changed:** the recap used to follow a win with the shortfall ("3 days passed. 18 pts to typical."). It now only says what was gained. The distance to go lives on Home, where it's a plan.

### 3. Coming back opened on a debt

The return screen is the one the code itself calls the highest-stakes in the app. After five days away it showed, in order: the race card reading "0 pts today" against "a typical day is 65 pts", then the welcome, then two buttons that both started a task. The task they started was whatever ranked first in the usual order, which leads with what's overdue and urgent. So "Start with one small thing" started the most dreaded thing on the list.

**Changed:** the welcome comes first, one Start card follows it, and the race sits below with no number on it until something's been done. The task offered on a return is the cheapest to begin: quick ones first, anything with its first move written down ahead of anything without, overdue last.

### 4. The first run ended on a settings form

Three screens, the last asking for a name, a session length and a mode, then an empty Home. Median 30-day retention for apps in this space is about 3%, and ADHD programmes lose most people early. Whatever the app is for has to happen in the first sitting. The README's own line is "nothing to configure before it's useful".

**Changed:** the last step asks for one thing you've been putting off and starts five minutes on it. The first points arrive in the first sitting. Leaving it empty goes straight to Home. Gentle mode moved to step two, beside the sentence about the race that it answers. Name and session length stay under You.

### 5. The timer could end without anyone noticing

With the app open, the end of a session was one haptic and a screen change. The notification's banner was suppressed on purpose, and its sound went with it. A session mostly ends with the phone on the desk and eyes somewhere else.

**Changed:** the end of a session keeps its sound in the foreground, at whatever the ringer allows. Not yet heard on a device.

### 6. Reminders handed the remembering back

"One small thing?" asks someone whose difficulty is remembering the thing to remember the thing. Adults with ADHD carry out fewer of their own intentions, and the one ADHD trial of reminders found they bring people back sooner without making them act.

**Changed:** the next nudge names the task Home would offer, and its first move if there is one. A running session now counts as having started today, so a nudge to begin can't arrive in the middle of one.

### 7. Small things that said the opposite of the words next to them

- The overdue banner read "That's okay" beside a red warning triangle. Now a plain calendar mark.
- Later carried a count, and the banner counted what slipped. A number beside a list of unfinished things is a reason to leave it closed. Both gone.
- The debrief had a filled button on every overdue row, and one heading in capitals.
- Insights ended on "Consistency beats intensity, so keep the small days coming", which is coaching on a screen that promises not to grade.
- The task editor had "When" and "Which list", which both read as when. Now "Due" and "Do it".
- On Focus, the points line changed every minute in the category's colour, the brightest thing on a screen meant to hold only the task. Now grey.
- Brown noise led the sound choices. It's the one people ask for, and the one with no study behind it. Pink leads now.

### 8. An export with no way back in

Export my data produced text and nothing could read it. **Changed:** Restore from an export takes the same text pasted back. It only ever adds, so it can't cost anything and doing it twice is harmless.

## Shipped and not shipped

| From the research | Shipped | Why, or why not |
|---|---|---|
| Reward at the moment of the act | Yes | The lane on the recap, and the runner waiting for Home |
| First session inside onboarding | Yes | Five minutes on a task typed in the welcome |
| Reminders name the task | Partly | The nudge names it. A "Start" button on the notification needs native notification categories, untestable here |
| Nothing salient on Focus | Yes | Points line greyed. There was never a companion there |
| Sounds: reorder, claim nothing | Yes | Pink first. No copy anywhere says a sound helps |
| No backlog counts | Partly | Later and the banner. The debrief still counts, since that's the screen for looking |
| Send nothing during a session | Yes | The nudge holds back. Offering an iOS Focus isn't possible from an app without a Shortcut |
| End clock time beside the countdown | Yes | "left, until 8:51 PM" |
| "Free, no account" up front | Yes | Welcome screen, promo text, first screenshot caption |
| Import to match the export | Yes | Paste-based, so no new native code |
| Partial sessions get credit | Yes | Stop for now |
| Larger Text for capped controls | Yes | Large Content Viewer on tabs, segments, week strip |
| A cue for the first move ("when ___, I'll ___") | No | The strongest unshipped idea (d ≈ 0.99 in clinical samples, none in adult ADHD). It needs a per-task time and reminder to be more than a text field. Worth doing next |
| Lock Screen Live Activity, Home widget | Yes, a day later | Both reports' top gap. Built in Swift without Xcode on this Mac, compiled and driven on iOS simulators through CI. Not yet on a real phone |
| Siri and Shortcuts capture | No | Same reason. `hyperfocus://dump` already works from a Shortcut, and the support page says how |
| Recurring tasks | No | Users expect them, and they pull the app toward daily-miss guilt. A product decision |
| Per-task reminders | No | Conflicts with one nudge a day, which is deliberate |
| Open-ended count-up session | No | Go another round covers running long. Scoring would need rethinking |
| A break offer on the recap | No | Helps fatigue, not performance, in general samples. Low priority |
| "Tell someone I'm starting" | No | Indirect evidence, and one more control on Focus |
| First session defaults to 15 minutes | No | `FULL_VALUE_MIN` is tied to the 25-minute default on purpose. Five-minute starts cover the same ground |

## Built on thin ice, and labelled that way

These are in the app and none of them is proven. The README and listing say so.

- **"Just 5 minutes."** No controlled test exists. It's here because it changes the size of the decision, and it's opt-in.
- **A five-item Today, and one suggested task.** Sensible heuristics. No study gives a number.
- **The race as a reason to come back.** Gamification didn't change adherence across 38 app trials, and its effect dipped around week four in the one long study. The capture-to-start loop has to be worth opening without it, which is what Gentle mode already tests.
- **Brown noise.** Kept because people like it.

Not used anywhere, on purpose: "RSD" (not a validated construct), any claim that the app treats or improves ADHD, Pomodoro as the ADHD-friendly way to work.

## Still open

- **Red on overdue dates.** `DueTag` and the debrief state a past date in a warm red, a choice the code documents. The research leans against it (adults with ADHD report more perceived criticism). Left alone as a deliberate choice.
- **The support page has no direct contact**, only GitHub Issues, which needs an account. App Review guideline 1.5 asks for an easy way to reach the developer. This is the one likely rejection found.
- **Nothing here has run on a physical iPhone.** The session-end sound, the Large Content Viewer and the reworded notifications are all device-only behaviour.
