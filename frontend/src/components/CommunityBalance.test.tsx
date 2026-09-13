import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { CommunityBalance } from './CommunityBalance'

const NODE_ORDER = ['left-0', 'left-1', 'right-0', 'right-1']

test('makes cross-bridge heat visible without relying on node color', () => {
  render(
    <CommunityBalance
      nodeOrder={NODE_ORDER}
      state={[0.4, 0.35, 0.15, 0.1]}
      sourceId="left-0"
      announceChanges
    />,
  )

  expect(screen.getByRole('region', { name: /community heat balance/i })).toBeVisible()
  expect(screen.getByText('Left cluster').parentElement).toHaveTextContent('75.0%')
  expect(screen.getByText('Right cluster').parentElement).toHaveTextContent('25.0%')
  expect(screen.getByRole('img', {
    name: /left cluster holds 75.0%. right cluster holds 25.0%/i,
  })).toBeVisible()
  expect(screen.getByText('Across the bridge').parentElement).toHaveTextContent('25.0%')
  expect(screen.getByText('25.0%', { selector: 'output' })).toHaveAttribute(
    'aria-live',
    'polite',
  )
})

test('measures crossed heat relative to a source on the right', () => {
  render(
    <CommunityBalance
      nodeOrder={NODE_ORDER}
      state={[0.1, 0.2, 0.3, 0.4]}
      sourceId="right-0"
      announceChanges={false}
    />,
  )

  expect(screen.getByText('Across the bridge').parentElement).toHaveTextContent('30.0%')
  expect(screen.getByText('30.0%', { selector: 'output' })).toHaveAttribute(
    'aria-live',
    'off',
  )
})
