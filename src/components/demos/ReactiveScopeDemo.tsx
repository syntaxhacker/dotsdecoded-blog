import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const CODE = [
  'function UserProfile({ user, theme }) {',
  '  const greeting = `Hello, ${user.name}!`',
  '  const items = user.items.map(i => i.title)',
  '  const styled = { color: theme.accent, bg: theme.bg }',
  '  return (',
  '    <div style={styled}>',
  '      <h1>{greeting}</h1>',
  '      <List items={items} />',
  '    </div>',
  '  )',
  '}',
]

const SCOPES = [
  { id: 1, lines: [1], deps: ['userName'], label: 'greeting', slot: '$[0]', color: s.accent },
  { id: 2, lines: [2], deps: ['userItems'], label: 'items', slot: '$[1]', color: s.purple },
  { id: 3, lines: [3], deps: ['theme'], label: 'styled', slot: '$[2]', color: s.orange },
  { id: 4, lines: [4, 5, 6, 7, 8, 9], deps: ['scope1', 'scope2', 'scope3'], label: 'JSX return', slot: '$[3]', color: s.green },
]

const LINE_SCOPE: Record<number, (typeof SCOPES)[number]> = {}
SCOPES.forEach(sc => sc.lines.forEach(ln => { LINE_SCOPE[ln] = sc }))

const INPUTS = [
  { key: 'userName', label: 'user.name changed' },
  { key: 'userItems', label: 'user.items changed' },
  { key: 'theme', label: 'theme changed' },
]

function computeInvalidated(changed: Set<string>): Set<number> {
  const s1 = changed.has('userName')
  const s2 = changed.has('userItems')
  const s3 = changed.has('theme')
  const s4 = s1 || s2 || s3
  const r = new Set<number>()
  if (s1) r.add(1)
  if (s2) r.add(2)
  if (s3) r.add(3)
  if (s4) r.add(4)
  return r
}

const LINE_H = 26

