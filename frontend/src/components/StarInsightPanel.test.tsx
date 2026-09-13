import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { STAR_EXPERIMENT } from '../experiments/star'
import { ANALYSIS_FIXTURE } from '../test/analysisFixture'
import { StarInsightPanel } from './StarInsightPanel'

test('presents source position without claiming the graph spectrum changed', () => {
  render(
    <StarInsightPanel
      analysis={{
        ...ANALYSIS_FIXTURE,
        spectrum: {
          ...ANALYSIS_FIXTURE.spectrum,
          algebraicConnectivity: 1,
        },
      }}
      heatSource="leaf-0"
      takeaway={STAR_EXPERIMENT.takeaway}
    />,
  )

  expect(screen.getByRole('heading', {
    name: /a leaf creates a directional transient/i,
  })).toBeVisible()
  expect(screen.getByText(/does not change the spectrum/i)).toBeVisible()
  expect(screen.getByText(/same graph and heat amount/i)).toBeVisible()
  expect(screen.getByText(/continuous heat diffusion/i)).toBeVisible()
})
