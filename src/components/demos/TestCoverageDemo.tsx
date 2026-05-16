import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Scenario = 'high' | 'meaningful'

type TestResult = {
  line: number
  covered: boolean
  label?: string
} | null

const sourceCode = `function calculateDiscount(price: number, isPremium: boolean, coupon?: string): number {
  let discount = 0;

  if (isPremium) {
    discount += 0.2;
  }

  if (coupon) {
    discount += 0.1;
  }

  if (price < 100) {
    discount = Math.min(discount, 0.1);
  }

  if (discount > 0.5) {
    discount = 0.5;
  }

  return price * (1 - discount);
}`

const codeLines = sourceCode.split('\n')

interface LineAnnotation {
  covered: boolean
  isBranch?: boolean
  branchPass?: boolean
}

interface ScenarioData {
  name: string
  desc: string
  lineCoverage: number
  branchCoverage: number
  mutationScore: number
  tests: string[]
  annotations: LineAnnotation[]
}

const highCoverageData: ScenarioData = {
  name: 'High Coverage (shallow)',
  desc: 'All lines are executed, but assertions are weak. Branches are hit but not verified independently. Mutation testing reveals the tests are fragile.',
  lineCoverage: 100,
  branchCoverage: 75,
  mutationScore: 30,
  tests: [
    'calculateDiscount(100, false) returns 100',
    'calculateDiscount(100, true) returns 80',
    'calculateDiscount(50, false, "SAVE10") returns 45',
  ],
  annotations: [
    { covered: true },
    { covered: true },
    { covered: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: false },
    { covered: true, isBranch: true, branchPass: false },
    { covered: true },
    { covered: true, isBranch: true, branchPass: false },
    { covered: true, isBranch: true, branchPass: false },
    { covered: true },
    { covered: true },
  ],
}

