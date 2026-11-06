// End-to-end checks against the web build, driven headlessly. Exercises the real
// store, router and screens, which unit tests can't.
//
//   npx expo start --web --port 8099   (in another terminal)
//   npm run e2e
//
// Web can't cover native-only behaviour: notifications, audio, haptics, and system
// alerts (react-native-web's Alert does nothing). Those need a device.

import { chromium } from 'playwright-core'
import { seed, runningSession, dayKey, daysFromNow, SETTINGS } from './seed.mjs'

const BASE = process.env.E2E_URL ?? 'http://localhost:8099'
const only = process.argv[2]

const browser = await chromium.launch({ channel: 'chrome', headless: true })
let passed = 0
const failures = []

async function scenario(name, state, run, { allowErrors = false } = {}) {
  if (only && !name.includes(only)) return
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 240))
  })
  await page.addInitScript((data) => {
    // only on the first load, so a reload sees what the app itself persisted
    if (localStorage.getItem('__seeded')) return
    localStorage.setItem('__seeded', '1')
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, JSON.stringify(v))
  }, state ?? {})

  const start = Date.now()
  try {
    await run(page)
    if (errors.length && !allowErrors) throw new Error(`console errors: ${errors.join(' | ')}`)
    passed += 1
    console.log(`  ok   ${name} (${Date.now() - start}ms)`)
  } catch (err) {
    failures.push(name)
    console.log(`  FAIL ${name}\n       ${err.message.split('\n').join('\n       ')}`)
    await page.screenshot({ path: `/tmp/hf-e2e-fail-${name.replace(/\W+/g, '-')}.png` }).catch(() => {})
  } finally {
    await ctx.close()
  }
}

const open = async (page, path = '/') => {
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 180000 })
  await page.waitForTimeout(700)
}
const see = (page, text, timeout = 6000) =>
  page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout })
const seeExact = (page, text, timeout = 6000) =>
  page.getByText(text, { exact: true }).first().waitFor({ state: 'visible', timeout })
const gone = (page, text, timeout = 6000) =>
  page.getByText(text, { exact: false }).first().waitFor({ state: 'hidden', timeout })
const tap = async (page, text) => {
  const el = page.getByText(text, { exact: true }).first()
  await el.waitFor({ state: 'visible', timeout: 6000 })
  await el.click()
}
const stored = (page, key) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key)
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

console.log('Hyperfocus e2e')

// ---- first run ----

await scenario('first run walks through onboarding to an inviting home', {}, async (page) => {
  await open(page)
  await see(page, 'Race your past self')
  await tap(page, 'Next')
  await see(page, 'How it works')
  await tap(page, 'Next')
  await see(page, 'Set your pace')
  await page.getByPlaceholder('Your name').fill('Sam')
  await tap(page, "Let's go")
  await see(page, ', Sam')
  await see(page, 'Start a brain dump')
  assert((await stored(page, 'hf2-settings')).onboarded === true, 'onboarded not saved')
  await page.reload()
  await page.waitForTimeout(800)
  await see(page, ', Sam')
  await gone(page, 'Race your past self', 1000)
})

await scenario('skip still lands home and stays onboarded', {}, async (page) => {
  await open(page)
  await tap(page, 'Skip')
  await see(page, 'Start a brain dump')
})

// ---- capture and triage ----

