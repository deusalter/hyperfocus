// App Store screenshots, composed with a caption and a phone frame.
//
// From real iOS captures (preferred). Download what the simulator workflow took:
//   gh run download <run id> -p 'sim-store-*' -D /tmp/store-raw
//   npm run screenshots -- --raw /tmp/store-raw
// That reads sim-store-6.9/store-6.9/<id>.png and the 6.3 equivalent.
//
// Or from the web build, when no simulator run is handy:
//   npx expo start --web --port 8099   (in another terminal)
//   npm run screenshots
//
// Writes to store/screenshots/<size>/. JPEG because App Store Connect rejects any
// PNG with an alpha channel, and this is much smaller at no visible cost.

import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { HISTORY, TASKS, daysFromNow, dayKey, freezeTime, runningSession, seed } from './seed.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.E2E_URL ?? 'http://localhost:8099'

// a Tuesday morning, so the greeting and the week read naturally
const NOW = new Date('2026-11-10T09:41:00')
freezeTime(NOW)

/** Required sizes: Apple scales these down for smaller phones. */
const SIZES = [
  { name: '6.9-inch', width: 1320, height: 2868, group: 'store-6.9' },
  { name: '6.3-inch', width: 1206, height: 2622, group: 'store-6.3' },
]

const rawIndex = process.argv.indexOf('--raw')
const RAW = rawIndex > 0 ? process.argv[rawIndex + 1] : null

/** A real capture for this shot and size, or null. */
function rawCapture(shot, size) {
  if (!RAW) return null
  const file = join(RAW, `sim-${size.group}`, size.group, `${shot.id}.png`)
  return existsSync(file) ? readFileSync(file).toString('base64') : null
}

// iPhone 16 Pro in points. The app renders between the status bar and home indicator.
const SCREEN = { width: 402, height: 874, top: 59, bottom: 34 }

/** Extra completions earlier today, on top of the standard history. */
const today = (...items) =>
  items.map(([title, cat, minutes], i) => ({
    id: `today${i}`,
    title,
    cat,
    points: 0,
    minutes,
    completedAt: daysFromNow(0, 8).toISOString(),
  }))

const SHOTS = [
  {
    id: '01-race',
    title: 'Race your past self',
    sub: 'Made for ADHD brains. No streak to lose, and the target is a typical day.',
    path: '/',
    state: () => seed({ history: [...today(['Laundry', 'sprint', 0], ['Reply to coach', 'sprint', 0]), ...HISTORY()] }),
  },
  {
    id: '02-focus',
    title: 'One tap to start',
    sub: 'The app picks the task. The focus timer tells you when time is up.',
    path: '/focus',
    state: () =>
      seed({
        focus: runningSession('t1', 'Draft intro for history essay', 'grind', {
          leftMs: 17 * 60 * 1000,
        }),
        settings: { sound: 'brown' },
      }),
  },
  {
    id: '03-dump',
    title: 'Brain dump in seconds',
    sub: 'Get it out of your head first. Sort it later.',
    path: '/dump',
    state: () =>
      seed({
        tasks: [
          ...['Text Maya back', 'Look up dentist hours', 'Return the library books', 'Figure out summer job thing', 'Buy shampoo'].map(
            (title, i) => ({
              id: `i${i}`,
              title,
              bucket: 'inbox',
              createdAt: daysFromNow(0, 9).toISOString(),
            })
          ),
        ],
      }),
    act: async (page) => {
      await page.getByPlaceholder("What's on your mind?").blur()
    },
  },
  {
    id: '04-triage',
    title: 'Sort it with a swipe',
    sub: 'Today, Later, or let it go. Then you only have to look at Today.',
    path: '/triage',
    // caught mid-swipe, so the picture explains the gesture
    act: async (page) => {
      const card = await page.getByText('Text Maya back').first().boundingBox()
      const x = card.x + card.width / 2
      const y = card.y + card.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      for (const dx of [20, 45, 70, 92]) {
        await page.mouse.move(x + dx, y)
        await page.waitForTimeout(30)
      }
      await page.waitForTimeout(150)
    },
  },
  {
    id: '05-recap',
    title: 'Starting counts',
    sub: 'Every start earns points, so a scattered day still adds up.',
    path: '/focus',
    // a full session, finished with moments to spare, on a day that passes typical
    state: () =>
      seed({
        focus: runningSession('t3', 'Clear the desk', 'sprint', { leftMs: 5000 }),
        history: [...today(['Reply to coach', 'fire', 15]), ...HISTORY()],
      }),
    act: async (page) => {
      await page.getByLabel('Done with Clear the desk').click()
      await page.getByText('SESSION COMPLETE').first().waitFor({ timeout: 6000 })
      await page.waitForTimeout(1250)
    },
  },
  {
    id: '06-calendar',
    title: 'Assignments, no typing',
    sub: "Connect your school's calendar link and what's due shows up on its day.",
    path: '/calendar',
    state: () =>
      seed({
        tasks: [
          ...TASKS(),
          {
            id: 'c1',
            title: 'Reading response 4',
            cat: 'grind',
            bucket: 'later',
            due: dayKey(daysFromNow(0)),
            course: 'ENGL 1A',
            source: 'canvas',
            externalId: 'event-assignment-2',
            createdAt: daysFromNow(-4).toISOString(),
          },
        ],
      }),
  },
  {
    id: '07-insights',
    title: 'See what your week held',
    sub: 'Quiet days are allowed. Days you showed up only ever count up.',
    path: '/insights',
  },
]

