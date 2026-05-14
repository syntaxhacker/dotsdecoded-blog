import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const W = 640
const T_MAX = 500

interface Resource {
  label: string
  start: number
  end: number
  blocking: boolean
}

function calc(inlineCss: boolean, scriptMode: string, preload: boolean): { resources: Resource[]; firstPaint: number } {
  const resources: Resource[] = []
  resources.push({ label: 'HTML', start: 0, end: 100, blocking: true })

  if (!inlineCss) {
    const cssStart = preload ? 10 : 40
    const cssEnd = cssStart + 200
    resources.push({ label: 'CSS', start: cssStart, end: cssEnd, blocking: true })
  }

  if (scriptMode === 'blocking') {
    const jsStart = 60
    let jsEnd = jsStart + 300
    if (!inlineCss) {
      const cssEnd = (preload ? 10 : 40) + 200
      jsEnd = Math.max(jsEnd, cssEnd + 60)
    }
    resources.push({ label: 'JS (blocking)', start: jsStart, end: jsEnd, blocking: true })
  } else if (scriptMode === 'async') {
    resources.push({ label: 'JS (async)', start: 60, end: 260, blocking: false })
  } else if (scriptMode === 'defer') {
    resources.push({ label: 'JS (defer)', start: 60, end: 260, blocking: false })
  }

  let fp = 100
  for (const res of resources) {
    if (res.blocking) {
      fp = Math.max(fp, res.end)
    }
  }

  return { resources, firstPaint: fp }
}

const RES_COLORS: Record<string, string> = {
  'HTML': s.accent,
  'CSS': s.red,
  'JS (blocking)': s.red,
  'JS (async)': s.green,
  'JS (defer)': s.green,
}

const LBLS = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]

export default function CriticalPathDemo() {
  const [inlineCss, setInlineCss] = useState(false)
  const [scriptMode, setScriptMode] = useState<'blocking' | 'async' | 'defer'>('blocking')
  const [preload, setPreload] = useState(false)

  const { resources, firstPaint } = useMemo(() => calc(inlineCss, scriptMode, preload), [inlineCss, scriptMode, preload])

  const x = (ms: number) => (ms / T_MAX) * W

  return (
    <DemoBoundary name="Critical Rendering Path">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          Critical Rendering Path
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CSS</div>
            <button onClick={() => setInlineCss(!inlineCss)} style={{
              padding: '6px 14px', borderRadius: 6, border: `1px solid ${inlineCss ? s.green : s.border}`,
              background: inlineCss ? `${s.green}18` : s.bg, color: inlineCss ? s.green : s.text2,
              fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
            }}>{inlineCss ? 'Inlined' : 'External'}</button>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Script</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['blocking', 'async', 'defer'] as const).map(m => (
                <button key={m} onClick={() => setScriptMode(m)} style={{
                  padding: '6px 12px', borderRadius: 6, border: `1px solid ${scriptMode === m ? s.accent : s.border}`,
                  background: scriptMode === m ? `${s.accent}18` : s.bg, color: scriptMode === m ? s.accent : s.text2,
                  fontSize: 12, cursor: 'pointer', fontWeight: scriptMode === m ? 600 : 400, transition: 'all .15s',
                }}>{m === 'blocking' ? '<script>' : `<script ${m}>`}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preload</div>
            <button onClick={() => setPreload(!preload)} style={{
              padding: '6px 14px', borderRadius: 6, border: `1px solid ${preload ? s.accent : s.border}`,
              background: preload ? `${s.accent}18` : s.bg, color: preload ? s.accent : s.text2,
              fontSize: 12, cursor: 'pointer', fontWeight: preload ? 600 : 400, transition: 'all .15s',
            }}>{preload ? 'On' : 'Off'}</button>
          </div>
        </div>

        <div style={{ position: 'relative', width: W, height: 200, margin: '0 auto', overflow: 'hidden' }}>
          {LBLS.map(t => (
            <div key={t} style={{
              position: 'absolute', left: x(t), top: 0, bottom: 0,
              borderLeft: `1px solid ${t % 100 === 0 ? s.border2 : s.border}`,
              opacity: t % 100 === 0 ? 1 : 0.4,
            }} />
          ))}

          {LBLS.map(t => (
            <div key={`lbl-${t}`} style={{
              position: 'absolute', left: x(t) - 14, top: 0,
              width: 28, textAlign: 'center',
              color: s.text3, fontSize: 9, fontFamily: s.mono,
            }}>{t}ms</div>
          ))}

          {resources.map((res, i) => {
            const left = x(res.start)
            const w = x(res.end) - x(res.start)
            const top = 30 + i * 40
            return (
              <div key={res.label} style={{
                position: 'absolute', left, top, width: w, height: 28,
                background: RES_COLORS[res.label] || s.accent,
                borderRadius: 4, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 10, fontWeight: 600,
                color: '#fff', opacity: 0.9,
                transition: 'all 0.3s ease',
              }}>
                {w > 60 ? res.label : ''}
              </div>
            )
          })}

          <div style={{
            position: 'absolute', left: x(firstPaint), top: 140, width: 2,
            bottom: 0, background: s.yellow, zIndex: 5,
          }} />

          <div style={{
            position: 'absolute', left: x(firstPaint), top: 145,
            transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          }}>
            <div style={{
              background: s.yellow, color: '#000', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 4, fontFamily: s.mono,
            }}>
              First Paint: {firstPaint}ms
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 20, justifyContent: 'center', fontSize: 12 }}>
          <div style={{ color: s.text3 }}>Time to First Paint: <span style={{ color: s.yellow, fontFamily: s.mono, fontWeight: 700 }}>{firstPaint}ms</span></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.red, display: 'inline-block' }} />
            <span style={{ color: s.text3 }}>render-blocking</span>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.green, display: 'inline-block' }} />
            <span style={{ color: s.text3 }}>non-blocking</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