await scenario('capture, then sort with undo', seed({ tasks: [] }), async (page) => {
  await open(page, '/dump')
  const input = page.getByPlaceholder("What's on your mind?")
  for (const t of ['Buy stamps', 'Call dentist', 'Water plants']) {
    await input.fill(t)
    await input.press('Enter')
  }
  await see(page, '3 CAPTURED')
  await see(page, 'Sort these 3')
  await page.getByText('Sort these 3').click()

  // newest first
  await see(page, 'Water plants')
  await tap(page, 'Today')
  await see(page, 'Call dentist')
  await tap(page, 'Later')
  await see(page, 'Buy stamps')
  await tap(page, 'Let go')
  await see(page, 'All sorted')

  await see(page, 'Let go of "Buy stamps"')
  await tap(page, 'Undo')
  await see(page, 'Buy stamps')
  await tap(page, 'Today')
  await see(page, 'All sorted')

  const tasks = await stored(page, 'hf2-tasks')
  const by = Object.fromEntries(tasks.map((t) => [t.title, t.bucket]))
  assert(by['Water plants'] === 'today', 'Water plants not on today')
  assert(by['Call dentist'] === 'later', 'Call dentist not in later')
  assert(by['Buy stamps'] === 'today', 'undo did not restore Buy stamps')
})

await scenario('the last sort can be taken back, including the final card', seed({
  tasks: [
    { id: 'a', title: 'First card', bucket: 'inbox', createdAt: new Date().toISOString() },
    { id: 'b', title: 'Second card', bucket: 'inbox', createdAt: new Date().toISOString() },
  ],
}), async (page) => {
  await open(page, '/triage')
  await see(page, 'First card')
  await gone(page, 'Undo last', 500)
  await tap(page, 'Later')
  await see(page, 'Second card')
  await tap(page, 'Undo last')
  await see(page, 'First card')
  assert((await stored(page, 'hf2-tasks')).find((t) => t.id === 'a').bucket === 'inbox', 'not back in the inbox')
  await tap(page, 'Today')
  await see(page, 'Second card')
  await tap(page, 'Today')
  await see(page, 'All sorted')
  await tap(page, 'Undo last')
  await see(page, 'Second card')
  await gone(page, 'All sorted', 1000)
})