const meaningfulCoverageData: ScenarioData = {
  name: 'Meaningful Coverage (deep)',
  desc: 'All lines covered AND all branches verified independently. Mutation testing shows the tests actually catch errors.',
  lineCoverage: 100,
  branchCoverage: 100,
  mutationScore: 100,
  tests: [
    'calculateDiscount(100, false) returns 100',
    'calculateDiscount(100, true) returns 80',
    'calculateDiscount(50, false, "SAVE10") returns 45',
    'calculateDiscount(199, true, "SAVE10") returns 139.3',
    'calculateDiscount(50, false, "") returns 50',
    'calculateDiscount(999999, true) returns 500000',
    'calculateDiscount(50, true) returns 45',
    'mutant test: removing isPremium branch fails test 2',
  ],
  annotations: [
    { covered: true },
    { covered: true },
    { covered: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true, isBranch: true, branchPass: true },
    { covered: true },
    { covered: true },
  ],
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function TestCoverageDemo() {
  const [scenario, setScenario] = useState<Scenario>('high')
  const [showTests, setShowTests] = useState(false)

  const data = scenario === 'high' ? highCoverageData : meaningfulCoverageData

  const highlightedHtml = useMemo(() => {
    return Prism.highlight(sourceCode, Prism.languages.typescript, 'typescript')
  }, [])

  return (
    <DemoBoundary name="Code Coverage">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Code Coverage Analysis</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Coverage tells you which code ran during tests -- but not whether the tests actually verify correctness.
          Toggle between scenarios to see the difference.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setScenario('high')} style={{
            flex: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 8,
            background: scenario === 'high' ? s.yellow + '20' : s.bg3,
            border: `1px solid ${scenario === 'high' ? s.yellow : s.border}`,
            color: scenario === 'high' ? s.yellow : s.text2,
            fontWeight: 600, fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>High Coverage (shallow)</button>
          <button onClick={() => setScenario('meaningful')} style={{
            flex: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 8,
            background: scenario === 'meaningful' ? s.green + '20' : s.bg3,
            border: `1px solid ${scenario === 'meaningful' ? s.green : s.border}`,
            color: scenario === 'meaningful' ? s.green : s.text2,
            fontWeight: 600, fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>Meaningful Coverage (deep)</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Line Coverage', value: data.lineCoverage, color: data.lineCoverage === 100 ? s.green : s.yellow },
            { label: 'Branch Coverage', value: data.branchCoverage, color: data.branchCoverage === 100 ? s.green : s.yellow },
            { label: 'Mutation Score', value: data.mutationScore, color: data.mutationScore === 100 ? s.green : s.red },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: stat.color, fontFamily: s.mono, fontSize: 24, fontWeight: 700 }}>{stat.value}%</div>
              <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{data.desc}</div>
          <div style={{
            background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`,
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${s.border}` }}>
              <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>calculateDiscount.ts</span>
            </div>
            <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, padding: '4px 0' }}>
              <style>{`
                .tcc { }
                .tcc code .token.keyword { color: #f92672; }
                .tcc code .token.string, .tcc code .token.char, .tcc code .token.builtin, .tcc code .token.inserted { color: #e6db74; }
                .tcc code .token.number, .tcc code .token.constant, .tcc code .token.symbol, .tcc code .token.property, .tcc code .token.tag, .tcc code .token.boolean, .tcc code .token.deleted { color: #ae81ff; }
                .tcc code .token.selector, .tcc code .token.attr-name { color: #f92672; }
                .tcc code .token.attr-value, .tcc code .token.atrule { color: #e6db74; }
                .tcc code .token.function, .tcc code .token.class-name { color: #a6e22e; }
                .tcc code .token.operator, .tcc code .token.entity, .tcc code .token.url, .tcc code .token.punctuation { color: #f8f8f2; }
                .tcc code .token.comment, .tcc code .token.prolog, .tcc code .token.doctype, .tcc code .token.cdata { color: #75715e; font-style: italic; }
                .tcc code .token.parameter, .tcc code .token.variable, .tcc code .token.regex, .tcc code .token.important { color: #fd971f; }
              `}</style>
              {codeLines.map((line, idx) => {
                const ann = data.annotations[idx]
                const bgColor = !ann || !ann.covered
                  ? s.red + '15'
                  : ann.isBranch
                    ? (ann.branchPass ? s.green + '12' : s.red + '18')
                    : s.green + '08'
                const borderColor = !ann || !ann.covered
                  ? s.red
                  : ann.isBranch
                    ? (ann.branchPass ? s.green : s.red)
                    : 'transparent'
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      borderLeft: `3px solid ${borderColor}`,
                      background: bgColor,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 32, textAlign: 'right', paddingRight: 12,
                      color: s.text3, fontSize: 10, userSelect: 'none',
                      paddingTop: 1, paddingBottom: 1, lineHeight: 1.6,
                      fontFamily: s.mono,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, paddingLeft: 8, lineHeight: 1.6 }}>
                      <code dangerouslySetInnerHTML={{ __html: line ? highlightedHtml.split('\n')[idx] || line : '' }} />
                    </div>
                    {ann && ann.isBranch && (
                      <div style={{
                        paddingRight: 8, display: 'flex', alignItems: 'center',
                      }}>
                        <span style={{
                          fontSize: 9, fontFamily: s.mono, fontWeight: 600,
                          color: ann.branchPass ? s.green : s.red,
                          background: ann.branchPass ? s.green + '15' : s.red + '15',
                          padding: '1px 5px', borderRadius: 3,
                        }}>
                          {ann.branchPass ? 'branch OK' : 'branch MISS'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowTests(!showTests)}
            style={{
              background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 11,
              fontFamily: s.mono, marginBottom: showTests ? 10 : 0,
            }}
          >
            {showTests ? 'Hide' : 'Show'} Tests ({data.tests.length})
          </button>
          {showTests && (
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
              {data.tests.map((test, idx) => (
                <div key={idx} style={{
                  fontFamily: s.mono, fontSize: 11, lineHeight: 1.8,
                  color: test.startsWith('mutant') ? s.red : s.text,
                  paddingLeft: test.startsWith('mutant') ? 0 : 16,
                }}>
                  {test.startsWith('mutant') ? (
                    <div style={{ color: s.red, fontWeight: 600 }}>{`! ${test}`}</div>
                  ) : (
                    <div style={{ color: s.text2 }}>{test}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
