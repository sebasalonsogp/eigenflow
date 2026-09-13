import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ANALYSIS_FIXTURE } from '../test/analysisFixture'
import { InsightPanel } from './InsightPanel'

test('separates the computed observation, interpretation, verification, and limitation', () => {
  render(<InsightPanel analysis={ANALYSIS_FIXTURE} bridgeWeight={0.1} />)

  expect(screen.getByRole('heading', { name: /one weak edge sets the pace/i })).toBeVisible()
  expect(screen.getByText('Observation')).toBeVisible()
  expect(screen.getByText(/bridge weight 0.10/i)).toBeVisible()
  expect(screen.getByText('Mathematical interpretation')).toBeVisible()
  expect(screen.getByText(/backend reports λ₂ = 2.000/i)).toBeVisible()
  expect(screen.getByText('Numerical check')).toBeVisible()
  expect(screen.getByText(/floating-point consistency, not model fit/i)).toBeVisible()
  expect(screen.getByText(/early-time heat patterns/i)).toBeVisible()
})