await scenario('the soft cap warns but never blocks', seed({
  tasks: [
    ...['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, title: `Task ${id}`, cat: 'sprint', bucket: 'today', createdAt: new Date().toISOString() })),
    { id: 'i', title: 'One more', bucket: 'inbox', createdAt: new Date().toISOString() },
  ],
}), async (page) => {
  await open(page, '/triage')
  await see(page, 'Later is not a downgrade')
  await tap(page, 'Today')
  await see(page, 'All sorted')
  const moved = (await stored(page, 'hf2-tasks')).find((t) => t.id === 'i')
  assert(moved.bucket === 'today', 'over-cap task was not allowed through')
})

// ---- check off ----

await scenario('checking something off scores it and can be undone', seed(), async (page) => {
  await open(page)
  const before = (await stored(page, 'hf2-history')).length
  await page.getByLabel('Mark Clear the desk done').click()
  await see(page, 'Done. +18 pts')
  await gone(page, 'Clear the desk', 3000).catch(() => {})
  assert((await stored(page, 'hf2-history')).length === before + 1, 'completion not logged')
  await tap(page, 'Undo')
  await see(page, 'Clear the desk')
  assert((await stored(page, 'hf2-history')).length === before, 'undo left the completion behind')
  assert((await stored(page, 'hf2-tasks')).some((t) => t.id === 't3'), 'undo did not restore task')
})

// ---- the focus loop: the bugs that used to lose work ----

await scenario('back leaves the session running, and Home can find it', seed(), async (page) => {
  await open(page)
  await page.getByText('Start one thing').click()
  await see(page, 'FOCUSING ON')
  await page.getByLabel('Back', { exact: true }).click()
  await see(page, 'Session in progress')
  assert(await stored(page, 'hf2-focus'), 'session was destroyed by going back')
  await gone(page, 'Start one thing', 1000)
  await page.getByText('Session in progress').click()
  await see(page, 'FOCUSING ON')
})

await scenario('pause holds the clock across a reload', seed(), async (page) => {
  await open(page)
  await page.getByText('Start one thing').click()
  await see(page, 'FOCUSING ON')
  await tap(page, 'Pause')
  await seeExact(page, 'PAUSED')
  const saved = await stored(page, 'hf2-focus')
  assert(saved.running === false, 'pause not persisted')
  await page.reload()
  await page.waitForTimeout(900)
  await seeExact(page, 'PAUSED')
  await page.waitForTimeout(1500)
  assert((await stored(page, 'hf2-focus')).pausedRemaining === saved.pausedRemaining, 'clock moved while paused')
})

await scenario('time can be added and taken off a running session', seed(), async (page) => {
  await open(page)
  await page.getByText('Start one thing').click()
  await see(page, 'FOCUSING ON')
  const total = async () => (await stored(page, 'hf2-focus')).totalSec
  assert((await total()) === 1500, 'unexpected starting length')
  await page.getByLabel('Add 5 minutes').click()
  await page.waitForTimeout(100)
  assert((await total()) === 1800, '+5 did not extend the session')
  await page.getByLabel('Take off 5 minutes').click()
  await page.getByLabel('Take off 5 minutes').click()
  await page.waitForTimeout(100)
  assert((await total()) === 1200, '-5 did not shorten the session')
})

await scenario('Done finishes the task, and it can be put back', seed(), async (page) => {
  await open(page)
  await page.getByLabel(/^Focus on Clear the desk/).click()
  await see(page, 'FOCUSING ON')
  await page.getByLabel('Done with Clear the desk').click()
  await see(page, 'SESSION COMPLETE')
  await see(page, 'for starting')
  assert(!(await stored(page, 'hf2-tasks')).some((t) => t.id === 't3'), 'task not removed on Done')
  await page.getByText('Not actually finished').click()
  await see(page, 'Clear the desk')
  assert(await page.getByText('Start one thing').first().isVisible(), 'did not land on Home')
  const back = (await stored(page, 'hf2-tasks')).find((t) => t.id === 't3')
  assert(back?.bucket === 'today', 'task not put back on Today')
  assert(!(await stored(page, 'hf2-focus')), 'session still stored after finishing')
})

await scenario('stopping in the first minute keeps the task and logs nothing', seed(), async (page) => {
  await open(page)
  const before = (await stored(page, 'hf2-history')).length
  await page.getByText('Start one thing').click()
  await see(page, 'FOCUSING ON')
  await tap(page, 'Stop without saving')
  await see(page, 'Today')
  assert((await stored(page, 'hf2-history')).length === before, 'stopped session was logged')
  assert((await stored(page, 'hf2-tasks')).length === 7, 'stopping changed the task list')
  assert(!(await stored(page, 'hf2-focus')), 'session still stored after stopping')
})

const nearlyDone = () =>
  seed({ focus: runningSession('t1', 'Draft intro for history essay', 'grind', { leftMs: 2500 }) })

await scenario('a session running out does not delete the unfinished task', nearlyDone(), async (page) => {
  await open(page, '/focus')
  await see(page, "TIME'S UP", 8000)
  await see(page, 'Did you finish it?')
  assert((await stored(page, 'hf2-tasks')).some((t) => t.id === 't1'), 'task deleted when time ran out')
  assert((await stored(page, 'hf2-history')).length === 15, 'session not banked')
  await tap(page, 'Not yet')
  await see(page, 'Draft intro for history essay')
  assert((await stored(page, 'hf2-tasks')).some((t) => t.id === 't1'), 'task lost after Not yet')
})

await scenario('"Finished it" takes the task off the list', nearlyDone(), async (page) => {
  await open(page, '/focus')
  await see(page, 'Did you finish it?', 8000)
  await tap(page, 'Finished it')
  await see(page, 'Today')
  assert(!(await stored(page, 'hf2-tasks')).some((t) => t.id === 't1'), 'task kept after Finished it')
})

await scenario('another round starts the same task again', nearlyDone(), async (page) => {
  await open(page, '/focus')
  await see(page, 'Did you finish it?', 8000)
  await page.getByText('Go another 25 minutes').click()
  await see(page, 'FOCUSING ON')
  await see(page, 'Draft intro for history essay')
  const session = await stored(page, 'hf2-focus')
  assert(session?.taskId === 't1' && session.running, 'second round did not start')
  await page.waitForTimeout(600)
  await see(page, 'FOCUSING ON') // must not bounce home
})

await scenario('a session ending on another tab still gets its recap', nearlyDone(), async (page) => {
  await open(page, '/calendar')
  await see(page, 'Calendar')
  await see(page, "TIME'S UP", 8000)
  assert((await stored(page, 'hf2-history')).length === 15, 'session not banked')
})

await scenario('a recap waits for an open sheet instead of interrupting it', nearlyDone(), async (page) => {
  await open(page, '/dump')
  await page.getByPlaceholder("What's on your mind?").fill('half a thought')
  await page.waitForTimeout(3500)
  assert(await page.getByPlaceholder("What's on your mind?").isVisible(), 'recap interrupted brain dump')
  assert((await page.getByPlaceholder("What's on your mind?").inputValue()) === 'half a thought', 'draft lost')
  await page.getByLabel('Close').click()
  await see(page, "TIME'S UP", 6000)
})

await scenario('a session that ran out overnight is credited to when it ended', seed({
  focus: {
    ...runningSession('t1', 'Draft intro for history essay', 'grind'),
    endsAt: daysFromNow(-1, 23).getTime(),
  },
}), async (page) => {
  await open(page)
  await page.waitForTimeout(500)
  const history = await stored(page, 'hf2-history')
  const entry = history.find((c) => c.title === 'Draft intro for history essay')
  assert(entry, 'session was not banked')
  assert(
    dayKey(new Date(entry.completedAt)) === dayKey(daysFromNow(-1)),
    `credited to ${entry.completedAt}, not the day it ended`
  )
  assert(!(await stored(page, 'hf2-focus')), 'stale session still stored')
  await gone(page, "TIME'S UP", 1000) // a forgotten session shouldn't open on a recap
})

// ---- editing and dates: the calendar has to be real ----

await scenario('the editor changes a task and saves without a button', seed(), async (page) => {
  await open(page)
  await page.getByText('Clear the desk').first().click()
  await see(page, 'WHAT KIND')
  await page.getByLabel('Task title').fill('Clear the whole desk')
  await page.getByLabel('The very first move').fill('move the mugs')
  await page.getByLabel(/^Fire\./).click()
  await tap(page, 'Tomorrow')
  await page.getByLabel('Close').click()
  await see(page, 'Clear the whole desk')
  const t = (await stored(page, 'hf2-tasks')).find((x) => x.id === 't3')
  assert(t.title === 'Clear the whole desk', 'title not saved')
  assert(t.firstStep === 'move the mugs', 'first step not saved')
  assert(t.cat === 'fire', 'category not saved')
  assert(t.due === dayKey(daysFromNow(1)), 'date not saved')
})

await scenario('an empty title falls back rather than wiping the task', seed(), async (page) => {
  await open(page, '/task/t3')
  await page.getByLabel('Task title').fill('')
  await page.getByLabel('Close').click()
  await page.waitForTimeout(300)
  assert((await stored(page, 'hf2-tasks')).find((x) => x.id === 't3').title === 'Clear the desk', 'title wiped')
})

await scenario('a dated task appears on the calendar and on its day', seed({
  tasks: [{ id: 'x', title: 'Dated thing', cat: 'sprint', bucket: 'later', createdAt: new Date().toISOString() }],
}), async (page) => {
  await open(page, '/task/x')
  await see(page, 'WHAT KIND')
  await tap(page, 'Today')
  await page.getByLabel('Close').click()
  await see(page, 'Start one thing')
  await see(page, 'Dated thing') // a Later task joins Today on its day
  const t = (await stored(page, 'hf2-tasks')).find((x) => x.id === 'x')
  assert(t.bucket === 'later', 'bucket should not be rewritten by a date')
})

await scenario('moving a due-today task to Later actually moves it', seed({
  tasks: [{ id: 'x', title: 'Not today', cat: 'sprint', bucket: 'later', due: dayKey(daysFromNow(0)), createdAt: new Date().toISOString() }],
}), async (page) => {
  await open(page, '/task/x')
  await tap(page, 'Later')
  await page.getByLabel('Close').click()
  await page.getByLabel(/^Later, /).waitFor({ state: 'visible', timeout: 6000 })
  await gone(page, 'Start one thing', 2000)
  const t = (await stored(page, 'hf2-tasks')).find((x) => x.id === 'x')
  assert(!t.due, 'date of today would pull it straight back')
})

await scenario('letting go from the editor closes it and offers undo', seed(), async (page) => {
  await open(page)
  await page.getByText('Clear the desk').first().click()
  await see(page, 'WHAT KIND')
  await tap(page, 'Let go')
  await see(page, 'Let go of "Clear the desk"')
  assert(!(await stored(page, 'hf2-tasks')).some((t) => t.id === 't3'), 'task not removed')
  await tap(page, 'Undo')
  await see(page, 'Clear the desk')
})

await scenario('the calendar adds to a chosen day and shows what got finished', seed(), async (page) => {
  await open(page, '/calendar')
  await see(page, 'Morning review') // today's finished list
  await page.getByText('Add something for today').click()
  const input = page.getByPlaceholder('Something for today')
  await input.fill('Added from calendar')
  await input.press('Enter')
  await see(page, 'Added from calendar')
  const t = (await stored(page, 'hf2-tasks')).find((x) => x.title === 'Added from calendar')
  assert(t.bucket === 'today' && t.due === dayKey(daysFromNow(0)), 'added to the wrong place')
})

await scenario('the calendar reaches other weeks and comes back', seed(), async (page) => {
  await open(page, '/calendar')
  await page.getByLabel('Next week').click()
  await see(page, 'Back to today')
  await page.getByText('Back to today').click()
  await see(page, 'This week')
  await page.getByLabel('Previous week').click()
  await gone(page, 'Add something', 2000) // the past takes no new tasks
})

await scenario('a title typed right before Mark done is the one that gets logged', seed(), async (page) => {
  await open(page, '/task/t3')
  await page.getByLabel('Task title').fill('Clear the whole desk')
  await tap(page, 'Mark done')
  await see(page, 'Done. +18 pts')
  const logged = (await stored(page, 'hf2-history'))[0]
  assert(logged.title === 'Clear the whole desk', `logged "${logged.title}"`)
})

await scenario('a session started from the editor uses the title just typed', seed(), async (page) => {
  await open(page, '/task/t3')
  await page.getByLabel('Task title').fill('Clear the whole desk')
  await tap(page, 'Start focusing')
  await see(page, 'FOCUSING ON')
  assert((await stored(page, 'hf2-focus')).title === 'Clear the whole desk', 'session has the old title')
})

await scenario('pulling an undated task to Today does not give it a deadline', seed({
  tasks: [{ id: 'x', title: 'Someday thing', cat: 'sprint', bucket: 'later', createdAt: new Date().toISOString() }],
}), async (page) => {
  await open(page, '/debrief')
  await see(page, 'SOMEDAY')
  await page.getByLabel('Move Someday thing to Today').click()
  await page.waitForTimeout(150)
  const t = (await stored(page, 'hf2-tasks')).find((x) => x.id === 'x')
  assert(t.bucket === 'today', 'not moved to Today')
  assert(!t.due, 'stamped a date that makes it overdue tomorrow')
})

await scenario('the date picker will not set a day in the past', seed(), async (page) => {
  await open(page, '/task/t3')
  await tap(page, 'Pick a date')
  await page.getByLabel('Previous week').click()
  await page.waitForTimeout(150)
  const lastWeek = dayKey(daysFromNow(-7))
  const label = await page.evaluate(() => [...document.querySelectorAll('[role="button"][aria-disabled="true"]')].length)
  assert(label >= 7, `expected the whole past week disabled, found ${label}`)
  assert((await stored(page, 'hf2-tasks')).find((x) => x.id === 't3').due !== lastWeek, 'past date set')
})

await scenario('a corrupt settings value keeps the tasks and skips the welcome', {
  'hf2-tasks': [{ id: 'a', title: 'Still here', cat: 'sprint', bucket: 'today', createdAt: new Date().toISOString() }],
  'hf2-history': [],
}, async (page) => {
  await page.addInitScript(() => localStorage.setItem('hf2-settings', '{"name":"Sa'))
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForTimeout(900)
  await see(page, 'Still here')
  await gone(page, 'Race your past self', 1000)
})

// ---- start one thing ----

await scenario('"Not this one" offers a different task and comes back round', seed(), async (page) => {
  await open(page)
  const card = () => page.getByLabel(/^Start one thing:/).first().getAttribute('aria-label')
  const first = await card()
  await page.getByLabel('Not this one. Suggest another task.').click()
  await page.waitForTimeout(100)
  const second = await card()
  assert(first !== second, 'still suggesting the same task')
  await page.getByLabel('Not this one. Suggest another task.').click()
  await page.getByLabel('Not this one. Suggest another task.').click()
  await page.waitForTimeout(100)
  assert((await card()) === first, 'did not wrap around')
})

await scenario('what is due gets suggested first', seed(), async (page) => {
  await open(page)
  const label = await page.getByLabel(/^Start one thing:/).first().getAttribute('aria-label')
  assert(label.includes('Draft intro for history essay'), `suggested: ${label}`)
})

// ---- gentle mode ----

await scenario('gentle mode removes every comparison', seed({ settings: { gentle: true } }), async (page) => {
  await open(page)
  await see(page, 'pts so far today')
  for (const text of ['typical', 'PASSED', 'TYPICAL DAY']) {
    assert(!(await page.getByText(text, { exact: false }).first().isVisible().catch(() => false)), `Home still shows "${text}"`)
  }
  assert(!(await page.getByText('days', { exact: true }).first().isVisible().catch(() => false)), 'Home still shows the day count')
  await open(page, '/insights')
  await see(page, 'What your week contained')
  for (const text of ['vs last week', 'typical', 'SHOWED UP', 'Quieter']) {
    assert(!(await page.getByText(text, { exact: false }).first().isVisible().catch(() => false)), `Insights still shows "${text}"`)
  }
})

await scenario('the toggle in settings takes effect', seed(), async (page) => {
  await open(page, '/you')
  await page.getByText('Gentle mode').click()
  await page.waitForTimeout(100)
  assert((await stored(page, 'hf2-settings')).gentle === true, 'gentle not saved')
})

// ---- coming back ----

await scenario('coming back after a gap shows no debt', seed({
  history: [{ id: 'h', title: 'Old', cat: 'sprint', points: 0, minutes: 0, completedAt: daysFromNow(-9).toISOString() }],
  tasks: [
    { id: 'o', title: 'Overdue thing', cat: 'fire', bucket: 'later', due: dayKey(daysFromNow(-5)), createdAt: daysFromNow(-20).toISOString() },
    { id: 't', title: 'Small thing', cat: 'sprint', bucket: 'today', createdAt: daysFromNow(-20).toISOString() },
  ],
}), async (page) => {
  await open(page)
  await see(page, 'Good to see you')
  await see(page, 'Start with one small thing')
  await gone(page, 'slipped past', 1000)
})

// ---- calendar feed ----

const ics = (uid, summary, offsetDays) => {
  const d = dayKey(daysFromNow(offsetDays)).replaceAll('-', '')
  return `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART;VALUE=DATE:${d}\r\nSUMMARY:${summary}\r\nEND:VEVENT\r\n`
}

await scenario('connecting a feed imports what is ahead and ignores what is past', seed({ tasks: [] }), async (page) => {
  await page.route('**/feeds/calendars/**', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'text/calendar' },
      body:
        'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n' +
        ics('event-assignment-1', 'Essay draft [ENGL 1A]', 2) +
        ics('event-assignment-2', 'Old quiz [BIO 10]', -4) +
        ics('event-calendar-event-3', 'Lecture [BIO 10]', 2) +
        'END:VCALENDAR\r\n',
    })
  )
  await open(page, '/you')
  await tap(page, 'Connect')
  await page.getByPlaceholder('Paste the link here').fill('https://school.instructure.com/feeds/calendars/user_abc.ics')
  await page.getByText('Connect', { exact: true }).last().click()
  await see(page, 'Canvas connected')
  await see(page, 'Brought in 1 new')
  const tasks = await stored(page, 'hf2-tasks')
  assert(tasks.length === 1 && tasks[0].title === 'Essay draft', `imported: ${JSON.stringify(tasks)}`)
  assert(tasks[0].course === 'ENGL 1A' && tasks[0].bucket === 'later', 'wrong shape')
  assert((await stored(page, 'hf2-settings')).feedUrl.includes('instructure'), 'link not saved')

  // finished work stays gone on the next sync
  await open(page)
  await page.getByLabel(/^Later, /).click()
  await see(page, 'Essay draft')
  await open(page, '/you')
  const seen = await stored(page, 'hf2-feed-seen')
  assert(seen.includes('event-assignment-1'), 'not remembered as seen')
})