const font = (rel) =>
  readFileSync(join(ROOT, 'node_modules/@expo-google-fonts/hanken-grotesk', rel)).toString('base64')
const FONT_800 = font('800ExtraBold/HankenGrotesk_800ExtraBold.ttf')
const FONT_500 = font('500Medium/HankenGrotesk_500Medium.ttf')
const FONT_600 = font('600SemiBold/HankenGrotesk_600SemiBold.ttf')

function statusBar() {
  return `
    <div style="position:absolute;top:0;left:0;right:0;height:${SCREEN.top}px;background:#eef0f0;color:#1d2023">
      <div style="position:absolute;left:52px;top:18px;font:600 17px/22px Hanken">9:41</div>
      <div style="position:absolute;left:138px;top:11px;width:126px;height:37px;border-radius:19px;background:#000"></div>
      <svg style="position:absolute;right:26px;top:21px" width="78" height="14" viewBox="0 0 78 14" fill="#1d2023">
        <rect x="0" y="9" width="3.2" height="4.5" rx="1"/><rect x="4.8" y="6.5" width="3.2" height="7" rx="1"/>
        <rect x="9.6" y="4" width="3.2" height="9.5" rx="1"/><rect x="14.4" y="1" width="3.2" height="12.5" rx="1"/>
        <path d="M31 3.2c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 31 1.5c-2.7 0-5.2 1.1-7.1 2.9L25 5.6c1.6-1.5 3.7-2.4 6-2.4zm0 3.7c1.3 0 2.5.5 3.4 1.3l1.2-1.2A6.6 6.6 0 0 0 31 5.2c-1.8 0-3.4.7-4.6 1.8l1.2 1.2c.9-.8 2.1-1.3 3.4-1.3zm0 3.6c-.7 0-1.2.3-1.6.7l1.6 1.6 1.6-1.6c-.4-.4-.9-.7-1.6-.7z"/>
        <rect x="47.5" y="1" width="25" height="12.5" rx="3.6" fill="none" stroke="#1d2023" stroke-opacity=".4"/>
        <rect x="49.2" y="2.7" width="21.6" height="9.1" rx="2.2"/>
        <rect x="73.6" y="5" width="1.8" height="4.5" rx=".9" fill-opacity=".45"/>
      </svg>
    </div>`
}