export default function ReactiveScopeDemo() {
  const [changes, setChanges] = useState<Set<string>>(new Set())
  const [pulsing, setPulsing] = useState<Set<number>>(new Set())
  const [stats, setStats] = useState({ renders: 0, computations: 0, saved: 0 })
  const prevInv = useRef<Set<number>>(new Set())

  const invalidated = useMemo(() => computeInvalidated(changes), [changes])
  const invCount = invalidated.size
  const savedCount = 4 - invCount

  useEffect(() => {
    const newPulse = new Set<number>()
    invalidated.forEach(id => {
      if (!prevInv.current.has(id)) newPulse.add(id)
    })
    prevInv.current = new Set(invalidated)
    if (newPulse.size > 0) {
      setPulsing(newPulse)
      const t = setTimeout(() => setPulsing(new Set()), 700)
      return () => clearTimeout(t)
    }
    setPulsing(new Set())
  }, [invalidated])

  const toggle = useCallback((key: string) => {
    setChanges(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      const inv = computeInvalidated(next)
      setStats(st => ({
        renders: st.renders + 1,
        computations: st.computations + inv.size,
        saved: st.saved + (4 - inv.size),
      }))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setChanges(new Set())
    setStats({ renders: 0, computations: 0, saved: 0 })
    prevInv.current = new Set()
  }, [])

  const highlighted = useMemo(() =>
    Prism.highlight(CODE.join('\n'), Prism.languages.javascript, 'javascript').split('\n'),
    []
  )

  const summaryText = useMemo(() => {
    if (changes.size === 0) {
      return 'No inputs changed. All 4 scopes use cached values. 4 out of 4 computations saved.'
    }
    const labels = INPUTS.filter(inp => changes.has(inp.key)).map(inp => inp.label.replace(' changed', ''))
    const prefix = labels.length === 1
      ? `With ${labels[0]} changed: `
      : `With ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]} changed: `
    const reevalScopes = SCOPES.filter(sc => invalidated.has(sc.id))
    const cachedScopes = SCOPES.filter(sc => !invalidated.has(sc.id))
    const reevalStr = reevalScopes.length === 4
      ? 'All 4 scopes re-evaluate'
      : reevalScopes.map(sc => `Scope ${sc.id} (${sc.label})`).join(' and ') + ' re-evaluate'
    const cachedStr = cachedScopes.length > 0
      ? ` ${cachedScopes.map(sc => `Scope ${sc.id}`).join(' and ')} ${cachedScopes.length === 1 ? 'uses' : 'use'} cached values.`
      : ''
    return `${prefix}${reevalStr}.${cachedStr} ${savedCount} out of 4 computations saved.`
  }, [changes, invalidated, savedCount])

  return (
    <DemoBoundary name="Reactive Scope Demo">
      <style>{`
        @keyframes scopePulse {
          0% { opacity: 1; }
          40% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        @keyframes lineFlash {
          0% { background-color: rgba(232, 93, 93, 0.22); }
          100% { background-color: rgba(232, 93, 93, 0.06); }
        }
      `}</style>
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 4 }}>
            Reactive Scope Analysis
          </div>
          <div style={{ fontSize: 13, color: s.text2 }}>
            Toggle inputs to see which scopes the compiler re-evaluates
          </div>
        </div>

        <div style={{
          margin: '16px 24px',
          backgroundColor: s.bg2,
          borderRadius: 8,
          border: `1px solid ${s.border}`,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', gap: 14, padding: '10px 14px',
            borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap',
          }}>
            {SCOPES.map(sc => {
              const inv = invalidated.has(sc.id)
              return (
                <div key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: inv ? s.red : sc.color,
                    opacity: inv ? 1 : 0.5,
                    transition: 'all 0.3s',
                    animation: pulsing.has(sc.id) ? 'scopePulse 0.6s ease-out' : 'none',
                  }} />
                  <span style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>
                    S{sc.id}: {sc.label}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, fontFamily: s.mono,
                    color: inv ? s.red : s.green,
                    transition: 'color 0.3s',
                  }}>
                    {inv ? 'RE-EVAL' : 'CACHED'}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            {SCOPES.map(sc => {
              const top = sc.lines[0] * LINE_H
              const height = (sc.lines[sc.lines.length - 1] - sc.lines[0] + 1) * LINE_H
              const inv = invalidated.has(sc.id)
              return (
                <div key={sc.id} style={{
                  position: 'absolute', left: 0, top, width: 3, height,
                  backgroundColor: inv ? s.red : sc.color,
                  opacity: inv ? 0.85 : 0.3,
                  borderRadius: '0 2px 2px 0',
                  transition: 'all 0.3s',
                  animation: pulsing.has(sc.id) ? 'scopePulse 0.6s ease-out' : 'none',
                }} />
              )
            })}
            {highlighted.map((html, idx) => {
              const sc = LINE_SCOPE[idx]
              const inv = sc ? invalidated.has(sc.id) : false
              return (
                <div key={idx} style={{
                  paddingLeft: 14, paddingRight: 14, height: LINE_H,
                  display: 'flex', alignItems: 'center',
                  backgroundColor: inv
                    ? 'rgba(232, 93, 93, 0.06)'
                    : sc ? `${sc.color}05` : 'transparent',
                  animation: sc && pulsing.has(sc.id) ? 'lineFlash 0.6s ease-out forwards' : 'none',
                  transition: sc ? 'background-color 0.3s' : undefined,
                }}>
                  <span style={{
                    width: 26, fontSize: 11, color: s.text3,
                    fontFamily: s.mono, userSelect: 'none', flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>
                  <code style={{
                    fontFamily: s.mono, fontSize: 13, color: s.text, whiteSpace: 'pre',
                  }} dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          padding: '0 24px 16px', display: 'flex',
          alignItems: 'center', gap: 18, flexWrap: 'wrap',
        }}>
          {INPUTS.map(inp => {
            const on = changes.has(inp.key)
            return (
              <div
                key={inp.key}
                onClick={() => toggle(inp.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', userSelect: 'none',
                  color: on ? s.text : s.text2, transition: 'color 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `2px solid ${on ? s.accent : s.border2}`,
                  backgroundColor: on ? s.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, fontFamily: s.mono }}>{inp.label}</span>
              </div>
            )
          })}
          <button onClick={reset} style={{
            marginLeft: 'auto', padding: '6px 14px', fontSize: 12,
            fontFamily: s.mono, color: s.text2, backgroundColor: s.bg3,
            border: `1px solid ${s.border}`, borderRadius: 6, cursor: 'pointer',
          }}>
            Reset
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, padding: '0 24px 20px' }}>
          <div style={{
            flex: 1, backgroundColor: s.bg2, borderRadius: 8,
            border: `1px solid ${s.border}`, overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: `1px solid ${s.border}`,
              fontSize: 13, fontWeight: 600, color: s.text,
            }}>
              Memo Cache
            </div>
            {SCOPES.map(sc => {
              const inv = invalidated.has(sc.id)
              return (
                <div key={sc.id} style={{
                  display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 10,
                  borderBottom: sc.id < 4 ? `1px solid ${s.border}30` : 'none',
                }}>
                  <span style={{
                    fontSize: 12, fontFamily: s.mono, color: sc.color, width: 30, flexShrink: 0,
                  }}>
                    {sc.slot}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text2, flex: 1 }}>
                    {sc.label}
                  </span>
                  <span style={{
                    fontSize: 11, fontFamily: s.mono, fontWeight: 600,
                    color: inv ? s.red : s.green,
                    padding: '2px 8px', borderRadius: 4,
                    backgroundColor: inv ? 'rgba(232,93,93,0.12)' : 'rgba(61,214,140,0.12)',
                    transition: 'all 0.3s',
                  }}>
                    {inv ? 'RECOMPUTE' : 'CACHED'}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{
            flex: 1, backgroundColor: s.bg2, borderRadius: 8,
            border: `1px solid ${s.border}`, padding: '14px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>Analysis</div>
            <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, flex: 1 }}>
              {summaryText}
            </div>
            <div style={{ height: 6, backgroundColor: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(savedCount / 4) * 100}%`,
                backgroundColor: s.green,
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: s.text3, fontFamily: s.mono,
            }}>
              <span>{savedCount}/4 cached</span>
              <span>{invCount}/4 recompute</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 24px', borderTop: `1px solid ${s.border}`,
          display: 'flex', gap: 24,
          fontSize: 11, color: s.text3, fontFamily: s.mono,
        }}>
          <span>Re-renders: {stats.renders}</span>
          <span>Computations: {stats.computations}</span>
          <span>Saved: {stats.saved}</span>
          {stats.renders > 0 && (
            <span style={{ color: s.green }}>
              {Math.round(stats.saved / (stats.computations + stats.saved) * 100)}% cache hit rate
            </span>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