await scenario('a bad feed link explains itself and changes nothing', seed({ tasks: [] }), async (page) => {
  await open(page, '/you')
  await tap(page, 'Connect')
  await page.getByPlaceholder('Paste the link here').fill('not a link')
  await page.getByText('Connect', { exact: true }).last().click()
  await see(page, "doesn't look like a calendar link")
  assert(!(await stored(page, 'hf2-settings')).feedUrl, 'bad link was saved')
})

// ---- settings persist ----

await scenario('settings survive a restart', seed(), async (page) => {
  await open(page, '/you')
  await page.getByLabel('45 minutes').click()
  await page.getByLabel('Brown noise').click()
  await page.getByText('Sam', { exact: true }).click()
  await page.getByLabel('Your name').fill('Alex')
  await page.getByLabel('Your name').press('Enter')
  await page.reload()
  await page.waitForTimeout(800)
  const s = await stored(page, 'hf2-settings')
  assert(s.focusLen === 45 && s.sound === 'brown' && s.name === 'Alex', JSON.stringify(s))
  await see(page, 'Alex')
})

await scenario('old settings from before this version load cleanly', {
  'hf2-settings': { name: 'Old', focusLen: 15, gentle: false, reminders: true, sounds: false, onboarded: true },
}, async (page) => {
  await open(page, '/you')
  await see(page, 'Old')
  await page.waitForTimeout(200)
  await page.getByLabel('25 minutes').click()
  const s = await stored(page, 'hf2-settings')
  assert(!('reminders' in s) && !('sounds' in s), 'legacy keys were kept')
  assert(s.sound === 'off' && s.reminderHour === null, 'new settings have no defaults')
})

