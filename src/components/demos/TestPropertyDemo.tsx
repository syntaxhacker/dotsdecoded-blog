import { useState, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type TestMode = 'example' | 'property'
type RunState = 'idle' | 'running' | 'pass' | 'fail'

interface TestCase {
  input: number[]
  expected: number[]
  actual?: number[]
  pass?: boolean
  shrunk?: boolean
}

function reverse(arr: number[]): number[] {
  return [...arr].reverse()
}

function buggyReverse(arr: number[]): number[] {
  const result = [...arr].reverse()
  if (arr.length === 3 && arr[0] === 7 && arr[1] === 2 && arr[2] === 9) {
    result[0] = 7
  }
  return result
}

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 20) - 5)
}

function shrinkArray(arr: number[]): number[][] {
  const candidates: number[][] = []
  if (arr.length > 1) {
    candidates.push(arr.slice(0, -1))
    candidates.push(arr.slice(1))
  }
  if (arr.length > 2) {
    candidates.push(arr.slice(1, -1))
  }
  const half = arr.filter((_, i) => i % 2 === 0)
  if (half.length > 0 && half.length < arr.length) {
    candidates.push(half)
  }
  return candidates
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function TestPropertyDemo() {
  const [mode, setMode] = useState<TestMode>('example')
  const [runState, setRunState] = useState<RunState>('idle')
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [shrinking, setShrinking] = useState(false)
  const [minimalCase, setMinimalCase] = useState<number[] | null>(null)
  const [exampleCount, setExampleCount] = useState(0)
  const stopRef = useRef(false)

  const runExampleTests = useCallback(() => {
    stopRef.current = false
    setRunState('running')
    setCurrentIdx(-1)
    setShrinking(false)
    setMinimalCase(null)

    const examples: TestCase[] = [
      { input: [], expected: [] },
      { input: [1], expected: [1] },
      { input: [1, 2, 3], expected: [3, 2, 1] },
      { input: [5, 10, 15, 20], expected: [20, 15, 10, 5] },
    ]

    setTestCases(examples)

    const runExample = (idx: number) => {
      if (stopRef.current || idx >= examples.length) {
        setRunState('pass')
        setExampleCount(examples.length)
        return
      }
      setCurrentIdx(idx)
      const ex = examples[idx]
      const result = buggyReverse(ex.input)
      const pass = result.every((v, i) => v === ex.expected[i])
      setTestCases(prev => {
        const next = [...prev]
        next[idx] = { ...ex, actual: result, pass }
        return next
      })
      setTimeout(() => runExample(idx + 1), 800)
    }

    setTimeout(() => runExample(0), 300)
  }, [])

  const runPropertyTests = useCallback(() => {
    stopRef.current = false
    setRunState('running')
    setCurrentIdx(-1)
    setShrinking(false)
    setMinimalCase(null)
    setExampleCount(0)

    const randomCases: TestCase[] = []
    for (let i = 0; i < 20; i++) {
      const size = Math.floor(Math.random() * 6) + 1
      randomCases.push({ input: generateRandomArray(size), expected: [] })
    }

    setTestCases([])
    let testedCount = 0
    let foundFail = false

    const testNext = (idx: number) => {
      if (stopRef.current || idx >= randomCases.length) {
        if (!foundFail) {
          setRunState('pass')
          setExampleCount(testedCount)
        }
        return
      }

      if (foundFail) return

      setCurrentIdx(idx)
      const ex = randomCases[idx]
      const result = reverse(ex.input)
      const doubleReverse = reverse(result)
      const pass = doubleReverse.every((v, i) => v === ex.input[i])

      setTestCases(prev => {
        if (foundFail) return prev
        const next = [...prev]
        next[idx] = { input: ex.input, expected: ex.input, actual: doubleReverse, pass }
        return next
      })

      testedCount++
      setExampleCount(testedCount)

      if (!pass) {
        foundFail = true
        setRunState('fail')
        return
      }

      setTimeout(() => testNext(idx + 1), 200)
    }

    setTimeout(() => testNext(0), 300)
  }, [])

  const runShrinkingDemo = useCallback(() => {
    stopRef.current = false
    setRunState('running')
    setCurrentIdx(-1)
    setShrinking(false)
    setMinimalCase(null)

    const failingCase: TestCase = {
      input: [7, 2, 9],
      expected: [9, 2, 7],
    }

    setTestCases([failingCase])
    setExampleCount(0)

    setTimeout(() => {
      setCurrentIdx(0)
      const result = buggyReverse(failingCase.input)
      const failed: TestCase = { ...failingCase, actual: result, pass: false }
      setTestCases([failed])
      setRunState('fail')
      setExampleCount(1)

      setTimeout(() => {
        setShrinking(true)
        let current = [7, 2, 9]

        const shrinkStep = (arr: number[]) => {
          if (stopRef.current) return
          const candidates = shrinkArray(arr)

          let foundSmaller = false
          for (const candidate of candidates) {
            const res = buggyReverse(candidate)
            const dpRes = reverse(res)
            const passes = dpRes.every((v, i) => v === candidate[i])
            if (!passes) {
              const shrunkCase: TestCase = {
                input: candidate,
                expected: reverse(candidate),
                actual: res,
                pass: false,
                shrunk: true,
              }
              setTestCases(prev => [...prev, shrunkCase])
              setCurrentIdx(prev => prev + 1)

              if (candidate.length <= 2) {
                setMinimalCase(candidate)
                setShrinking(false)
                return
              }

              setTimeout(() => shrinkStep(candidate), 600)
              foundSmaller = true
              break
            }
          }

          if (!foundSmaller) {
            setMinimalCase(arr)
            setShrinking(false)
          }
        }

        setTimeout(() => shrinkStep(current), 600)
      }, 800)
    }, 300)
  }, [])

  const stop = useCallback(() => {
    stopRef.current = true
    setRunState('idle')
  }, [])

  const reset = useCallback(() => {
    stopRef.current = true
    setRunState('idle')
    setTestCases([])
    setCurrentIdx(-1)
    setShrinking(false)
    setMinimalCase(null)
    setExampleCount(0)
  }, [])

  return (
    <DemoBoundary name="Property-Based Testing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Property-Based Testing</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Property: reverse(reverse(arr)) equals arr for all arrays. Example-based tests only cover what you write.
          Property-based tests generate random inputs, find edge cases, and shrink failures to minimal repro.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => { reset(); setMode('example') }} style={{
            flex: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 8,
            background: mode === 'example' && runState === 'idle' ? s.accent + '20' : s.bg3,
            border: `1px solid ${mode === 'example' && runState === 'idle' ? s.accent : s.border}`,
            color: mode === 'example' && runState === 'idle' ? s.accent : s.text2,
            fontWeight: 600, fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>Example-Based</button>
          <button onClick={() => { reset(); setMode('property') }} style={{
            flex: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 8,
            background: mode === 'property' && runState === 'idle' ? s.accent + '20' : s.bg3,
            border: `1px solid ${mode === 'property' && runState === 'idle' ? s.accent : s.border}`,
            color: mode === 'property' && runState === 'idle' ? s.accent : s.text2,
            fontWeight: 600, fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>Property-Based</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(runState === 'idle') && (
            <>
              {mode === 'example' ? (
                <button onClick={runExampleTests} style={{
                  background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
                  color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>Run Example Tests</button>
              ) : (
                <>
                  <button onClick={runPropertyTests} style={{
                    background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
                    color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>Run Random Tests</button>
                  <button onClick={runShrinkingDemo} style={{
                    background: s.purple + '20', border: `1px solid ${s.purple}`, borderRadius: 8, padding: '8px 20px',
                    color: s.purple, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>Show Shrinking Demo</button>
                </>
              )}
            </>
          )}
          {runState === 'running' || shrinking ? (
            <button onClick={stop} style={{
              background: s.red + '20', border: `1px solid ${s.red}`, borderRadius: 8, padding: '8px 20px',
              color: s.red, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Stop</button>
          ) : null}
          {runState !== 'idle' && (
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
              color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>Reset</button>
          )}
        </div>

        {runState === 'pass' && (
          <div style={{ background: s.green + '10', border: `1px solid ${s.green}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ color: s.green, fontSize: 13, fontWeight: 600 }}>
              All {exampleCount} tests passed. reverse(reverse(arr)) == arr holds.
            </span>
          </div>
        )}
        {runState === 'fail' && !shrinking && !minimalCase && (
          <div style={{ background: s.red + '10', border: `1px solid ${s.red}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ color: s.red, fontSize: 13, fontWeight: 600 }}>
              Property violated! Input array does not satisfy reverse(reverse(arr)) == arr.
            </span>
          </div>
        )}
        {minimalCase && (
          <div style={{ background: s.red + '15', border: `1px solid ${s.red}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ color: s.red, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Minimal failing case found after shrinking:
            </div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>
              {JSON.stringify(minimalCase)}
            </div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>
              The input was shrunk from {testCases.length > 0 ? JSON.stringify(testCases[0]?.input) : 'original'} to the minimal repro above.
            </div>
          </div>
        )}

        {(runState !== 'idle' || testCases.length > 0) && (
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, maxHeight: 350, overflowY: 'auto' }}>
            <div style={{ background: s.bg3, padding: '8px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>Test Results</span>
              {shrinking && (
                <span style={{ color: s.yellow, fontSize: 10, fontFamily: s.mono }}>Shrinking...</span>
              )}
            </div>
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 14px',
                  borderBottom: idx < testCases.length - 1 ? `1px solid ${s.border}` : 'none',
                  background: idx === currentIdx ? s.accent + '08' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, fontFamily: s.mono,
                  background: tc.pass === undefined
                    ? s.bg3
                    : tc.pass ? s.green + '20' : s.red + '20',
                  border: `1px solid ${
                    tc.pass === undefined
                      ? s.border
                      : tc.pass ? s.green : s.red
                  }`,
                  color: tc.pass === undefined ? s.text3 : tc.pass ? s.green : s.red,
                }}>
                  {tc.pass === undefined ? '?' : tc.pass ? '\u2713' : '\u2717'}
                </div>
                <div style={{ flex: 1, fontFamily: s.mono, fontSize: 11, lineHeight: 1.5 }}>
                  <div style={{ color: s.text }}>
                    reverse(reverse({JSON.stringify(tc.input)}))
                  </div>
                  <div style={{ color: s.text3 }}>
                    {tc.pass === undefined
                      ? 'running...'
                      : tc.pass
                        ? `== {JSON.stringify(tc.expected)} (OK)`
                        : `expected {JSON.stringify(tc.expected)}, got {JSON.stringify(tc.actual)}`
                    }
                  </div>
                </div>
                {tc.shrunk && (
                  <span style={{
                    fontSize: 9, fontFamily: s.mono, fontWeight: 600,
                    color: s.yellow, background: s.yellow + '15',
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    shrunk
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
