import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const subgraphs = [
  {
    name: 'Users Service',
    port: '4001',
    color: s.accent,
    types: ['User', 'Query'],
    fields: ['id', 'name', 'email'],
  },
  {
    name: 'Posts Service',
    port: '4002',
    color: s.green,
    types: ['Post', 'Comment', 'Query'],
    fields: ['id', 'title', 'body', 'author', 'comments'],
  },
]

interface Step {
  label: string
  from: number
  to: number
}

const steps: Step[] = [
  { label: 'Parse query', from: 0, to: 0 },
  { label: 'Plan: split by service', from: 0, to: 0 },
  { label: 'Fetch User from Users Service', from: 0, to: 1 },
  { label: 'User resolved: id, name, email', from: 1, to: 1 },
  { label: 'Fetch Post from Posts Service', from: 0, to: 2 },
  { label: 'Fetch author (User) for Post', from: 2, to: 1 },
  { label: 'Post resolved: title, body, author', from: 0, to: 0 },
  { label: 'Merge results into one response', from: 0, to: 0 },
]

const h: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }

export default function GraphqlFederationDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [activeLine, setActiveLine] = useState(-1)

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, steps.length))
  }, [])

  const reset = useCallback(() => {
    setStep(0)
    setActiveLine(-1)
    setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing) return
    if (step >= steps.length) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(nextStep, 700)
    return () => clearTimeout(timer)
  }, [playing, step, nextStep])

  useEffect(() => {
    if (step > 0 && step <= steps.length) {
      const st = steps[step - 1]
      if (st.label.includes('fetch') || st.label.includes('Fetch') || st.label.includes('resolved')) {
        setActiveLine(step - 1)
      }
    }
  }, [step])

  return (
    <DemoBoundary name="GraphQL Federation Gateway">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <button onClick={nextStep} disabled={step >= steps.length} style={{
          background: step >= steps.length ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
          padding: '10px 20px', color: step >= steps.length ? s.text3 : '#fff',
          cursor: step >= steps.length ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>Next Step</button>
        <button onClick={() => setPlaying(!playing)} style={{
          background: playing ? s.red : s.green, border: 'none', borderRadius: 8,
          padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>{playing ? 'Stop' : 'Auto Play'}</button>
        <button onClick={reset} style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '10px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
        <div style={{ marginLeft: 'auto', color: s.text3, fontFamily: s.mono, fontSize: 12 }}>
          Step {step}/{steps.length}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{
          flex: 1, background: s.bg2, borderRadius: 12, padding: '16px 18px',
          border: step > 0 ? `1px solid ${s.accent}` : `1px solid ${s.border}`,
          transition: 'border-color 0.3s',
        }}>
          <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Gateway (Supergraph)</div>
          <div style={{
            fontFamily: s.mono, fontSize: 12, color: s.text, lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {`query {\n  user(id: "1") {\n    name\n    email\n    posts {\n      title\n      body\n      author { name }\n    }\n  }\n}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {subgraphs.map((sg, i) => {
          const isActive = steps.slice(0, step).some(
            (st) => st.to === i + 1 || (st.to === 0 && st.label.includes(sg.name.split(' ')[0]))
          )
          return (
            <div key={sg.name} style={{
              flex: 1, background: s.bg2, borderRadius: 12, padding: '14px 16px',
              border: `1px solid ${isActive ? sg.color : s.border}`,
              transition: 'all 0.3s',
              opacity: isActive ? 1 : 0.7,
            }}>
              <div style={{
                color: sg.color, fontSize: 12, fontWeight: 600, marginBottom: 6,
              }}>
                {sg.name}
              </div>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6 }}>
                Port {sg.port} | Types: {sg.types.join(', ')}
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
                <div style={{ color: s.text3, marginBottom: 2 }}>schema {`{`}</div>
                <div style={{ paddingLeft: 12, color: s.accent }}>
                  @key(fields: "id")
                </div>
                <div style={{ paddingLeft: 12 }}>type {sg.name.split(' ')[0]}Type {`{`}</div>
                {sg.fields.map((f) => (
                  <div key={f} style={{ paddingLeft: 24, color: s.text2 }}>{f}: ...</div>
                ))}
                <div style={{ paddingLeft: 12 }}>{`}`}</div>
                <div>{`}`}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Execution Trace
        </div>
        {steps.map((st, i) => {
          const done = i < step
          const current = i === step - 1
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
              color: done ? s.text : s.text3,
              borderLeft: current ? `2px solid ${s.accent}` : '2px solid transparent',
              paddingLeft: 8,
              background: current ? `${s.accent}11` : 'transparent',
              borderRadius: 4,
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: done ? s.green : s.bg3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? '#fff' : s.text3,
                fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>
                {done ? '\u2713' : i + 1}
              </div>
              <span style={{ flex: 1, fontSize: 13 }}>{st.label}</span>
              {done && st.to > 0 && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4,
                  background: subgraphs[st.to - 1].color + '22',
                  color: subgraphs[st.to - 1].color,
                  fontFamily: s.mono,
                }}>
                  {subgraphs[st.to - 1].name}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </DemoBoundary>
  )
}