await scenario('a corrupt task list does not take the app down', {
  'hf2-settings': SETTINGS,
  'hf2-tasks': { not: 'a list' },
  'hf2-history': [],
}, async (page) => {
  await page.addInitScript(() => localStorage.setItem('hf2-history', '{broken json'))
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForTimeout(900)
  await see(page, 'Today')
})

// the document itself comes back 404, which is correct, and which the console reports
await scenario('an unknown route goes home', seed(), async (page) => {
  await open(page, '/nowhere/at/all')
  await see(page, 'Start one thing')
}, { allowErrors: true })

await scenario('Later shows the nearest deadline first', seed({
  tasks: [
    { id: 'u', title: 'No date at all', cat: 'sprint', bucket: 'later', createdAt: new Date().toISOString() },
    { id: 'f', title: 'Far away', cat: 'sprint', bucket: 'later', due: dayKey(daysFromNow(20)), createdAt: new Date().toISOString() },
    { id: 'n', title: 'Coming soon', cat: 'sprint', bucket: 'later', due: dayKey(daysFromNow(2)), createdAt: new Date().toISOString() },
  ],
}), async (page) => {
  await open(page)
  await page.getByLabel(/^Later, /).click()
  await see(page, 'Coming soon')
  const y = async (t) => (await page.getByText(t).first().boundingBox()).y
  assert((await y('Coming soon')) < (await y('Far away')), 'nearest deadline is not first')
  assert((await y('Far away')) < (await y('No date at all')), 'undated should come last')
})

