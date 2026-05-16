import { useState, useMemo, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'

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
}

const ZUSTAND_CODE = `import { create } from 'zustand'

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((st) => ({ count: st.count + 1 })),
  decrement: () => set((st) => ({ count: st.count - 1 })),
  reset: () => set({ count: 0 }),
}))`

const ZUSTAND_USAGE = `function Counter() {
  const { count, increment, decrement } = useCounterStore()

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}`

const REDUX_CODE = `// Action Types
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'
const RESET = 'RESET'

// Action Creators
const increment = () => ({ type: INCREMENT })
const decrement = () => ({ type: DECREMENT })
const reset = () => ({ type: RESET })

// Reducer
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 }
    case DECREMENT:
      return { ...state, count: state.count - 1 }
    case RESET:
      return { count: 0 }
    default:
      return state
  }
}

// Store
import { createStore } from 'redux'
const store = createStore(counterReducer)

// Component
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const unsub = store.subscribe(() =>
      setCount(store.getState().count)
    )
    return unsub
  }, [])

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => store.dispatch(increment())}>+</button>
      <button onClick={() => store.dispatch(decrement())}>-</button>
    </div>
  )
}`

const COMPARISON = [
  { metric: 'Boilerplate (lines)', redux: 45, zustand: 15 },
  { metric: 'Concepts to learn', redux: 6, zustand: 2 },
  { metric: 'Files needed', redux: 4, zustand: 1 },
  { metric: 'Nested callbacks', redux: 3, zustand: 0 },
  { metric: 'Imports required', redux: 6, zustand: 1 },
]

export default function StateZustandDemo() {
  const [count, setCount] = useState(0)
  const [showRedux, setShowRedux] = useState(false)

  const zustandHighlighted = useMemo(() =>
    Prism.highlight(ZUSTAND_CODE, Prism.languages.javascript, 'javascript'),
    []
  )
  const zustandUsageHighlighted = useMemo(() =>
    Prism.highlight(ZUSTAND_USAGE, Prism.languages.javascript, 'javascript'),
    []
  )
  const reduxHighlighted = useMemo(() =>
    Prism.highlight(REDUX_CODE, Prism.languages.javascript, 'javascript'),
    []
  )

  const inc = useCallback(() => setCount(c => c + 1), [])
  const dec = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(0), [])

  return (
    <DemoBoundary name="Zustand Architecture">
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
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Zustand Architecture</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
        A hooks-based store with direct mutation via set(). No reducers, no action types, no dispatch.
        State and actions live in one place.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'stretch' }}>
        <div style={{
          background: s.bg2, border: `2px solid ${s.green}`, borderRadius: 12,
          padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Zustand Store
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, fontFamily: s.mono, color: s.green }}>
            {count}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={dec} style={{
              ...BTN, background: s.red, color: '#fff', padding: '6px 14px', fontSize: 16,
            }}>
              -
            </button>
            <button onClick={reset} style={{
              ...BTN, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`,
              padding: '6px 14px', fontSize: 12,
            }}>
              Reset
            </button>
            <button onClick={inc} style={{
              ...BTN, background: s.green, color: '#fff', padding: '6px 14px', fontSize: 16,
            }}>
              +
            </button>
          </div>
        </div>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
          padding: '16px 20px', flex: 1,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            What Happens on Click
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: '1. Click +', color: s.green },
              { label: '2. Store.set() called', color: s.yellow },
              { label: '3. State merges immutably', color: s.accent },
              { label: '4. Subscribers notified', color: s.purple },
              { label: '5. React re-renders', color: s.orange },
            ].map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                <span style={{ color: s.text2, fontSize: 12 }}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setShowRedux(false)} style={{
          ...BTN, flex: 1, background: showRedux ? s.bg3 : s.accent, color: showRedux ? s.text3 : '#fff',
          border: 'none',
        }}>
          Show Zustand Code
        </button>
        <button onClick={() => setShowRedux(true)} style={{
          ...BTN, flex: 1, background: showRedux ? s.accent : s.bg3, color: showRedux ? '#fff' : s.text3,
          border: 'none',
        }}>
          Show Redux Code (for comparison)
        </button>
      </div>

      {!showRedux && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={codify()}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Store Definition
            </div>
            <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: zustandHighlighted }} />
          </div>
          <div style={codify()}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Component Usage
            </div>
            <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: zustandUsageHighlighted }} />
          </div>
        </div>
      )}

      {showRedux && (
        <div style={codify({ marginBottom: 20 })}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Equivalent Redux Code
          </div>
          <code style={{ fontFamily: s.mono, fontSize: 13, whiteSpace: 'pre', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: reduxHighlighted }} />
        </div>
      )}

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Boilerplate Comparison: Redux vs Zustand
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COMPARISON.map((row, i) => {
            const maxVal = Math.max(row.redux, row.zustand)
            const reduxPct = (row.redux / maxVal) * 100
            const zustandPct = (row.zustand / maxVal) * 100
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: s.text2, fontSize: 12 }}>{row.metric}</span>
                  <span style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: s.purple, fontSize: 12, fontFamily: s.mono }}>Redux: {row.redux}</span>
                    <span style={{ color: s.green, fontSize: 12, fontFamily: s.mono }}>Zustand: {row.zustand}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, height: 8 }}>
                  <div style={{
                    flex: row.redux, height: '100%', borderRadius: 4,
                    background: s.purple, opacity: 0.6,
                    transition: 'flex 0.3s',
                  }} />
                  <div style={{
                    flex: row.zustand, height: '100%', borderRadius: 4,
                    background: s.green, opacity: 0.6,
                    transition: 'flex 0.3s',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        background: `${s.green}10`, border: `1px solid ${s.green}30`, borderRadius: 10,
        padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green, flexShrink: 0 }} />
          <span style={{ color: s.green, fontSize: 13, fontWeight: 600 }}>Key Insight</span>
        </div>
        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
          Zustand eliminates the ceremony: no action types, no action creators, no reducer switch, no Provider wrapper.
          The store is a plain hook. Mutations use the same immutable update pattern, but the API surface is minimal.
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
