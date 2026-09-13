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
      onHeatSourceChange={onHeatSourceChange}
      onBridgeWeightChange={onBridgeWeightChange}
      onReset={onReset}
    />,
  )

  const source = screen.getByRole('combobox', { name: /heat source/i })
  const bridge = screen.getByRole('slider', { name: /bridge strength/i })
  expect(source).toHaveValue('right-0')
  expect(bridge).toHaveValue('0.8')
  expect(bridge).toHaveAttribute('min', '0.05')
  expect(bridge).toHaveAttribute('max', '2')
  expect(bridge).toHaveAttribute('step', '0.05')
  expect(screen.getByText('0.80')).toBeVisible()

  fireEvent.change(source, { target: { value: 'left-0' } })
  fireEvent.change(bridge, { target: { value: '1.25' } })
  fireEvent.click(screen.getByRole('button', { name: /reset experiment/i }))

  expect(onHeatSourceChange).toHaveBeenCalledWith('left-0')
  expect(onBridgeWeightChange).toHaveBeenCalledWith(1.25)
  expect(onReset).toHaveBeenCalledOnce()
})