await scenario('the session banner gives a clock time for how long is left', seed({
  focus: runningSession('t1', 'Draft intro for history essay', 'grind', { leftMs: 17 * 60 * 1000 }),
}), async (page) => {
  await open(page)
  await see(page, 'until ')
  const text = await page.getByText(/Session in progress/).first().textContent()
  assert(/until \d{1,2}:\d{2} [AP]M/.test(text), `banner said: ${text}`)
})

// ---- layout at every size that ships ----

await scenario('nothing overflows on the smallest phones', seed(), async (page) => {
  for (const [w, h] of [[320, 568], [375, 667], [440, 956]]) {
    await page.setViewportSize({ width: w, height: h })
    for (const path of ['/', '/calendar', '/insights', '/you', '/dump', '/triage', '/debrief', '/task/t1']) {
      await open(page, path)
      const over = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const offenders = []
        for (const el of document.querySelectorAll('div, input, textarea')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (getComputedStyle(el).position === 'fixed') continue
          if (r.right > vw + 1 || r.left < -1) offenders.push(`${Math.round(r.left)}..${Math.round(r.right)} "${(el.textContent ?? '').slice(0, 28)}"`)
        }
        return offenders.slice(0, 3)
      })
      assert(over.length === 0, `${w}x${h} ${path}: ${over.join('; ')}`)
    }
  }
})

