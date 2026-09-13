import { expect, test } from '@playwright/test'

test('connects the bottleneck controls, playback, and spectrum in a real browser', async ({
  page,
}) => {
  const browserIssues: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserIssues.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => browserIssues.push(`pageerror: ${error.message}`))

  await page.goto('/')

  await expect(page.getByRole('heading', {
    name: /structure shapes how signals move/i,
  })).toBeVisible()
  await expect(page.getByText(/numerical engine ready/i)).toBeVisible()

  const spectrumStatus = page.locator('.spectrum-status')
  await expect(spectrumStatus).toContainText(/algebraic connectivity λ₂/i)
  const initialSpectrumStatus = await spectrumStatus.textContent()

  await page.getByRole('combobox', { name: /heat source/i }).selectOption('right-2')
  await expect(page.locator('.network-summary')).toContainText(/source right-2/i)

  await page.getByRole('slider', { name: /bridge strength/i }).fill('1.5')
  await expect(page.locator('output[for="bridge-strength"]')).toHaveText('1.50')
  await expect(page.getByRole('heading', {
    name: /bridge is no longer the weakest edge/i,
  })).toBeVisible()
  await expect.poll(() => spectrumStatus.textContent()).not.toBe(initialSpectrumStatus)

  const timeline = page.getByRole('slider', { name: /simulation time/i })
  await page.getByRole('button', { name: /^play$/i }).click()
  await expect(page.getByRole('button', { name: /^pause$/i })).toBeVisible()
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(0)
  await page.getByRole('button', { name: /^pause$/i }).click()

  expect(browserIssues).toEqual([])
})
