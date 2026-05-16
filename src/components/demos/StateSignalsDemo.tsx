import { useState, useMemo, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const SIGNALS_CODE = `import { signal, computed } from '@preact/signals-react'

const firstName = signal('Alice')
const lastName = signal('Smith')

// computed re-evaluates only when firstName or lastName changes
const fullName = computed(() => {
  console.log('recomputing fullName')
  return firstName.value + ' ' + lastName.value
})

// Component only subscribes to fullName
function Greeting() {
  return <h1>Hello, {fullName}</h1>
}

// Changing lastName skips Greeting's component re-render
// only the text node updates in the DOM
lastName.value = 'Jones'`

const REACT_CODE = `// React useState version - the entire component re-renders
function Greeting() {
  const [firstName, setFirstName] = useState('Alice')
  const [lastName, setLastName] = useState('Smith')

  const fullName = firstName + ' ' + lastName
  // ^^ recomputed on EVERY render, even if only lastName changes

  return <h1>Hello, {fullName}</h1>
}`

export default function StateSignalsDemo() {
  const [firstName, setFirstName] = useState('Alice')
  const [lastName, setLastName] = useState('Smith')
  const [log, setLog] = useState<string[]>([])
  const [useReactMode, setUseReactMode] = useState(false)

  const fullName = useMemo(() => {
    setLog(prev => [...prev, `Recomputed: "${firstName} ${lastName}"`])
    return `${firstName} ${lastName}`
  }, [firstName, lastName])

  const changeFirstName = useCallback(() => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
    const next = names[Math.floor(Math.random() * names.length)]
    setFirstName(prev => {
      if (prev !== next) {
        setLog(l => [...l, `Signal firstName changed: "${prev}" -> "${next}"`])
      }
      return prev
    })
  }, [])

  const changeLastName = useCallback(() => {
    const names = ['Smith', 'Jones', 'Brown', 'Taylor', 'Wilson']
    const next = names[Math.floor(Math.random() * names.length)]
    setLastName(prev => {
      if (prev !== next) {
        setLog(l => [...l, `Signal lastName changed: "${prev}" -> "${next}"`])
      }
      return prev
    })
  }, [])

  const reset = useCallback(() => {
    setFirstName('Alice')
    setLastName('Smith')
    setLog([])
  }, [])

  const signalsHighlighted = useMemo(() =>
    Prism.highlight(SIGNALS_CODE, Prism.languages.javascript, 'javascript'),
    []
  )
  const reactHighlighted = useMemo(() =>
    Prism.highlight(REACT_CODE, Prism.languages.javascript, 'javascript'),
    []
  )

  const recomputeCount = log.filter(l => l.startsWith('Recomputed')).length
  const firstNameChanges = log.filter(l => l.startsWith('Signal firstName')).length
  const lastNameChanges = log.filter(l => l.startsWith('Signal lastName')).length

  return (
    <DemoBoundary name="Signals Fine-Grained Reactivity">
    <style>{`
      code .token.keyword { color: #f92672; }
      code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
      code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
      code .token.selector, code .token.attr-name { color: #f92672; }
      code .token.attr-value, code .token.atrule { color: #e6db74; }
      code .token.function, code .token.class-name { color: #a6e22e; }
      code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
      code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
      code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
    `}</style>
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Signals: Fine-Grained Reactivity</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
        Signals provide granular reactivity: when a dependency changes, only the computed value re-evaluates,
        not the entire component. This is fundamentally different from Redux or Zustand (which trigger component-level re-renders).
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          background: s.bg2, borderRadius: 12, border: `2px solid ${s.accent}`,
          padding: '20px 24px', flex: 1, textAlign: 'center', minWidth: 180,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Signal A: firstName
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, fontFamily: s.mono, color: s.accent,
            marginBottom: 10,
          }}>
            {firstName}
          </div>
          <button onClick={changeFirstName} style={{
            background: s.accent, border: 'none', borderRadius: 6, padding: '8px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>
            Change First Name
          </button>
        </div>
        <div style={{
          background: s.bg2, borderRadius: 12, border: `2px solid ${s.purple}`,
          padding: '20px 24px', flex: 1, textAlign: 'center', minWidth: 180,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Signal B: lastName
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, fontFamily: s.mono, color: s.purple,
            marginBottom: 10,
          }}>
            {lastName}
          </div>
          <button onClick={changeLastName} style={{
            background: s.purple, border: 'none', borderRadius: 6, padding: '8px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>
            Change Last Name
          </button>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `2px solid ${s.yellow}`,
        padding: '20px 24px', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Computed Value (depends on A + B)
        </div>
        <div style={{
          fontSize: 32, fontWeight: 700, fontFamily: s.mono, color: s.yellow,
          letterSpacing: -0.5,
        }}>
          {fullName}
        </div>
        <div style={{
          color: s.text3, fontSize: 12, marginTop: 6,
          display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <span>Depends on: <span style={{ color: s.accent, fontWeight: 600 }}>firstName</span></span>
          <span style={{ color: s.text3 }}>+</span>
          <span>Depends on: <span style={{ color: s.purple, fontWeight: 600 }}>lastName</span></span>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Reactivity Log
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 11 }}>
              firstName changed: {firstNameChanges}
            </span>
            <span style={{ color: s.purple, fontFamily: s.mono, fontSize: 11 }}>
              lastName changed: {lastNameChanges}
            </span>
            <span style={{ color: s.yellow, fontFamily: s.mono, fontSize: 11 }}>
              computed re-evaluated: {recomputeCount}
            </span>
          </div>
        </div>
        <div style={{
          maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {log.length === 0 && (
            <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 16 }}>
              Click the buttons above to see which values re-evaluate.
            </div>
          )}
          {[...log].reverse().map((entry, i) => {
            const isComputed = entry.startsWith('Recomputed')
            return (
              <div key={i} style={{
                padding: '4px 8px', borderRadius: 4,
                background: isComputed ? `${s.yellow}10` : 'transparent',
                fontFamily: s.mono, fontSize: 11, color: isComputed ? s.yellow : s.text2,
              }}>
                {entry}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>
            Clear Log
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setUseReactMode(false)} style={{
          flex: 1, border: 'none', borderRadius: 8, padding: '10px 20px',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
          background: useReactMode ? s.bg3 : s.accent, color: useReactMode ? s.text3 : '#fff',
        }}>
          Signals Approach
        </button>
        <button onClick={() => setUseReactMode(true)} style={{
          flex: 1, border: 'none', borderRadius: 8, padding: '10px 20px',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
          background: useReactMode ? s.accent : s.bg3, color: useReactMode ? '#fff' : s.text3,
        }}>
          React useState (for comparison)
        </button>
      </div>

      {!useReactMode && (
        <div style={codify({ marginBottom: 20 })}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Preact Signals with computed()
          </div>
          <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: signalsHighlighted }} />
        </div>
      )}

      {useReactMode && (
        <div style={codify({ marginBottom: 20 })}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            React useState -- Entire component re-renders
          </div>
          <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: reactHighlighted }} />
        </div>
      )}

      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1, minWidth: 180, background: s.bg2, borderRadius: 10,
          border: `1px solid ${s.border}`, padding: '14px 16px',
        }}>
          <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Signals (fine-grained)
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, color: s.text2, fontSize: 12, lineHeight: 1.8 }}>
            <li>computed() re-evaluates on demand</li>
            <li>No component re-render needed</li>
            <li>DOM updates at text-node level</li>
            <li>Only affected subscribers notified</li>
          </ul>
        </div>
        <div style={{
          flex: 1, minWidth: 180, background: s.bg2, borderRadius: 10,
          border: `1px solid ${s.border}`, padding: '14px 16px',
        }}>
          <div style={{ color: s.red, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            useState (component-level)
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, color: s.text2, fontSize: 12, lineHeight: 1.8 }}>
            <li>Entire component function re-runs</li>
            <li>useMemo must be manually specified</li>
            <li>Virtual DOM diff reconciles changes</li>
            <li>All children re-render by default</li>
          </ul>
        </div>
      </div>

      <div style={{
        background: `${s.yellow}10`, border: `1px solid ${s.yellow}30`, borderRadius: 10,
        padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow, flexShrink: 0 }} />
          <span style={{ color: s.yellow, fontSize: 13, fontWeight: 600 }}>Key Insight</span>
        </div>
        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
          With signals, changing lastName does not re-execute the component function at all.
          Only the computed() callback re-runs, and only the affected DOM text node is patched.
          In React, the same change re-renders the entire component tree unless manually optimized with useMemo and React.memo.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function codify(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px',
    overflowX: 'auto',
    ...extra,
  }
}
