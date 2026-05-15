import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function QuorumDemo() {
  const [n, setN] = useState(3)
  const [w, setW] = useState(2)
  const [r, setR] = useState(2)

  const guaranteed = r + w > n

  return (
    <DemoBoundary name="Quorum Consistency">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>Quorum Rule: R + W {'>'} N</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            A read quorum (R) and write quorum (W) that overlap guarantee every read sees the latest write.
          </p>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>N (replicas)</label>
              <input type="range" min={1} max={7} value={n} onChange={e => setN(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{n}</span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>W (write quorum)</label>
              <input type="range" min={1} max={n} value={Math.min(w, n)} onChange={e => setW(Number(e.target.value))} style={{ width: '100%', accentColor: s.green }} />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{Math.min(w, n)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>R (read quorum)</label>
              <input type="range" min={1} max={n} value={Math.min(r, n)} onChange={e => setR(Number(e.target.value))} style={{ width: '100%', accentColor: s.yellow }} />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{Math.min(r, n)}</span>
            </div>
          </div>
          <div style={{
            padding: '16px 20px', borderRadius: 10, textAlign: 'center',
            background: s.bg, border: `2px solid ${guaranteed ? s.green : s.red}`,
          }}>
            <div style={{ fontFamily: s.mono, fontSize: 28, fontWeight: 700, color: guaranteed ? s.green : s.red, marginBottom: 8 }}>
              R + W = {Math.min(r, n)} + {Math.min(w, n)} = {Math.min(r, n) + Math.min(w, n)} {'>'} N = {n}
            </div>
            <div style={{ color: s.text2, fontSize: 14 }}>
              {guaranteed
              ? 'R + W > N holds. Read and write sets always overlap. Consistency guaranteed.'
              : 'R + W <= N. Overlap is not guaranteed. Reads may return stale data.'}
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            {[1, 2, 3, 4, 5, 6, 7].slice(0, n).map(i => (
              <div key={i} style={{
                flex: 1, height: 40, borderRadius: 6,
                background: `hsl(${i * 50}, 50%, 30%)`, opacity: 0.8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: s.mono, fontSize: 10,
              }}>
                N{i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
