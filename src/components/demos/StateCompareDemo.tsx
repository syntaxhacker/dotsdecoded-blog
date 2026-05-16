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

interface Rating {
  score: number
  label: string
  detail: string
}

interface Row {
  name: string
  color: string
  ratings: Rating[]
  bestFor: string[]
  worstFor: string[]
  bundleSize: string
}

const SYSTEMS: Row[] = [
  {
    name: 'Redux',
    color: s.purple,
    ratings: [
      { score: 2, label: 'High', detail: 'Action types, action creators, reducers, store config, Provider, connect/mapState. Minimum 4 files for a simple feature.' },
      { score: 4, label: 'Optimal', detail: 'One store, one state tree. Time-travel debugging. Predictable state updates. Re-renders only subscribed components.' },
      { score: 5, label: 'Excellent', detail: 'Redux DevTools provide time-travel debugging, action replay, state diffing, and full action history. Gold standard.' },
      { score: 5, label: 'Extensive', detail: 'Redux Thunk, Saga, Observable, RTK Query. Middleware ecosystem is the richest of any state library.' },
      { score: 1, label: 'Large', detail: '~12KB min+gzip for Redux core. RTK adds ~12KB more. Significant bundle impact for small apps.' },
      { score: 2, label: 'Steep', detail: 'Must understand actions, reducers, dispatch, middleware, selectors, normalization, and immutable updates.' },
    ],
    bestFor: ['Large applications', 'Teams needing strict patterns', 'Complex async workflows with Saga/Thunk', 'Debugging-heavy development'],
    worstFor: ['Small apps', 'Rapid prototyping', 'Simple CRUD UIs'],
    bundleSize: '~12KB (core) / ~24KB (with RTK)',
  },
  {
    name: 'Zustand',
    color: s.green,
    ratings: [
      { score: 4, score2: 2, label: 'Low', detail: 'A single create() call. No action types, no reducers, no Provider. 15 lines vs 45 for Redux counter.' },
      { score: 3, label: 'Good', detail: 'Uses React hooks. Subscriptions are selector-based -- component only re-renders when selected slice changes. No Provider wrapper needed.' },
      { score: 3, label: 'Good', detail: 'Redux DevTools support via devtools middleware. Built-in logger. Less polished than Redux but functional.' },
      { score: 3, label: 'Moderate', detail: 'Built-in persist, immer, devtools middleware. Smaller plugin ecosystem than Redux but covers common needs.' },
      { score: 4, label: 'Small', detail: '~2KB min+gzip. Tiny footprint. Tree-shakeable. Ideal for bundle-conscious projects.' },
      { score: 4, label: 'Easy', detail: 'If you know React hooks, you know Zustand. No new paradigms. No switch statements. No action creators.' },
    ],
    bestFor: ['Small to medium apps', 'Projects wanting Redux-like patterns with less code', 'Rapid prototyping', 'Server components (no Provider)'],
    worstFor: ['Teams needing strict architectural enforcement', 'Projects deeply invested in Redux middleware'],
    bundleSize: '~2KB',
  },
  {
    name: 'Signals',
    color: s.yellow,
    ratings: [
      { score: 4, label: 'Low', detail: 'signal() and computed() calls. No store, no reducer, no Provider. Extremely minimal API surface.' },
      { score: 5, label: 'Best', detail: 'Fine-grained reactivity. No component re-render when a signal dependency changes. DOM updates at the text-node level. No virtual DOM needed.' },
      { score: 1, label: 'Minimal', detail: 'DevTools vary by framework. Preact Signals has basic devtools. SolidJS has a Chrome extension. No time-travel debugging.' },
      { score: 1, label: 'Minimal', detail: 'No middleware ecosystem. Effects and computeds replace what middleware would do. Different mental model.' },
      { score: 3, label: 'Tiny', detail: '~1.6KB for @preact/signals-core. Near-zero bundle cost. Most efficient option for bundle size.' },
      { score: 3, label: 'Moderate', detail: 'Simple API but requires understanding pull vs push reactivity. Different mental model from useState-based state management.' },
    ],
    bestFor: ['Performance-critical UIs', 'Real-time dashboards', 'Fine-grained reactivity needs', 'SolidJS / Preact / Angular projects'],
    worstFor: ['Teams new to reactive programming', 'Projects needing rich DevTools', 'Large teams wanting strict patterns'],
    bundleSize: '~1.6KB (core)',
  },
  {
    name: 'Context API',
    color: s.accent,
    ratings: [
      { score: 3, label: 'Medium', detail: 'Create context, provider component, useContext hook. No boilerplate for simple cases, but grows with nested providers.' },
      { score: 1, label: 'Poor', detail: 'Context triggers re-render in ALL consumers when value changes. No selector mechanism. Causes unnecessary re-renders in large trees.' },
      { score: 1, label: 'Minimal', detail: 'React DevTools show context values. No time-travel, no action replay, no state diffing.' },
      { score: 1, label: 'None', detail: 'No middleware. No plugin system. Must implement side effects externally with useEffect or custom hooks.' },
      { score: 5, label: 'Zero', detail: 'Built into React. Zero additional bundle cost. Already in your application.' },
      { score: 5, label: 'Trivial', detail: 'useContext and createContext. If you know React, you already know Context API. No new concepts.' },
    ],
    bestFor: ['Theme/UI state', 'Auth/user context', 'Low-frequency updates', 'Small component trees'],
    worstFor: ['High-frequency updates', 'Deep component trees', 'Complex state logic', 'Performance-critical UIs'],
    bundleSize: '0KB (built-in)',
  },
  {
    name: 'useState',
    color: s.orange,
    ratings: [
      { score: 5, label: 'Minimal', detail: 'One line: const [state, setState] = useState(initial). The simplest state primitive in React.' },
      { score: 2, label: 'Limited', detail: 'Local state only. Prop drilling for shared state. No built-in subscription model. Full tree re-renders by default.' },
      { score: 1, label: 'None', detail: 'No DevTools for useState. Must use React DevTools to inspect component state. No action tracking.' },
      { score: 1, label: 'None', detail: 'No middleware. Side effects must be managed with useEffect. No plugin or extension system.' },
      { score: 5, label: 'Zero', detail: 'Built into React. Zero bundle cost. Cannot be smaller or more efficient.' },
      { score: 5, label: 'Trivial', detail: 'The first React hook every developer learns. No concepts beyond the hook itself.' },
    ],
    bestFor: ['Local component state', 'Form inputs', 'Toggle states', 'Simple UI state'],
    worstFor: ['Shared/global state', 'Complex state interactions', 'Large component trees', 'Any non-trivial app'],
    bundleSize: '0KB (built-in)',
  },
]

