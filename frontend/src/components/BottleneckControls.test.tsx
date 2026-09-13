import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { BottleneckControls } from './BottleneckControls'

test('exposes source and bridge controls with current values and reset behavior', () => {
  const onHeatSourceChange = vi.fn()
  const onBridgeWeightChange = vi.fn()
  const onReset = vi.fn()

  render(
    <BottleneckControls
      nodeIds={['left-0', 'right-0']}
      heatSource="right-0"
      bridgeWeight={0.8}
      defaultHeatSource="left-0"
      control={{
        kind: 'bridge-strength',
        label: 'Connection weight',
        minimum: 0.2,
        maximum: 1.8,
        step: 0.2,
        defaultValue: 0.2,
        minimumLabel: 'Sparse',
        maximumLabel: 'Dense',
      }}
      onHeatSourceChange={onHeatSourceChange}
      onBridgeWeightChange={onBridgeWeightChange}
      onReset={onReset}
    />,
  )

  const source = screen.getByRole('combobox', { name: /heat source/i })
  const bridge = screen.getByRole('slider', { name: /connection weight/i })
  expect(source).toHaveValue('right-0')
  expect(bridge).toHaveValue('0.8')
  expect(bridge).toHaveAttribute('min', '0.2')
  expect(bridge).toHaveAttribute('max', '1.8')
  expect(bridge).toHaveAttribute('step', '0.2')
  expect(screen.getByText('0.80')).toBeVisible()
  expect(screen.getByText('Sparse')).toBeVisible()
  expect(screen.getByText('Dense')).toBeVisible()

  fireEvent.change(source, { target: { value: 'left-0' } })
  fireEvent.change(bridge, { target: { value: '1.25' } })
  fireEvent.click(screen.getByRole('button', { name: /reset experiment/i }))

  expect(onHeatSourceChange).toHaveBeenCalledWith('left-0')
  expect(onBridgeWeightChange).toHaveBeenCalledWith(1.25)
  expect(onReset).toHaveBeenCalledOnce()
})
