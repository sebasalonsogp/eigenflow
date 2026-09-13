import { describe, expect, it } from 'vitest'
import { buildBottleneckInsight } from './insights'
import { ANALYSIS_FIXTURE } from './test/analysisFixture'

function insightFor(bridgeWeight: number, algebraicConnectivity: number) {
  return buildBottleneckInsight({
    bridgeWeight,
    spectrum: {
      ...ANALYSIS_FIXTURE.spectrum,
      eigenvalues: [0, algebraicConnectivity],
      algebraicConnectivity,
    },
    diagnostics: ANALYSIS_FIXTURE.diagnostics,
  })
}

describe('buildBottleneckInsight', () => {
  it('describes a weak bridge as a pronounced bottleneck', () => {
    const insight = insightFor(0.1, 0.05)

    expect(insight.regime).toBe('weak')
    expect(insight.headline).toBe('One weak edge sets the pace.')
    expect(insight.observation).toMatch(/pronounced structural bottleneck/i)
    expect(insight.interpretation).toContain('λ₂ = 0.050')
  })

  it('describes a bridge near the internal edge scale as less dominant', () => {
    const insight = insightFor(0.8, 0.3)

    expect(insight.regime).toBe('balanced')
    expect(insight.observation).toMatch(/bottleneck is less dominant/i)
    expect(insight.interpretation).toContain('λ₂ = 0.300')
  })

  it('describes a bridge above the internal edge scale without claiming no cut exists', () => {
    const insight = insightFor(1.5, 0.6)

    expect(insight.regime).toBe('strong')
    expect(insight.observation).toMatch(/still a single cut edge/i)
    expect(insight.observation).toMatch(/less restrictive/i)
    expect(insight.interpretation).toContain('λ₂ = 0.600')
  })

  it('distinguishes numerical diagnostics from evidence of model fit', () => {
    const insight = insightFor(0.1, 0.05)

    expect(insight.verification).toMatch(/floating-point consistency/i)
    expect(insight.verification).toMatch(/not model fit/i)
    expect(insight.limitation).toMatch(/source and higher modes/i)
  })
})
