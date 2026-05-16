import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type View = 'pyramid' | 'trophy'

interface LayerInfo {
  id: string
  label: string
  color: string
  pct: string
  desc: string
  examples: string[]
  tools: string[]
  when: string
}

const pyramidLayers: LayerInfo[] = [
  {
    id: 'e2e', label: 'E2E Tests', color: s.purple, pct: '10%',
    desc: 'Tests that simulate real user behavior through a browser. They click buttons, fill forms, navigate pages, and verify the full stack works end-to-end. These are the slowest and most expensive tests, so keep the count low.',
    examples: ['User sign-up flow', 'Checkout and payment', 'Multi-step wizard'],
    tools: ['Playwright', 'Cypress', 'Selenium'],
    when: 'Use for critical business flows where the full stack must work together. Keep to 10% of your suite.',
  },
  {
    id: 'integration', label: 'Integration Tests', color: s.accent, pct: '20%',
    desc: 'Tests that verify multiple components work together correctly. They test API endpoints, database interactions, and service-to-service communication without the browser. Faster than E2E but still exercise real dependencies.',
    examples: ['REST API response format', 'Database query correctness', 'External service integration'],
    tools: ['RSpec', 'pytest', 'Jest + supertest'],
    when: 'Use for API endpoints, database layer testing, and service integration. Aim for 20% of your suite.',
  },
  {
    id: 'unit', label: 'Unit Tests', color: s.green, pct: '70%',
    desc: 'Tests that verify individual functions, methods, or classes in isolation. They are fast (microseconds), focused (one behavior per test), and form the foundation of your test suite. You should have many of them.',
    examples: ['Validation logic', 'Price calculation', 'Input sanitization'],
    tools: ['Jest', 'Vitest', 'pytest', 'JUnit'],
    when: 'Use for every piece of business logic, utility function, and model validation. This is the bulk of your suite.',
  },
]