function compose(shot, image, size, real = false) {
  const k = size.width / 1320
  const phoneW = 1060
  const scale = phoneW / SCREEN.width
  // a real capture already has the status bar and home indicator, at its own aspect
  const phoneH = real ? phoneW * (size.height / size.width) : SCREEN.height * scale
  return `<!doctype html><html><head><style>
    @font-face { font-family: Hanken; font-weight: 800; src: url(data:font/ttf;base64,${FONT_800}); }
    @font-face { font-family: Hanken; font-weight: 600; src: url(data:font/ttf;base64,${FONT_600}); }
    @font-face { font-family: Hanken; font-weight: 500; src: url(data:font/ttf;base64,${FONT_500}); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${size.width}px; height: ${size.height}px; overflow: hidden; }
    .canvas {
      width: 1320px; height: 2868px; position: relative; overflow: hidden;
      transform: scale(${k}); transform-origin: 0 0;
      background: linear-gradient(160deg, #54799f 0%, #456a90 42%, #35526f 100%);
    }
    h1 { position: absolute; left: 90px; right: 90px; top: 118px; text-align: center; color: #fff;
         font: 800 104px/1.08 Hanken; letter-spacing: -2.5px; }
    p { position: absolute; left: 130px; right: 130px; top: 250px; text-align: center; color: rgba(255,255,255,.88);
        font: 500 50px/1.28 Hanken; letter-spacing: -.3px; }
    .phone { position: absolute; left: ${(1320 - phoneW) / 2}px; top: 480px; width: ${phoneW}px; height: ${phoneH}px;
             border-radius: ${58 * scale}px; box-shadow: 0 0 0 ${3.4 * scale}px #14171a, 0 44px 110px rgba(10,20,35,.42); overflow: hidden; }
    .screen { position: absolute; left: 0; top: 0; width: ${SCREEN.width}px; height: ${SCREEN.height}px;
              transform: scale(${scale}); transform-origin: 0 0; background: #eef0f0; }
    .app { position: absolute; left: 0; top: ${SCREEN.top}px; width: ${SCREEN.width}px; height: ${SCREEN.height - SCREEN.top - SCREEN.bottom}px; }
    .home { position: absolute; left: 134px; bottom: 8px; width: 134px; height: 5px; border-radius: 3px; background: #1d2023; }
  </style></head><body><div class="canvas">
    <h1>${shot.title}</h1>
    <p>${shot.sub}</p>
    <div class="phone">${
      real
        ? `<img src="data:image/png;base64,${image}" style="width:100%;height:100%;display:block">`
        : `<div class="screen">
            ${statusBar()}
            <img class="app" src="data:image/png;base64,${image}">
            <div class="home"></div>
          </div>`
    }</div>
  </div></body></html>`
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })

async function capture(shot) {
  const ctx = await browser.newContext({
    viewport: { width: SCREEN.width, height: SCREEN.height - SCREEN.top - SCREEN.bottom },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  })
  const page = await ctx.newPage()
  await page.clock.setFixedTime(NOW)
  await page.addInitScript((data) => {
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, JSON.stringify(v))
  }, shot.state ? shot.state() : seed())
  await page.goto(BASE + shot.path, { waitUntil: 'load', timeout: 180000 })
  await page.waitForTimeout(shot.wait ?? 1500)
  if (shot.act) await shot.act(page)
  const buffer = await page.screenshot()
  await ctx.close()
  return buffer.toString('base64')
}

for (const shot of SHOTS) {
  // the web render is only needed if some size has no real capture
  const web = SIZES.every((size) => rawCapture(shot, size)) ? null : await capture(shot)
  for (const size of SIZES) {
    const real = rawCapture(shot, size)
    const image = real ?? web
    const dir = join(ROOT, 'store/screenshots', size.name)
    mkdirSync(dir, { recursive: true })
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await page.setContent(compose(shot, image, size, !!real), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(150)
    await page.screenshot({ path: join(dir, `${shot.id}.jpg`), type: 'jpeg', quality: 92 })
    await ctx.close()
  }
  console.log('wrote', shot.id, RAW ? '(real captures where available)' : '(web build)')
}

await browser.close()
