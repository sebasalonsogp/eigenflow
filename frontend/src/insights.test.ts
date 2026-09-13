import { describe, expect, it } from 'vitest'
import {
  buildBottleneckInsight,
  buildStarInsight,
  buildTopologyComparisonInsight,
} from './insights'
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

describe('buildTopologyComparisonInsight', () => {
  it('connects the path spectral gap to slow long-distance mixing', () => {
    const insight = buildTopologyComparisonInsight({
      topology: 'path',
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        algebraicConnectivity: 0.268,
      },
      diagnostics: ANALYSIS_FIXTURE.diagnostics,
    })

    expect(insight.headline).toBe('Local links make distance matter.')
    expect(insight.observation).toMatch(/λ₂ = 0.268/i)
    expect(insight.interpretation).toMatch(/slow long-distance mixing/i)
  })

  it('connects complete connectivity to the larger spectral gap', () => {
    const insight = buildTopologyComparisonInsight({
      topology: 'complete',
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        algebraicConnectivity: 6,
      },
      diagnostics: ANALYSIS_FIXTURE.diagnostics,
    })

    expect(insight.headline).toBe('Every node talks to every other.')
    expect(insight.observation).toMatch(/λ₂ = 6.000/i)
    expect(insight.interpretation).toMatch(/rapid global mixing/i)
  })
})

describe('buildStarInsight', () => {
  it('explains the hub as a symmetric initial condition', () => {
    const insight = buildStarInsight({
      heatSource: 'hub',
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        algebraicConnectivity: 1,
      },
      diagnostics: ANALYSIS_FIXTURE.diagnostics,
    })

    expect(insight.headline).toBe('The hub spreads heat symmetrically.')
    expect(insight.observation).toMatch(/all five leaves are one edge away/i)
    expect(insight.interpretation).toMatch(/λ₂ = 1.000/i)
    expect(insight.interpretation).toMatch(/initial condition/i)
  })

  it('explains the leaf as a directional transient on the same spectrum', () => {
    const insight = buildStarInsight({
      heatSource: 'leaf-0',
      spectrum: {
        ...ANALYSIS_FIXTURE.spectrum,
        algebraicConnectivity: 1,
      },
      diagnostics: ANALYSIS_FIXTURE.diagnostics,
    })

    expect(insight.headline).toBe('A leaf creates a directional transient.')
    expect(insight.observation).toMatch(/two edges away through the hub/i)
    expect(insight.interpretation).toMatch(/does not change the spectrum/i)
    expect(insight.limitation).toMatch(/graph distance/i)
  })
})