const trophyLayers: LayerInfo[] = [
  {
    id: 'e2e', label: 'E2E Tests', color: s.purple, pct: '5%',
    desc: 'Critical path tests that verify the most important user journeys. Minimal count due to brittleness and maintenance cost.',
    examples: ['Payment flow', 'User onboarding', 'Core feature walkthrough'],
    tools: ['Playwright', 'Cypress', 'Selenium'],
    when: 'Only the most critical user journeys. Keep to 5% or less.',
  },
  {
    id: 'integration', label: 'Integration Tests', color: s.accent, pct: '20%',
    desc: 'Tests that verify components work together through their public interfaces. Unlike the pyramid, these focus on contract testing and API boundary verification rather than exhaustive scenarios.',
    examples: ['API contract tests', 'Database migration tests', 'Service boundary tests'],
    tools: ['supertest', 'RSpec request tests', 'pytest + Testcontainers'],
    when: 'Use for API contracts, database migrations, and service boundaries. About 20% of your suite.',
  },
  {
    id: 'unit', label: 'Unit Tests', color: s.green, pct: '40%',
    desc: 'Fast, focused tests for business logic. The trophy reduces the emphasis on unit tests compared to the pyramid and redirects effort toward static analysis and type checking.',
    examples: ['Business rule validation', 'Data transformation', 'Edge case handling'],
    tools: ['Jest', 'Vitest', 'pytest', 'JUnit'],
    when: 'Use for business logic and complex algorithms. About 40% of your suite.',
  },
  {
    id: 'static', label: 'Static Analysis', color: s.orange, pct: '35%',
    desc: 'Static analysis catches entire categories of bugs before any test runs. Type checking (TypeScript, mypy), linting (ESLint, ruff), and formal verification catch null references, type mismatches, and style issues automatically.',
    examples: ['Type checking catches null access', 'Linting prevents common bugs', 'Formatter enforces consistency'],
    tools: ['TypeScript', 'mypy', 'ESLint', 'ruff', 'prettier'],
    when: 'Always. Static analysis is the cheapest way to prevent bugs. Every project should have linting and type checking from day one.',
  },
]

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function TestPyramidDemo() {
  const [view, setView] = useState<View>('pyramid')
  const [selected, setSelected] = useState<string | null>(null)

  const layers = view === 'pyramid' ? pyramidLayers : trophyLayers
  const selectedLayer = layers.find(l => l.id === selected)

  return (
    <DemoBoundary name="Testing Pyramid vs Trophy">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Testing Pyramid vs Testing Trophy</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          The classic pyramid recommends many unit tests, fewer integration tests, and few E2E tests.
          The modern trophy adds static analysis and shifts proportions.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => { setView('pyramid'); setSelected(null) }} style={{
            flex: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 8,
            background: view === 'pyramid' ? s.accent + '20' : s.bg3,
            border: `1px solid ${view === 'pyramid' ? s.accent : s.border}`,
            color: view === 'pyramid' ? s.accent : s.text2,
            fontWeight: 600, fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>Classic Pyramid</button>
          <button onClick={() => { setView('trophy'); setSelected(null) }} style={{
            flex: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 8,
            background: view === 'trophy' ? s.accent + '20' : s.bg3,
            border: `1px solid ${view === 'trophy' ? s.accent : s.border}`,
            color: view === 'trophy' ? s.accent : s.text2,
            fontWeight: 600, fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>Testing Trophy</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: 20 }}>
          {(view === 'pyramid' ? [...pyramidLayers].reverse() : [...trophyLayers].reverse()).map(layer => {
            const isActive = selected === layer.id
            const isTop = layer.id === (view === 'pyramid' ? 'unit' : 'static')
            const isBottom = layer.id === (view === 'pyramid' ? 'e2e' : 'e2e')
            return (
              <button
                key={layer.id}
                onClick={() => setSelected(isActive ? null : layer.id)}
                style={{
                  width: view === 'pyramid'
                    ? layer.id === 'e2e' ? 260 : layer.id === 'integration' ? 380 : 500
                    : layer.id === 'static' ? 500 : layer.id === 'unit' ? 420 : layer.id === 'integration' ? 320 : 240,
                  height: 56,
                  background: isActive ? layer.color + '25' : s.bg3,
                  border: `2px solid ${isActive ? layer.color : layer.color + '60'}`,
                  borderBottom: isTop ? 'none' : `1px solid ${isActive ? layer.color : layer.color + '60'}`,
                  borderRadius: isBottom ? '10px 10px 0 0' : isTop ? '0 0 10px 10px' : 0,
                  color: isActive ? layer.color : s.text,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 20px',
                  fontFamily: s.mono,
                  fontSize: 13,
                  fontWeight: 600,
                  position: 'relative',
                }}
              >
                <span>{layer.label}</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: isActive ? layer.color : s.text3 }}>
                  {layer.pct}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
          {(view === 'pyramid' ? pyramidLayers : trophyLayers).map(layer => {
            const pctNum = parseInt(layer.pct)
            return (
              <div
                key={layer.id}
                style={{
                  flex: pctNum, height: 8, borderRadius: 4,
                  background: layer.color,
                  opacity: selected === null || selected === layer.id ? 1 : 0.3,
                  transition: 'opacity 0.2s',
                }}
              />
            )
          })}
        </div>

        {selectedLayer && (
          <div style={{ background: s.bg, border: `1px solid ${selectedLayer.color}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${s.border}` }}>
              <div style={{ color: selectedLayer.color, fontWeight: 600, fontSize: 15, marginBottom: 6, fontFamily: s.mono }}>
                {selectedLayer.label} ({selectedLayer.pct})
              </div>
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                {selectedLayer.desc}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Examples</div>
                  {selectedLayer.examples.map(ex => (
                    <div key={ex} style={{ color: s.text, fontSize: 12, fontFamily: s.mono, padding: '2px 0' }}>{ex}</div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Tools</div>
                  {selectedLayer.tools.map(t => (
                    <div key={t} style={{ color: s.text, fontSize: 12, fontFamily: s.mono, padding: '2px 0' }}>{t}</div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 18px' }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>When to use</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{selectedLayer.when}</div>
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
