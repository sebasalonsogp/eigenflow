import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ANALYSIS_FIXTURE } from '../test/analysisFixture'
import { SpectrumView } from './SpectrumView'

test('renders the ordered spectrum with a meaningful lambda two emphasis', () => {
  const { container } = render(<SpectrumView spectrum={ANALYSIS_FIXTURE.spectrum} />)

  expect(screen.getByRole('heading', { name: /laplacian spectrum/i })).toBeVisible()
  expect(screen.getByRole('img', { name: /ordered laplacian spectrum/i })).toHaveAttribute(
    'tabindex',
    '0',
  )
  const values = screen.getByRole('list', { name: /ordered laplacian eigenvalues/i })
  expect(within(values).getByText('2.000')).toBeVisible()
  expect(container.querySelector('[data-spectrum-index="1"]')).toHaveAttribute(
    'data-emphasis',
    'lambda-2',
  )
  expect(screen.getByText(/algebraic connectivity λ₂ = 2.000/i)).toBeVisible()
})

test('describes disconnected zero modes without presenting lambda two as connectivity', () => {
  const { container } = render(
    <SpectrumView
      spectrum={{
        ...ANALYSIS_FIXTURE.spectrum,
        eigenvalues: [0, 0, 2, 2],
        eigenvectors: [
          [Math.SQRT1_2, 0, Math.SQRT1_2, 0],
          [Math.SQRT1_2, 0, -Math.SQRT1_2, 0],
          [0, Math.SQRT1_2, 0, Math.SQRT1_2],
          [0, Math.SQRT1_2, 0, -Math.SQRT1_2],
        ],
        residualNorms: [0, 0, 0, 0],
        zeroEigenvalueMultiplicity: 2,
        algebraicConnectivity: 0,
        degenerateEigenspaces: [
          { eigenvalue: 0, indices: [0, 1], multiplicity: 2 },
          { eigenvalue: 2, indices: [2, 3], multiplicity: 2 },
        ],
      }}
    />,
  )

  expect(screen.getByText(/2 zero modes · graph disconnected/i)).toBeVisible()
  expect(container.querySelector('[data-emphasis="lambda-2"]')).not.toBeInTheDocument()
})

test('handles a graph with no second eigenvalue', () => {
  render(
    <SpectrumView
      spectrum={{
        ...ANALYSIS_FIXTURE.spectrum,
        eigenvalues: [0],
        eigenvectors: [[1]],
        residualNorms: [0],
        zeroEigenvalueMultiplicity: 1,
        algebraicConnectivity: null,
      }}
    />,
  )

  expect(screen.getByText(/one-node graph · λ₂ is not defined/i)).toBeVisible()
})
