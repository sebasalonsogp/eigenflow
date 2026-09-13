import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PATH_COMPLETE_EXPERIMENT } from '../experiments/pathComplete'
import { ANALYSIS_FIXTURE } from '../test/analysisFixture'
import { ComparisonInsightPanel } from './ComparisonInsightPanel'

test('presents the computed topology observation and controlled takeaway', () => {
  render(
    <ComparisonInsightPanel
      analysis={{
        ...ANALYSIS_FIXTURE,
        spectrum: {
          ...ANALYSIS_FIXTURE.spectrum,
          algebraicConnectivity: 0.268,
        },
      }}
      topology="path"
      takeaway={PATH_COMPLETE_EXPERIMENT.takeaway}
    />,
  )

  expect(screen.getByRole('heading', { name: /local links make distance matter/i })).toBeVisible()
  expect(screen.getByText(/λ₂ = 0.268/i)).toBeVisible()
  expect(screen.getByText(/topology—not graph size/i)).toBeVisible()
  expect(screen.getByText(/same six nodes and source/i)).toBeVisible()
})
