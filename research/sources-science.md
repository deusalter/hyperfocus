# Hyperfocus: the research evidence that should shape its UI and UX

## Research Task

Design teardown of Hyperfocus (iOS app for people with ADHD: to-do capture, focus timer, "race your recent selves" points). Find the best primary evidence on 11 topics (task initiation, time perception, reward processing, working memory and load, emotional dysregulation, reminders, transitions and hyperfocus, body doubling, digital interventions, sensory design, onboarding). For each finding give the claim, source, evidence strength and one concrete design implication. Call out popular ADHD-app claims the evidence does not support. Verify citations by opening them. Not to be re-derived: no streaks, undo over confirm, no looping animation, rewarding starts, median-day comparison, zero-debt return, five-item cap, near-black on off-white.

## Summary

- **The ADHD-specific evidence base for a to-do and timer app is thin.** Strong evidence exists for the underlying differences (timing g = 0.69, delay discounting d = 0.43, emotion dysregulation g = 1.17, working memory, distractibility). Evidence that any specific app feature helps adults or teens with ADHD is mostly absent, child-only, lab-only, or self-report.
- **Best-supported levers the app under-uses:** if-then plans attached to a cue (the app has a "first move" but no "when"), task-specific reminders that act as the external cue, immediate rather than deferred feedback, and stripping salient irrelevant content from the Focus screen.
- **Things the earlier pass likely over-trusted:** points as a retention engine (gamification did not moderate efficacy or adherence in a 38-study meta-analysis, and its effect dips at about four weeks), brown noise (zero qualifying studies; the app lists it first), a 25-minute default (no ADHD evidence; two student studies disagree), and the "nothing loops" rule, which the companion's idle breathe breaks (`src/components/Sprite.tsx` uses `withRepeat`; `src/lib/motion.ts` line 12 documents the exception, the README does not).
- **Things the app already gets right by the evidence:** remaining time, elapsed time and end clock time together; a visible rather than hidden limit; fixed, predictable rewards; self-comparison only; light default; one reminder a day that stops after a week.
- **Not supported:** RSD as a validated construct, brown noise, body doubling as proven, Pomodoro as ADHD-optimal, Bionic Reading and special fonts, variable-reward "dopamine" mechanics, analog timers beating digits, the "5-minute rule" as tested.

Strength scale: strong (meta-analysis or replicated RCTs in the relevant population), moderate (meta-analysis in a neighbouring population, or single good RCT), weak (small, lab-only, cross-sectional, preprint), contested (credible studies disagree), folk wisdom (no controlled test found).

## Detailed Findings

### 1. Task initiation