const CATEGORIES = [
  { key: 'Boilerplate', short: 'Boilerplate' },
  { key: 'Performance', short: 'Performance' },
  { key: 'DevTools', short: 'DevTools' },
  { key: 'Middleware', short: 'Middleware' },
  { key: 'Bundle Size', short: 'Bundle' },
  { key: 'Learning Curve', short: 'Learning' },
]

export default function StateCompareDemo() {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [expandedSystem, setExpandedSystem] = useState<number | null>(null)

  return (
    <DemoBoundary name="State Management Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>State Management Comparison</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
        Interactive comparison across five approaches. Higher score is better in each category.
        Hover over cells for details.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: 12,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', minWidth: 90, position: 'sticky', left: 0, background: s.bg, zIndex: 2 }}>
                Approach
              </th>
              {CATEGORIES.map(cat => (
                <th key={cat.key} style={{ ...th, textAlign: 'center', minWidth: 80 }}>
                  {cat.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SYSTEMS.map((system, rowIdx) => (
              <tr key={system.name}
                onClick={() => setExpandedSystem(expandedSystem === rowIdx ? null : rowIdx)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{
                  ...td, fontWeight: 600, color: system.color,
                  borderLeft: `3px solid ${system.color}`,
                  position: 'sticky', left: 0, background: s.bg, zIndex: 1,
                }}>
                  {system.name}
                </td>
                {system.ratings.map((rating, colIdx) => (
                  <td key={colIdx} style={{
                    ...td, textAlign: 'center',
                    background: hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx
                      ? s.bg3 : 'transparent',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                    }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <div key={star} style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: star <= rating.score ? system.color : s.bg3,
                          transition: 'all 0.15s',
                          opacity: star <= rating.score ? 1 : 0.4,
                        }} />
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredCell && (
        <div style={{
          background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
          padding: '14px 18px', marginBottom: 20,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: SYSTEMS[hoveredCell.row].color, flexShrink: 0,
            }} />
            <span style={{ color: SYSTEMS[hoveredCell.row].color, fontSize: 14, fontWeight: 600 }}>
              {SYSTEMS[hoveredCell.row].name}
            </span>
            <span style={{ color: s.text3, fontSize: 12 }}>
              -- {CATEGORIES[hoveredCell.col].key}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <div key={star} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: star <= SYSTEMS[hoveredCell.row].ratings[hoveredCell.col].score
                  ? SYSTEMS[hoveredCell.row].color : s.bg3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, color: '#fff',
              }}>
                {star <= SYSTEMS[hoveredCell.row].ratings[hoveredCell.col].score ? '\u2713' : ''}
              </div>
            ))}
          </div>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>
            {SYSTEMS[hoveredCell.row].ratings[hoveredCell.col].detail}
          </div>
        </div>
      )}

      {expandedSystem !== null && (
        <div style={{
          background: s.bg2, borderRadius: 12, border: `1px solid ${SYSTEMS[expandedSystem].color}`,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ color: SYSTEMS[expandedSystem].color, fontSize: 14, fontWeight: 600 }}>
              {SYSTEMS[expandedSystem].name} -- Full Analysis
            </div>
            <button onClick={() => setExpandedSystem(null)} style={{
              background: 'transparent', border: 'none', color: s.text3,
              cursor: 'pointer', fontSize: 18, lineHeight: 1,
            }}>
              x
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Best For</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: s.text2, fontSize: 12, lineHeight: 1.7 }}>
                {SYSTEMS[expandedSystem].bestFor.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ color: s.red, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Not Ideal For</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: s.text2, fontSize: 12, lineHeight: 1.7 }}>
                {SYSTEMS[expandedSystem].worstFor.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
          <div style={{ color: s.text3, fontSize: 12 }}>
            Bundle Size: <span style={{ color: s.text, fontFamily: s.mono }}>
              {SYSTEMS[expandedSystem].bundleSize}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SYSTEMS.map((system, idx) => (
          <div key={system.name} style={{
            background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
            padding: '14px 16px', cursor: 'pointer',
            transition: 'border-color 0.15s',
            borderColor: expandedSystem === idx ? system.color : s.border,
          }}
            onClick={() => setExpandedSystem(expandedSystem === idx ? null : idx)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: system.color,
                flexShrink: 0,
              }} />
              <span style={{ color: system.color, fontSize: 13, fontWeight: 600 }}>{system.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {CATEGORIES.map((cat, ci) => {
                const score = system.ratings[ci].score
                return (
                  <div key={ci} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{
                      fontSize: 9, color: s.text3, marginBottom: 2,
                      textTransform: 'uppercase',
                    }}>
                      {cat.short.slice(0, 4)}
                    </div>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', margin: '0 auto',
                      background: score >= 4 ? s.green : score >= 3 ? s.yellow : s.red,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: '#fff', fontWeight: 700,
                    }}>
                      {score}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}

const th: React.CSSProperties = {
  padding: '10px 8px', color: s.text3, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 0.5,
  borderBottom: `1px solid ${s.border}`,
  fontWeight: 600,
}

const td: React.CSSProperties = {
  padding: '12px 8px', borderBottom: `1px solid ${s.border}`,
  color: s.text2, fontSize: 12,
}
