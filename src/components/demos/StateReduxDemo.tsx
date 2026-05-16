import { useState, useCallback, useMemo } from 'react'
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

const BTN: React.CSSProperties = {
  border: 'none', borderRadius: 8, padding: '10px 20px',
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
  transition: 'all 0.15s',
}

const initialState = { count: 0 }

type Action = { type: 'INCREMENT'; payload: number } | { type: 'DECREMENT'; payload: number } | { type: 'RESET' }

function reducer(state: { count: number }, action: Action): { count: number } {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload }
    case 'DECREMENT':
      return { count: state.count - action.payload }
    case 'RESET':
      return { count: 0 }
    default:
      return state
  }
}

const REDUCER_SOURCE = `function counterReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    case 'DECREMENT':
      return { count: state.count - 1 }
    case 'RESET':
      return { count: 0 }
    default:
      return state
  }
}`

const ACTION_CREATORS = `const increment = (n) => ({
  type: 'INCREMENT',
  payload: n
})
const decrement = (n) => ({
  type: 'DECREMENT',
  payload: n
})`

const DISPATCH_CODE = `store.dispatch(increment(1))
// store.state is now { count: 1 }`

const STORE_SETUP = `import { createStore } from 'redux'

const store = createStore(counterReducer)
store.subscribe(() => {
  console.log(store.getState())
})`

const STEPS = [
  {
    id: 'idle',
    label: 'Initial State',
    desc: 'Store created with initial state. Reducer sits ready. No actions dispatched yet.',
  },
  {
    id: 'dispatch',
    label: 'Dispatch Action',
    desc: 'Component calls store.dispatch({ type: "INCREMENT", payload: 1 }). The action object flows into the reducer.',
  },
  {
    id: 'reducer',
    label: 'Reducer Runs',
    desc: 'The reducer switch matches "INCREMENT" and returns a new state object: { count: 0 + 1 }',
  },
  {
    id: 'state',
    label: 'New State',
    desc: 'Store replaces the old state. Subscribers fire. React re-renders the component tree.',
  },
]

interface StepState {
  actionType: string | null
  actionPayload: number | null
  currentCount: number
  stepIdx: number
}

