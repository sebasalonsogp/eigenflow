import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const captureUrl = process.env.EIGENFLOW_CAPTURE_URL ?? 'http://127.0.0.1:8000'
const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryDirectory = path.resolve(frontendDirectory, '..')
const mediaDirectory = path.join(repositoryDirectory, 'docs', 'media')
const temporaryDirectory = path.join(frontendDirectory, 'test-results', 'portfolio-media')
const screenshotPath = path.join(mediaDirectory, 'eigenflow-bottleneck.png')
const fiedlerScreenshotPath = path.join(mediaDirectory, 'eigenflow-fiedler.png')
const videoPath = path.join(mediaDirectory, 'eigenflow-demo.webm')

await rm(temporaryDirectory, { recursive: true, force: true })
await mkdir(temporaryDirectory, { recursive: true })
await mkdir(mediaDirectory, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  colorScheme: 'dark',
  recordVideo: {
    dir: temporaryDirectory,
    size: { width: 1440, height: 1000 },
  },
  reducedMotion: 'no-preference',
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const capturedVideo = page.video()
const browserIssues = []
let captureError

page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') {
    browserIssues.push(`${message.type()}: ${message.text()}`)
  }
})
page.on('pageerror', (error) => browserIssues.push(`pageerror: ${error.message}`))
page.on('requestfailed', (request) => {
  browserIssues.push(`requestfailed: ${request.method()} ${request.url()}`)
})

try {
  const response = await page.goto(captureUrl, { waitUntil: 'networkidle' })
  if (!response?.ok()) {
    throw new Error(`Eigenflow returned HTTP ${response?.status() ?? 'unknown'}`)
  }

  await page.getByText('Numerical engine ready', { exact: true }).waitFor()
  await page.getByRole('img', {
    name: /heat diffusion across 8 graph nodes/i,
  }).waitFor()

  const timeline = page.getByRole('slider', { name: /simulation time/i })
  await timeline.fill('1.5')
  await page.locator('output[for="simulation-time"]').filter({ hasText: 't = 1.50' }).waitFor()
  await page.waitForTimeout(800)
  await page.locator('.hero-copy').click({ position: { x: 24, y: 24 } })
  await page.screenshot({ fullPage: true, path: screenshotPath })

  await page.getByRole('button', { name: /reset timeline/i }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: /^play$/i }).click()
  await page.waitForTimeout(3_000)
  await page.getByRole('button', { name: /^pause$/i }).click()
  await page.waitForTimeout(700)

  await page.getByRole('button', { name: /fiedler partition/i }).click()
  await page.locator('.partition-membership').waitFor()
  await page.waitForTimeout(700)
  await page.locator('.hero-copy').click({ position: { x: 24, y: 24 } })
  await page.locator('.experiment-panel').screenshot({ path: fiedlerScreenshotPath })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /heat diffusion/i }).click()

  await page.getByRole('slider', { name: /bridge strength/i }).fill('1.5')
  await page.locator('output[for="bridge-strength"]').filter({ hasText: '1.50' }).waitFor()
  await page.getByRole('heading', {
    name: /bridge is no longer the weakest edge/i,
  }).waitFor()
  await page.waitForTimeout(1_500)

  await page.getByRole('button', { name: /^play$/i }).click()
  await page.waitForTimeout(2_500)
  await page.getByRole('button', { name: /^pause$/i }).click()
  await page.locator('.insight-panel').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1_500)

  if (browserIssues.length > 0) {
    throw new Error(`Browser issues detected:\n${browserIssues.join('\n')}`)
  }
} catch (error) {
  captureError = error
} finally {
  await context.close()
  await browser.close()
}

try {
  if (captureError) throw captureError
  if (!capturedVideo) throw new Error('Playwright did not create a video recording')
  await copyFile(await capturedVideo.path(), videoPath)
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}

const screenshotSize = (await stat(screenshotPath)).size
const fiedlerScreenshotSize = (await stat(fiedlerScreenshotPath)).size
const videoSize = (await stat(videoPath)).size
console.log(`Captured ${path.relative(repositoryDirectory, screenshotPath)} (${screenshotSize} bytes)`)
console.log(`Captured ${path.relative(repositoryDirectory, fiedlerScreenshotPath)} (${fiedlerScreenshotSize} bytes)`)
console.log(`Captured ${path.relative(repositoryDirectory, videoPath)} (${videoSize} bytes)`)