| Claim | Strength | Design implication |
|---|---|---|
| If-then plans raise goal attainment in people with mental health problems: d+ = 0.99, 28 studies, N = 1,636<sup>[1](#sources)</sup>. In children, g = 0.31 across 42 studies (N = 12,957), larger in some analyses for children with ADHD<sup>[2](#sources)</sup>. | Strong in general, moderate for ADHD | The "first move" field has the "then" but no "if". Add one optional cue line: "When ___ , I'll ___", with three tappable cues (a time, "after lunch", "when I sit down"). |
| In children with ADHD, an if-then plan brought Go/NoGo inhibition to the level of children without ADHD; plan plus medication was best<sup>[3](#sources)</sup>. Follow-ups cover shifting, working memory and classroom self-regulation<sup>[4](#sources)</sup><sup>[5](#sources)</sup>. | Weak to moderate (small lab studies, one research group, children) | Treat as supportive, not proof. Do not claim it is "proven for ADHD". |
| **No trial of if-then plans in adults or teens with ADHD was found.** | Gap | Ship the cue line as optional and skippable. |
| ADHD symptoms relate consistently to procrastination; inattention is the robust correlate (11 studies, N = 2,788, cross-sectional)<sup>[6](#sources)</sup>. | Moderate (association only) | Position starting, not planning, as the app's job. Already done. |
| Preregistered SEM, N = 640 adults: the inattention to procrastination link ran through sensitivity to delay, low perceived task value, and flexible goal adjustment<sup>[7](#sources)</sup>. | Weak to moderate (cross-sectional) | A frictionless "Later" swipe may feed easy goal adjustment. Ask for a "when" at the moment a task goes to Later. |
| Task decomposition has no isolated ADHD trial. It is one component of CBT for adult ADHD, which beat an attention-matched control in an RCT (N = 86)<sup>[8](#sources)</sup> and waiting list in a Cochrane review (self-report SMD -0.84, moderate quality; most other comparisons low quality)<sup>[9](#sources)</sup>. | Moderate for the package, unknown for the component | Keep "Name the very first move". Do not grow it into a subtask tree; nothing shows more structure helps. |
| A brief procrastination-focused CBT changed procrastination trajectories in 24 students with ADHD symptoms (single-case AB design)<sup>[10](#sources)</sup>. | Weak | None beyond the above. |
| "Just 5 minutes" and "the wall of awful": no controlled test found. | Folk wisdom | The reminder copy "Got five minutes?" is harmless, but it is not evidence-based. The 15-minute option carries the same idea. |

### 2. Time perception

| Claim | Strength | Design implication |
|---|---|---|
| Timing deficits in ADHD are broad: 55 studies; discrimination, estimation, production and reproduction all affected, with more variability<sup>[11](#sources)</sup>. Lifespan pooled g = 0.688 over 824 effect sizes<sup>[12](#sources)</sup>. | Strong (that a deficit exists) | Never make the user hold elapsed time in their head. The clock must be visible from the Lock Screen (Live Activity). |
| Direction is **not** consistent. Children tend to overestimate (27 studies)<sup>[13](#sources)</sup>; one meta-analysis reads the pattern as an accelerated internal clock<sup>[11](#sources)</sup>; adult studies are scarce (9 in a decade) and mixed<sup>[14](#sources)</sup>. Deficits are clearer at longer durations<sup>[15](#sources)</sup>. | Contested | The code comment in `app/focus.tsx` ("errors run high and low") is right. Keep remaining, elapsed and "until 3:40 PM" together. Do not auto-pad estimates in one direction. |
| A visible timer beat a hidden time limit: 49 children aged 7 to 9, lower anxiety with a visible timer than with an unseen limit (d = 0.40) and worse maths performance only when the timer was hidden<sup>[16](#sources)</sup>. | Weak to moderate (one study, non-ADHD children; the manuscript's discussion contradicts its own results section on anxiety) | A countdown is not the anxiety source; an invisible deadline is. Keep the ring. An option to hide digits is fine, but keep the ring visible. |
| Time-skills training plus time-assistive devices improved time processing (p = 0.019) and parent-rated daily time management (p = 0.01) versus education only: RCT, 38 children with ADHD, 24 weeks<sup>[17](#sources)</sup>. Group CBT on time management reduced symptoms in adults (n = 24 vs 24)<sup>[18](#sources)</sup>. | Moderate (small RCTs; devices not isolated from training) | Externalised time has trial support as part of a package. Show "last time, a task like this took 32 minutes" on the Start card so estimates get feedback. |
| **Analog depleting disc versus digits: no head-to-head trial found**, in ADHD or otherwise. | Gap | Do not claim the ring is "better for ADHD brains". Showing both is the defensible choice. |

### 3. Reward processing

| Claim | Strength | Design implication |
|---|---|---|
| Steeper delay discounting in ADHD: d = 0.43, 25 comparisons, N = 3,913, no moderation by age<sup>[19](#sources)</sup>. Children with ADHD prefer immediate reward and may need stronger reinforcement<sup>[20](#sources)</sup>. Ventral striatal hypo-response during reward anticipation, d = 0.48 to 0.58<sup>[21](#sources)</sup>. | Strong | Pay out at the moment of the act. The runner should pass a past day on the recap screen, in that second. Nothing of value should wait for the weekly debrief. |
| Stimulation during a wait normalised ADHD children's preference for the larger delayed reward<sup>[22](#sources)</sup>. | Weak to moderate (one child study) | An empty wait is the expensive part. Supports optional sound during focus and argues against any blank loading or countdown-to-start screen. |
| Game format and a large incentive (10 euros) prevented the time-on-task decline in children with ADHD; 1 euro did not; neither normalised working memory<sup>[23](#sources)</sup>. | Weak to moderate (lab, children, single session) | Game framing can sustain effort inside one session. It says nothing about week 6. |
| Gamification did not moderate efficacy (β = -0.03, p = .38) or adherence (p = .40) across 38 mental health app trials, N = 8,110<sup>[24](#sources)</sup>. | Moderate (depression apps, not ADHD) | Do not expect the race to retain users. The capture to start loop must be worth opening with the race collapsed. |
| Novelty decay: in a 14-week study of 756 students the gamification effect fell after about 4 weeks, then partly recovered between weeks 6 and 10<sup>[25](#sources)</sup>. A 16-week classroom study with a leaderboard and badges found lower motivation and exam scores than control<sup>[26](#sources)</sup>. Learning meta-analysis: overall positive, motivational effects unstable<sup>[27](#sources)</sup>. | Moderate, non-ADHD (25 to 27 not opened in full; see Notes) | Expect a week 4 dip. Do not answer it with more mechanics. |
| Expected, contingent rewards undermine intrinsic motivation (d = -0.28 to -0.40); positive informational feedback enhances it (d = 0.33). 128 studies<sup>[28](#sources)</sup>. | Strong, general population, mostly tangible rewards | Word points as information ("three starts today") rather than payment ("you earned 40"). |
| Variable versus fixed rewards in ADHD: 19 studies, results on schedule "mixed", study quality poor, no clear instrumental learning deficit<sup>[29](#sources)</sup>. Dopamine transfer deficit theory predicts worse performance under partial reinforcement<sup>[30](#sources)</sup>. | Contested | No evidence supports variable or surprise rewards for ADHD. Keep the fixed start reward. |
| Social versus self comparison: no ADHD study found. Apps rarely tailor comparison although responses to it differ between people<sup>[31](#sources)</sup>. | Weak | Keep self-comparison only and keep Gentle mode. No leaderboards. |
| Monitoring progress promotes goal attainment: d+ = 0.40, 138 studies, larger when recorded<sup>[32](#sources)</sup>. | Strong, general population | Insights and recap are justified, subject to topic 5. |

### 4. Working memory and cognitive load

| Claim | Strength | Design implication |
|---|---|---|
| Working memory deficits persist in adults with ADHD: moderate effects, 38 studies<sup>[33](#sources)</sup>. | Strong | Anything the user must remember between screens should be shown instead (task title and first move stay on the Focus screen; they do). |
| Adults with ADHD paid about twice the reaction-time cost for salient irrelevant images (101 ms vs 43 ms); higher perceptual load in the main task cut it<sup>[34](#sources)</sup>. | Moderate (n = 17 vs 16, lab) | The Focus screen should hold nothing colourful or moving that is not the task. The companion and race do not belong there. |
| No evidence-based number of choices per screen exists. Choice overload varies by measure and moderator and is not a fixed effect<sup>[35](#sources)</sup>. | Contested | The five-item cap is a sensible heuristic, not a finding. Do not describe it as research-backed. |
| "One next action beats a list" for ADHD: no trial found. | Gap | The Home "Start one thing" card is reasonable. It is an untested design bet. |

### 5. Emotion, rejection sensitivity, shame and avoidance

| Claim | Strength | Design implication |
|---|---|---|
| Emotion dysregulation in adult ADHD: g = 1.17, 13 studies, N = 2,535; lability g = 1.20<sup>[36](#sources)</sup>. | Strong | A bad-day screen will be read harder than intended. Keep verdict-free copy. |
| **RSD is not a DSM construct and has no validated measure.** For rejection sensitivity the data conflict: positive correlations in 4,150 students<sup>[37](#sources)</sup>; no association in a longitudinal sample of 116<sup>[38](#sources)</sup>; the supportive qualitative paper had five participants<sup>[39](#sources)</sup>. | Contested | Never use "RSD" in copy or store text. |
| What is supported: adults with an ADHD diagnosis report more perceived criticism and less self-compassion (N = 1,203, cross-sectional)<sup>[40](#sources)</sup>. | Moderate | The app should never be another source of criticism: no "overdue", no red, no counts of what was not done. |
| People avoid progress information that threatens the self ("the ostrich problem")<sup>[41](#sources)</sup>. | Moderate (review, general population) | A backlog count is a reason not to open the app. Show Later as a door without a number, and let old items fade out unprompted with undo. |
| Self-forgiveness after procrastinating predicted less later procrastination in students<sup>[42](#sources)</sup>. | Weak (one study; metadata verified only) | When the timer ends unfinished, the recap's first line should normalise it before asking anything. |

### 6. Reminders and notifications

| Claim | Strength | Design implication |
|---|---|---|
| Adults with ADHD execute fewer of their own real-life intentions (29 vs 24), and everyday prospective memory mediates the link to procrastination<sup>[43](#sources)</sup>. | Moderate (small) | Remembering is the failure point. A reminder must name the task and the first move, not "One small thing?". |
| Imagining carrying out the intention raised execution across groups (N = 127); the effect vanished after controlling verbal ability<sup>[44](#sources)</sup>. | Weak | Optional only: a "picture where you'll be" hint beside the cue line. |
| SMS reminders in a self-guided programme for adults with ADHD (N = 109): faster logins in some modules, **no effect** on completion, logins or practice<sup>[45](#sources)</sup>. | Moderate (the only ADHD-specific prompt trial found) | Reminders bring people back sooner, they do not make them do the thing. The notification needs a "Start 15 minutes" action that opens a running session. |
| Prompt effects are small and decay. Push raised 24-hour engagement by 3.9% in 1,255 users<sup>[46](#sources)</sup>. Walking suggestions gave +66% steps at first, diminishing over 6 weeks<sup>[47](#sources)</sup>. | Moderate (non-ADHD, micro-randomised) | Keep one a day and the stop after a week. Never escalate frequency when prompts go unanswered. |
| A notification alone, not acted on, impaired an attention task as much as using the phone<sup>[48](#sources)</sup>. A week with alerts on raised self-reported inattention and hyperactivity (N = 221, general population)<sup>[49](#sources)</sup>. | Moderate | The app must send nothing during a session, and should offer to switch on an iOS Focus when one starts. |
| Best time of day to prompt: no ADHD evidence. One exploratory signal for midday at weekends<sup>[46](#sources)</sup>. | Weak | Keep the user-chosen hour. |

### 7. Transitions, hyperfocus and breaks

| Claim | Strength | Design implication |
|---|---|---|
| Hyperfocus is self-reported more often by adults with high ADHD symptoms (n = 251 and 372)<sup>[50](#sources)</sup>, but 78 diagnosed patients did not differ from matched controls<sup>[51](#sources)</sup>, and the construct lacks a consensus definition<sup>[52](#sources)</sup>. | Contested | Do not build features that assume hyperfocus as an ADHD trait. Do make running past the bell cheap: a one-tap "keep going" that counts up. |
| Fixed versus self-chosen breaks: fixed breaks gave better mood and similar output in less time (87 students)<sup>[53](#sources)</sup>. A later study (94 students) found Pomodoro raised fatigue faster and Pomodoro and Flowtime lowered motivation faster than self-regulated breaks, with no difference in productivity or completion<sup>[54](#sources)</sup>. | Contested, non-ADHD | 25 minutes has no special standing. Keep 15, 25, 45 and the 5-minute adjust. Do not present Pomodoro as the ADHD-friendly mode. |
| Micro-breaks: vigor d = .36, fatigue d = .35, performance not significant (22 samples, N = 2,335)<sup>[55](#sources)</sup>. | Moderate, general population | The app has no break affordance. An optional, skippable "5 off, then back?" on the recap is the supported form. |
| Children with ADHD decline over time on task unless strongly motivated<sup>[23](#sources)</sup>. | Weak to moderate | Makes the shortest length the safer first-session default. |
| Task-switching cost in adult ADHD: behavioural differences small or absent<sup>[56](#sources)</sup>. Break compliance in ADHD: nothing found. | Weak / gap | No basis for transition rituals or forced cool-downs. |

### 8. Body doubling and accountability

| Claim | Strength | Design implication |
|---|---|---|
| Survey of 220 mostly neurodivergent people describes body doubling as using another's presence to start and stay on task; live or recorded, known or stranger<sup>[57](#sources)</sup>. | Weak (self-selected, self-report) | Shows demand, not efficacy. |
| VR bricklaying, 12 adults: a human double and a simulated AI double both raised speed (8.5 to about 11 bricks per minute) and perceived focus; no human versus AI difference. The authors state no peer-reviewed controlled trial exists in adults with ADHD and cite earlier null studies<sup>[58](#sources)</sup>. | Weak (preprint, n = 12) | A solo analogue is plausible, not proven. |
| Interviews with 14 developers with ADHD: AI copresence gave accountability with less fear of being judged than human copresence<sup>[59](#sources)</sup>. | Weak (preprint, qualitative) | If tried, a still companion "working alongside" on the Focus screen is the cheapest test. It must not move (finding 34). |
| App trial dropout is lower with human feedback<sup>[60](#sources)</sup>. | Moderate, depression apps | The no-accounts design gives this up. A share-sheet "tell someone I'm starting" keeps privacy and adds a person. |

### 9. Digital interventions for ADHD

| Claim | Strength | Design implication |
|---|---|---|
| Pooled effects are small: SMD -0.33 for overall symptoms across 25 RCTs, N = 1,780<sup>[61](#sources)</sup>; g = -0.32 across 23 RCTs<sup>[62](#sources)</sup>. An umbrella review of 26 reviews calls effectiveness inconclusive because evidence quality is low, and notes adverse effects are under-reported<sup>[63](#sources)</sup>. Most trials are training games for children. | Moderate that effects are small; **no RCT of a to-do or timer app was found** | Make no efficacy or treatment claim anywhere. |
| A self-guided web programme for adults: d = 0.70 on symptoms, held at 3 months; only 29% completed all 7 modules (N = 120)<sup>[64](#sources)</sup>. | Moderate (self-reported diagnosis and outcome) | Skills content works when completed; completion is the problem. |
| Inflow CBT app, open study: 240 enrolled, 95 assessed at 7 weeks; median 3.86 uses a week<sup>[65](#sources)</sup>. | Weak (uncontrolled) | About three to four opens a week is what an engaged ADHD user looks like. Do not design for daily use. |
| Real-world mental health apps: median 30-day retention 3.3%, daily open rate 4.0%; trackers and peer support retain better<sup>[66](#sources)</sup>. Trial dropout 26.2%, 47.8% after bias adjustment<sup>[60](#sources)</sup>. | Strong (not ADHD-specific) | Everything important has to happen in session one. Predictors of dropout specific to ADHD were not found. |

### 10. Sensory and perceptual design

| Claim | Strength | Design implication |
|---|---|---|
| White and pink noise: g = 0.249 benefit in ADHD or high-symptom youth (13 studies, N = 335), and a **harmful** effect without ADHD (g = -0.212). No brown noise study qualified. Safe volume levels are not established; all lab tasks<sup>[67](#sources)</sup>. | Moderate for pink and white, none for brown | `SOUND_ORDER` lists brown first. Put pink first, keep off as default, cap or lower default volume, and say nothing about benefit. |
| Music: a child and adolescent meta-analysis found a non-significant trend with I² = 92%<sup>[68](#sources)</sup>. | Weak | No basis for a "focus music" claim. |
| Dark on light gives better acuity and proofreading than light on dark<sup>[69](#sources)</sup>. | Moderate, general population | Supports light as default. |
| Special fonts do not help reading even in dyslexia<sup>[70](#sources)</sup><sup>[71](#sources)</sup>. No ADHD-specific font evidence found. Bionic Reading: no peer-reviewed support located (not verified beyond search summaries). | Moderate (against) | No "ADHD font" or bolded-prefix mode. Hanken Grotesk is fine. |
| Text spacing interacted with sustained attention and medium in adolescents with ADHD; direction not clear from the abstract<sup>[72](#sources)</sup>. | Weak | No change warranted. |
| Children with ADHD made more blue-yellow discrimination errors (n = 14 vs 13)<sup>[73](#sources)</sup>. | Weak | The palette is slate blue plus a warm secondary. Do not let any state depend on that hue difference alone. |
| Haptics in ADHD: nothing found. | Gap | Treat haptics as ordinary iOS feedback, with no ADHD rationale. |

### 11. Onboarding and the first session

| Claim | Strength | Design implication |
|---|---|---|
| No experimental evidence on onboarding friction in ADHD was found. | Gap | Everything below is inference. |
| Early attrition is steep in general<sup>[66](#sources)</sup> and in ADHD programmes<sup>[64](#sources)</sup><sup>[65](#sources)</sup>; immediate reward matters more in ADHD<sup>[19](#sources)</sup>. | Moderate (indirect) | The three onboarding steps explain the app. End step three inside a running 15-minute session on a task the user just typed, so the first reward lands in minute one. |
| Prompts add little<sup>[45](#sources)</sup><sup>[46](#sources)</sup>. | Moderate | Ask for notification permission after the first finished session, when there is something specific to be reminded of. |

## Data Tables

| Construct | Effect | k / N | Population | Source |
|---|---|---|---|---|
| Time perception deficit | g = 0.688 | 824 effect sizes | Lifespan | 12 |
| Delay discounting | d = 0.43 | 25 / 3,913 | Children and adults | 19 |
| Emotion dysregulation | g = 1.17 | 13 / 2,535 | Adults | 36 |
| If-then plans, clinical samples | d+ = 0.99 | 28 / 1,636 | Mixed diagnoses | 1 |
| If-then plans, children | g = 0.31 | 42 / 12,957 | Children | 2 |
| White or pink noise, ADHD | g = 0.249 | 13 / 335 | Youth | 67 |
| White or pink noise, non-ADHD | g = -0.212 | 11 / 335 | Youth | 67 |
| Digital interventions for ADHD | SMD -0.33 | 25 / 1,780 | Mostly children | 61 |
| Gamification as moderator of app efficacy | β = -0.03, n.s. | 38 / 8,110 | Depression apps | 24 |
| Progress monitoring | d+ = 0.40 | 138 / 19,951 | General | 32 |
| Micro-breaks on performance | d = .16, n.s. | 15 / 1,132 | General | 55 |
| Mental health app 30-day retention | median 3.3% | 93 apps | General | 66 |

## Concerns/Notes

- **Verification method.** Abstracts were read through the Europe PMC and Crossref record for each paper, plus publisher, repository and arXiv pages. PubMed and some PMC and ScienceDirect pages blocked automated access. "Metadata only" means the citation was confirmed but findings come from a search summary: sources 4, 5, 25, 26, 27, 42, 62.
- **Not verified, so not cited as evidence:** Gollwitzer and Sheeran 2006 effect size; the specific skill modules in Safren 2010; Bond and Titus 1983 on social facilitation (no abstract available); a 2025 Time Timer preprint in 44 children; a Utrecht thesis on Bionic Reading; a student test of the 5-minute rule; any primary source for "the wall of awful".
- **Source inconsistencies found.** Hallez and Rebecchi's manuscript reports lower anxiety with a visible timer in results and abstract, but its discussion says there was no anxiety difference. The Smits preprint and its published version describe the fatigue result differently (the published wording is used here).
- **Population gap.** Almost all ADHD-specific experiments are in children in labs; adult data are surveys. Teens, the app's likely first users, are barely studied.
- **Not examined:** the README's claim that pure black on pure white is a documented source of visual stress.
- **Repo observation (read-only):** README says "Nothing loops"; the companion's breathe idles indefinitely on You and Insights.

## Sources

1. Toli, Webb, Hardy (2016). Br J Clin Psychol 55(1):69-90 - https://europepmc.org/article/MED/25965276
2. Breitwieser, Reinelt (2026). Br J Psychol 117(4):1711-1758 - https://europepmc.org/article/MED/41784001
3. Gawrilow, Gollwitzer (2008). Cogn Ther Res 32:261-280 - https://www.socmot.uni-konstanz.de/publications/implementation-intentions-facilitate-response-inhibition-adhd-children
4. Gawrilow, Gollwitzer, Oettingen (2011). J Soc Clin Psychol 30(6):616-646 (metadata only) - https://doi.org/10.1521/jscp.2011.30.6.616
5. Gawrilow, Morgenroth, Schultz, Oettingen, Gollwitzer (2013). Motiv Emot 37:134-145 (metadata only) - https://doi.org/10.1007/s11031-012-9288-3
6. Suriano (2026). Res Dev Disabil 175:105342 - https://europepmc.org/article/MED/42456607
7. Netzer Turgeman, Pollak (2026). J Atten Disord 30(5):694-704 - https://europepmc.org/article/MED/41549051
8. Safren et al. (2010). JAMA 304(8):875-880 - https://europepmc.org/article/MED/20736471
9. Lopez et al. (2018). Cochrane Database Syst Rev CD010840 - https://europepmc.org/article/MED/29566425
10. Oguchi, Furukawa, Kumano (2025). J Cogn Psychother - https://europepmc.org/article/MED/39870420
11. Marx, Cortese, Koelch, Hacker (2022). J Am Acad Child Adolesc Psychiatry 61(7):866-880 - https://europepmc.org/article/MED/34923055
12. Metcalfe, McFeaters, Voyer (2024). Dev Neuropsychol 49(1):1-24 - https://europepmc.org/article/MED/38145491
13. Zheng, Wang, Chiu, Shum (2022). J Atten Disord 26(2):267-281 - https://europepmc.org/article/MED/33302769
14. Mette (2023). Int J Environ Res Public Health 20(4):3098 - https://pmc.ncbi.nlm.nih.gov/articles/PMC9962130/
15. Nejati, Yazdani (2020). Child Neuropsychol 26(7):900-916 - https://europepmc.org/article/MED/32757699
16. Hallez, Rebecchi (2024). J Exp Educ 94:464-481; author manuscript read - https://orbi.uliege.be/bitstream/2268/335096/1/ArticleNonAnonymous.docx
17. Wennberg, Janeslätt, Kjellberg, Gustafsson (2018). Eur Child Adolesc Psychiatry 27(3):329-342 - https://europepmc.org/article/MED/28956183
18. Nakashima et al. (2022). J Atten Disord 26(3):377-390 - https://europepmc.org/article/MED/33472510
19. Jackson, MacKillop (2016). Biol Psychiatry Cogn Neurosci Neuroimaging 1(4):316-325 - https://europepmc.org/article/MED/27722208
20. Luman, Oosterlaan, Sergeant (2005). Clin Psychol Rev 25(2):183-213 - https://europepmc.org/article/MED/15642646
21. Plichta, Scheres (2014). Neurosci Biobehav Rev 38:125-134 - https://europepmc.org/article/MED/23928090
22. Antrop et al. (2006). J Child Psychol Psychiatry 47(11):1152-1158 - https://europepmc.org/article/MED/17076754
23. Dovis, Van der Oord, Wiers, Prins (2012). J Abnorm Child Psychol 40(5):669-681 - https://pmc.ncbi.nlm.nih.gov/articles/PMC3375007/
24. Six, Byrne, Tibbett, Pericot-Valverde (2021). JMIR Ment Health 8(11):e32199 - https://pmc.ncbi.nlm.nih.gov/articles/PMC8669581/
25. Rodrigues et al. (2022). Int J Educ Technol High Educ 19 (metadata only) - https://doi.org/10.1186/s41239-021-00314-6
26. Hanus, Fox (2015). Comput Educ 80:152-161 (metadata only) - https://doi.org/10.1016/j.compedu.2014.08.019
27. Sailer, Homner (2020). Educ Psychol Rev 32:77-112 (metadata only) - https://doi.org/10.1007/s10648-019-09498-w
28. Deci, Koestner, Ryan (1999). Psychol Bull 125(6):627-668 - https://europepmc.org/article/MED/10589297
29. Hulsbosch et al. (2021). J Am Acad Child Adolesc Psychiatry 60(11):1367-1381 - https://europepmc.org/article/MED/33862167
30. Tripp, Wickens (2008). J Child Psychol Psychiatry 49(7):691-704 - https://europepmc.org/article/MED/18081766
31. Arigo, Brown, Pasko, Suls (2020). J Med Internet Res 22(3):e15642 - https://europepmc.org/article/MED/32217499
32. Harkin et al. (2016). Psychol Bull 142(2):198-229 - https://europepmc.org/article/MED/26479070
33. Alderson, Kasper, Hudec, Patros (2013). Neuropsychology 27(3):287-302 - https://europepmc.org/article/MED/23688211
34. Forster, Robertson, Jennings, Asherson, Lavie (2014). Neuropsychology 28(1):91-97 - https://pmc.ncbi.nlm.nih.gov/articles/PMC3906797/
35. McShane, Böckenholt (2018). Psychometrika 83(1):255-271 - https://europepmc.org/article/MED/28527101
36. Beheshti, Chavanon, Christiansen (2020). BMC Psychiatry 20:120 - https://europepmc.org/article/MED/32164655
37. de Arellano, Rother, Canu, Flory (2026). Subst Use Misuse - https://europepmc.org/article/MED/42521661
38. Chmielowice-Szymanski, Cillessen, Vervoort (preprint). PsyArXiv - https://doi.org/10.31234/osf.io/mbv4u_v2
39. Rowney-Smith, Sutton, Quadt, Eccles (2026). PLoS One 21(1):e0314669 - https://europepmc.org/article/MED/41564005
40. Beaton, Sirois, Milne (2020). Mindfulness 11(11):2506-2518 - https://eprints.whiterose.ac.uk/id/eprint/165039/
41. Webb, Chang, Benn (2013). Soc Personal Psychol Compass 7(11):794-807 - https://doi.org/10.1111/spc3.12071
42. Wohl, Pychyl, Bennett (2010). Pers Individ Dif 48:803-808 (metadata only) - https://doi.org/10.1016/j.paid.2010.01.029
43. Altgassen, Scheres, Edel (2019). Atten Defic Hyperact Disord 11(1):59-71 - https://europepmc.org/article/MED/30927231
44. Altgassen, Heinrich, Edel (2026). J Atten Disord 30(5):705-721 - https://europepmc.org/article/MED/41684048
45. Nordby et al. (2022). Front Digit Health 4:821031 - https://europepmc.org/article/MED/35651537
46. Bidargaddi et al. (2018). JMIR Mhealth Uhealth 6(11):e10123 - https://europepmc.org/article/MED/30497999
47. Klasnja et al. (2019). Ann Behav Med 53(6):573-582 - https://europepmc.org/article/MED/30192907
48. Stothart, Mitchum, Yehnert (2015). J Exp Psychol Hum Percept Perform 41(4):893-897 - https://europepmc.org/article/MED/26121498
49. Kushlev, Proulx, Dunn (2016). Proc CHI 2016:1011-1020 - https://www.interruptions.net/literature/Kushlev-CHI16.pdf
50. Hupfeld, Abagis, Shah (2019). Atten Defic Hyperact Disord 11(2):191-208 - https://europepmc.org/article/MED/30267329
51. Groen et al. (2020). Res Dev Disabil 107:103789 - https://europepmc.org/article/MED/33126147
52. Ashinoff, Abu-Akel (2021). Psychol Res 85(1):1-19 - https://europepmc.org/article/MED/31541305
53. Biwer, Wiradhany, oude Egbrink, de Bruin (2023). Br J Educ Psychol 93(S2):353-367 - https://cris.maastrichtuniversity.nl/en/publications/understanding-effort-regulation-comparing-pomodoro-breaks-and-sel
54. Smits, Wenzel, de Bruin (2025). Behav Sci 15:861 - https://doi.org/10.3390/bs15070861
55. Albulescu et al. (2022). PLoS One 17(8):e0272460 - https://europepmc.org/article/MED/36044424
56. Sidlauskaite, Dhar, Sonuga-Barke, Wiersema (2020). Neuropsychologia 138:107330 - https://europepmc.org/article/MED/31887312
57. Eagle, Baltaxe-Admony, Ringland (2024). ACM Trans Access Comput 17:1-30 - https://doi.org/10.1145/3689648
58. Ara et al. (2025). arXiv:2509.12153 (preprint) - https://arxiv.org/html/2509.12153v1
59. Pimenova, Bernstein, Madan, Jain, Potluri (2026). arXiv:2609.21254 (preprint) - https://arxiv.org/abs/2609.21254
60. Torous, Lipschitz, Ng, Firth (2020). J Affect Disord 263:413-419 - https://europepmc.org/article/MED/31969272
61. Liu et al. (2024). J Affect Disord 365:563-577 - https://europepmc.org/article/MED/39191306
62. Kasturiratna, Hartanto, Lee, Koh, Majeed (2025). Comput Hum Behav Rep 19:100703 (metadata only) - https://doi.org/10.1016/j.chbr.2025.100703
63. Gabarron, Denecke, Lopez-Campos (2025). BMC Psychiatry 25:414 - https://europepmc.org/article/MED/40264083
64. Kenter, Gjestad, Lundervold, Nordgreen (2023). Internet Interv 32:100614 - https://europepmc.org/article/MED/36969389
65. Knouse, Hu, Sachs, Isaacs (2022). PLOS Digit Health 1(8):e0000083 - https://europepmc.org/article/MED/36812621
66. Baumel, Muench, Edan, Kane (2019). J Med Internet Res 21(9):e14567 - https://europepmc.org/article/MED/31573916
67. Nigg, Bruton, Kozlowski, Johnstone, Karalunas (2024). J Am Acad Child Adolesc Psychiatry 63(8):778-788 - https://ohsu.elsevierpure.com/en/publications/systematic-review-and-meta-analysis-do-white-noise-or-pink-noise-
68. Goes, Nardi, Quagliato (2025). Trends Psychiatry Psychother 47:e20241020 - https://europepmc.org/article/MED/40680190
69. Piepenbrock, Mayr, Mund, Buchner (2013). Ergonomics 56(7):1116-1124 - https://europepmc.org/article/MED/23654206
70. Wery, Diliberto (2017). Ann Dyslexia 67(2):114-127 - https://europepmc.org/article/MED/26993270
71. Kuster, van Weerdenburg, Gompel, Bosman (2018). Ann Dyslexia 68(1):25-42 - https://europepmc.org/article/MED/29204931
72. Stern, Shalev (2013). Res Dev Disabil 34(1):431-439 - https://europepmc.org/article/MED/23023301
73. Banaschewski et al. (2006). J Child Psychol Psychiatry 47(6):568-572 - https://europepmc.org/article/MED/16712633
