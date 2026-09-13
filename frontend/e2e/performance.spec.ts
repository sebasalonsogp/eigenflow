import { expect, test } from '@playwright/test'
import type { AnalysisRequest, AnalysisResponse } from '../src/api'

const FRAME_SAMPLE_MS = 2_000

test('records supported-boundary interaction and animation performance', async ({
  browser,
  browserName,
  page,
  request,
}, testInfo) => {
  const browserIssues: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserIssues.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => browserIssues.push(`pageerror: ${error.message}`))

  const response = await request.post('http://127.0.0.1:8000/api/analysis', {
    data: createSupportedBoundaryRequest(),
  })
  expect(response.ok()).toBe(true)
  const analysis = await response.json() as AnalysisResponse

  await page.route('**/api/analysis', (route) => route.fulfill({
    body: JSON.stringify(analysis),
    contentType: 'application/json',
    status: 200,
  }))
  await page.goto('/')

  await expect(page.getByRole('img', {
    name: /heat diffusion across 30 graph nodes/i,
  })).toBeVisible()

  const interactionStarted = await page.evaluate(() => performance.now())
  await page.getByRole('slider', { name: /bridge strength/i }).fill('1.5')
  await expect(page.locator('output[for="bridge-strength"]')).toHaveText('1.50')
  const interactionMs = await page.evaluate(
    (started) => performance.now() - started,
    interactionStarted,
  )

  const timeline = page.getByRole('slider', { name: /simulation time/i })
  await page.getByRole('button', { name: /^play$/i }).click()

  // rAF timestamps expose repaint cadence without mutating application state.
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
  const frameIntervals = await page.evaluate((durationMs) => new Promise<number[]>((resolve) => {
    const intervals: number[] = []
    let started: number | undefined
    let previous: number | undefined

    const sample = (timestamp: number) => {
      if (started === undefined || previous === undefined) {
        started = timestamp
      } else {
        intervals.push(timestamp - previous)
      }
      previous = timestamp

      if (timestamp - started < durationMs) {
        requestAnimationFrame(sample)
      } else {
        resolve(intervals)
      }
    }

    requestAnimationFrame(sample)
  }), FRAME_SAMPLE_MS)

  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(0)
  await page.getByRole('button', { name: /^pause$/i }).click()

  const orderedIntervals = [...frameIntervals].sort((left, right) => left - right)
  const frameP95Ms = orderedIntervals[Math.ceil(orderedIntervals.length * 0.95) - 1]
  const maximumFrameMs = orderedIntervals.at(-1) ?? 0
  const slowFrameShare = frameIntervals.filter((interval) => interval > 34).length
    / frameIntervals.length
  const averageFrameMs = frameIntervals.reduce((sum, interval) => sum + interval, 0)
    / frameIntervals.length
  const metrics = {
    environment: {
      browser: browserName,
      browserVersion: browser.version(),
      viewport: page.viewportSize(),
    },
    boundary: { nodes: 30, edges: 435, timeSamples: 240 },
    interactionMs: round(interactionMs),
    animation: {
      sampleDurationMs: FRAME_SAMPLE_MS,
      sampledFrames: frameIntervals.length,
      averageFps: round(1_000 / averageFrameMs),
      frameP95Ms: round(frameP95Ms),
      maximumFrameMs: round(maximumFrameMs),
      framesOver34MsPercent: round(slowFrameShare * 100),
    },
  }

  console.log(`[performance] ${JSON.stringify(metrics)}`)
  await testInfo.attach('supported-boundary-performance', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  })

  expect(frameIntervals.length).toBeGreaterThan(30)
  expect(browserIssues).toEqual([])
})

function createSupportedBoundaryRequest(): AnalysisRequest {
  const nodeIds = Array.from({ length: 30 }, (_, index) => `node-${index}`)
  return {
    nodes: nodeIds.map((id) => ({ id })),
    edges: nodeIds.flatMap((source, sourceIndex) => nodeIds
      .slice(sourceIndex + 1)
      .map((target, targetOffset) => ({
        source,
        target,
        weight: 1 + ((sourceIndex + sourceIndex + targetOffset + 1) % 7) * 0.05,
      }))),
    heatSource: nodeIds[0],
    times: Array.from({ length: 240 }, (_, index) => 8 * index / 239),
    diffusionCoefficient: 1,
  }
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000
}