await scenario('screens that do not scroll still fit on the smallest phones', seed({
  focus: runningSession('t1', 'Draft intro for history essay', 'grind', { leftMs: 1500 }),
}), async (page) => {
  const clipped = () =>
    page.evaluate(() => {
      const vh = document.documentElement.clientHeight
      const out = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let n
      while ((n = walker.nextNode())) {
        const text = n.textContent.trim()
        if (!text) continue
        const r = n.parentElement.getBoundingClientRect()
        if (r.width && r.height && r.bottom > vh + 1 && getComputedStyle(n.parentElement).visibility !== 'hidden') {
          out.push(`"${text.slice(0, 24)}" ends at ${Math.round(r.bottom)} of ${vh}`)
        }
      }
      return out.slice(0, 3)
    })
  await page.setViewportSize({ width: 320, height: 568 })
  await open(page, '/focus')
  // the seeded clock runs out here, which leaves the recap asking its question
  await see(page, 'Did you finish it?', 8000)
  await page.waitForTimeout(500)
  let over = await clipped()
  assert(over.length === 0, `recap at 320x568: ${over.join('; ')}`)
  await tap(page, 'Not yet')
  await see(page, 'Start one thing')
  await page.getByText('Start one thing').first().click()
  await see(page, 'FOCUSING ON')
  await page.waitForTimeout(300)
  over = await clipped()
  assert(over.length === 0, `focus at 320x568: ${over.join('; ')}`)
  await open(page, '/triage')
  await page.waitForTimeout(300)
  over = await clipped()
  assert(over.length === 0, `triage at 320x568: ${over.join('; ')}`)
})

await browser.close()
console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
