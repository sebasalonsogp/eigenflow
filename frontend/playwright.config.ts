import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)
const externalBaseURL = process.env.EIGENFLOW_E2E_BASE_URL
const frontendBaseURL = externalBaseURL ?? 'http://127.0.0.1:4173'
const apiPort = process.env.EIGENFLOW_E2E_API_PORT ?? '8000'
const apiBaseURL = `http://127.0.0.1:${apiPort}`
const pythonExecutable = process.platform === 'win32'
  ? '.venv\\Scripts\\python.exe'
  : '.venv/bin/python'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : 'line',
  use: {
    baseURL: frontendBaseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      name: 'Python API',
      command: `${pythonExecutable} -m uvicorn eigenflow_api.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: '../backend',
      url: `${apiBaseURL}/api/health`,
      reuseExistingServer: Boolean(externalBaseURL) || !isCI,
      timeout: 120_000,
      stdout: 'pipe',
    },
    ...(externalBaseURL ? [] : [{
      name: 'Vite frontend',
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      env: { EIGENFLOW_API_URL: apiBaseURL },
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'pipe' as const,
    }]),
  ],
})