export default function StateReduxDemo() {
  const [stepState, setStepState] = useState<StepState>({
    actionType: null,
    actionPayload: null,
    currentCount: 0,
    stepIdx: 0,
  })
  const [history, setHistory] = useState<{ type: string; payload: number; prev: number; next: number }[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const reduxHighlighted = useMemo(() =>
    Prism.highlight(REDUCER_SOURCE, Prism.languages.javascript, 'javascript'),
    []
  )
  const actionHighlighted = useMemo(() =>
    Prism.highlight(ACTION_CREATORS, Prism.languages.javascript, 'javascript'),
    []
  )
  const dispatchHighlighted = useMemo(() =>
    Prism.highlight(DISPATCH_CODE, Prism.languages.javascript, 'javascript'),
    []
  )
  const storeHighlighted = useMemo(() =>
    Prism.highlight(STORE_SETUP, Prism.languages.javascript, 'javascript'),
    []
  )

  const inc = useCallback(() => {
    const prev = stepState.currentCount
    const next = reducer({ count: prev }, { type: 'INCREMENT', payload: 1 }).count
    setHistory(h => [...h, { type: 'INCREMENT', payload: 1, prev, next }])
    setStepState({ actionType: 'INCREMENT', actionPayload: 1, currentCount: next, stepIdx: 0 })
  }, [stepState.currentCount])

  const dec = useCallback(() => {
    const prev = stepState.currentCount
    const next = reducer({ count: prev }, { type: 'DECREMENT', payload: 1 }).count
    setHistory(h => [...h, { type: 'DECREMENT', payload: 1, prev, next }])
    setStepState({ actionType: 'DECREMENT', actionPayload: 1, currentCount: next, stepIdx: 0 })
  }, [stepState.currentCount])

  const reset = useCallback(() => {
    setStepState({ actionType: null, actionPayload: null, currentCount: 0, stepIdx: 0 })
    setHistory([])
  }, [])

  const advanceStep = useCallback(() => {
    setStepState(prev => {
      const nextIdx = Math.min(prev.stepIdx + 1, STEPS.length - 1)
      if (nextIdx === STEPS.length - 1 && prev.actionType === null) return prev
      if (nextIdx === STEPS.length - 1 && prev.stepIdx === STEPS.length - 1) return { ...prev, stepIdx: 0 }
      return { ...prev, stepIdx: nextIdx === STEPS.length - 1 ? 0 : nextIdx }
    })
  }, [])

  const currentStep = STEPS[stepState.stepIdx]
  const hasActiveAction = stepState.actionType !== null

  return (
    <DemoBoundary name="Redux Architecture">
    <style>{`
      @keyframes reduxFlow {
        0% { opacity: 0.3; transform: translateY(2px); }
        100% { opacity: 1; transform: translateY(0); }
      }
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
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Redux Architecture</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
        Unidirectional data flow: Component dispatches an action, the reducer produces new state, the store notifies subscribers.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          background: s.bg2, border: `2px solid ${s.accent}`, borderRadius: 12, padding: '16px 20px',
          textAlign: 'center', minWidth: 140, flex: 1,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            Store State
          </div>
          <div style={{
            fontSize: 36, fontWeight: 700, fontFamily: s.mono,
            color: hasActiveAction ? s.accent : s.text,
            transition: 'all 0.3s',
          }}>
            {stepState.currentCount}
          </div>
        </div>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 20px',
          textAlign: 'center', minWidth: 140, flex: 1,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            Actions Dispatched
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: s.mono, color: s.text }}>
            {history.length}
          </div>
        </div>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 20px',
          textAlign: 'center', minWidth: 140, flex: 1,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            Last Action
          </div>
          <div style={{
            fontSize: 14, fontWeight: 600, fontFamily: s.mono,
            color: stepState.actionType ? s.yellow : s.text3,
            transition: 'all 0.3s',
          }}>
            {stepState.actionType || '---'}
          </div>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Step Through the Data Flow
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {STEPS.map((step, i) => (
            <div key={step.id} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= stepState.stepIdx ? s.accent : s.bg3,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{
          animation: stepState.stepIdx > 0 ? 'reduxFlow 0.3s ease-out' : 'none',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: s.accent, marginBottom: 2 }}>
            {stepState.stepIdx + 1}. {STEPS[stepState.stepIdx].label}
          </div>
          <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.5, minHeight: 40 }}>
            {STEPS[stepState.stepIdx].desc}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={inc} style={{
          ...BTN, background: s.green, color: '#fff', flex: 1, minWidth: 100,
        }}>
          Dispatch INCREMENT
        </button>
        <button onClick={dec} style={{
          ...BTN, background: s.red, color: '#fff', flex: 1, minWidth: 100,
        }}>
          Dispatch DECREMENT
        </button>
        <button onClick={advanceStep} style={{
          ...BTN, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`,
          minWidth: 100,
        }}>
          Step Forward
        </button>
        <button onClick={() => { reset(); setShowHistory(false) }} style={{
          ...BTN, background: 'transparent', color: s.text3, border: `1px solid ${s.border2}`,
          minWidth: 80,
        }}>
          Reset
        </button>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '16px 20px', marginBottom: 20, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Reducer Code
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowHistory(false)} style={{
              background: 'transparent', border: 'none', color: showHistory ? s.text3 : s.accent,
              cursor: 'pointer', fontSize: 12, fontWeight: showHistory ? 400 : 600,
            }}>
              Reducer
            </button>
            <button onClick={() => setShowHistory(true)} style={{
              background: 'transparent', border: 'none', color: showHistory ? s.accent : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: showHistory ? 600 : 400,
            }}>
              History ({history.length})
            </button>
          </div>
        </div>
        {!showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={codify()}>
              <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: reduxHighlighted }} />
            </div>
            <details style={{ color: s.text2 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: s.text3, marginBottom: 6 }}>
                Show store setup + action creators
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                <div style={codify()}>
                  <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: storeHighlighted }} />
                </div>
                <div style={codify()}>
                  <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: actionHighlighted }} />
                </div>
                <div style={codify()}>
                  <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: dispatchHighlighted }} />
                </div>
              </div>
            </details>
          </div>
        )}
        {showHistory && (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {history.length === 0 && (
              <div style={{ color: s.text3, fontSize: 13, textAlign: 'center', padding: 20 }}>
                No actions dispatched yet. Click the buttons above.
              </div>
            )}
            {[...history].reverse().map((h, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '6px 0',
                borderBottom: i < history.length - 1 ? `1px solid ${s.border}` : 'none',
                fontFamily: s.mono, fontSize: 12, color: s.text2,
              }}>
                <span style={{ color: s.text3, minWidth: 20 }}>#{history.length - i}</span>
                <span style={{ color: h.type === 'INCREMENT' ? s.green : s.red, minWidth: 100 }}>{h.type}</span>
                <span style={{ color: s.text3 }}>+{h.payload}</span>
                <span style={{ color: s.text3 }}>{h.prev} {'\u2192'} {h.next}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: `${s.purple}10`, border: `1px solid ${s.purple}30`, borderRadius: 10,
        padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.purple, flexShrink: 0 }} />
          <span style={{ color: s.purple, fontSize: 13, fontWeight: 600 }}>Key Insight</span>
        </div>
        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
          Redux state is immutable. The reducer never mutates state — it returns a new object.
          This makes time-travel debugging possible: every action is logged and replayable.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function codify(): React.CSSProperties {
  return {
    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px',
    overflowX: 'auto',
  }
}
