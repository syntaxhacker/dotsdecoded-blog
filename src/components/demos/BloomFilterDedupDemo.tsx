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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

function hashFNV(str: string, seed: number): number {
  let h = seed
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h
}

function hashJenkins(str: string, seed: number): number {
  let h = seed
  for (let i = 0; i < str.length; i++) { h += str.charCodeAt(i); h += h << 10; h ^= h >> 6; h >>>= 0 }
  h += h << 3; h ^= h >> 11; h += h << 15; return h >>> 0
}

function getPositions(url: string, m: number, k: number): number[] {
  const pos: number[] = []
  for (let i = 0; i < k; i++) {
    const h1 = hashFNV(url, i * 12345 + 67890)
    const h2 = hashJenkins(url, i * 54321 + 98765)
    pos.push((h1 ^ h2) >>> 0 % m)
  }
  return pos
}

function BloomFilterInner() {
  const [m, setM] = useState(32)
  const [k, setK] = useState(3)
  const [bits, setBits] = useState<boolean[]>(Array(32).fill(false))
  const [inputUrl, setInputUrl] = useState('')
  const [result, setResult] = useState<{ url: string; positions: number[]; found: boolean } | null>(null)
  const [addedCount, setAddedCount] = useState(0)

  const hashes = useMemo(() => {
    if (!inputUrl) return null
    return getPositions(inputUrl, m, k)
  }, [inputUrl, m, k])

  const bitsSet = bits.filter(Boolean).length
  const fillRatio = m > 0 ? bitsSet / m : 0
  const fpp = Math.pow(1 - Math.pow(Math.E, -k * addedCount / m), k)

  const check = () => {
    if (!inputUrl || !hashes) return
    const found = hashes.every(pos => bits[pos])
    setResult({ url: inputUrl, positions: [...hashes], found })
  }

  const markVisited = () => {
    if (!inputUrl || !hashes) return
    setBits(prev => {
      const next = [...prev]
      hashes.forEach(pos => { next[pos] = true })
      return next
    })
    setAddedCount(prev => prev + 1)
    const found = hashes.every(pos => bits[pos])
    setResult({ url: inputUrl, positions: [...hashes], found })
  }

  const reset = () => {
    setBits(Array(m).fill(false))
    setAddedCount(0)
    setResult(null)
  }

  const colWidths: number[] = []
  for (let i = 0; i < m; i++) {
    const perRow = m <= 32 ? 32 : m <= 64 ? 64 : 128
    if (i % perRow === 0) colWidths.push(0)
  }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '16px 0' }}>
      <div style={SEC}>
        <div style={H}>Bloom Filter Deduplication</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A space-efficient probabilistic data structure for set membership. False positives are possible, false negatives are not.
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Bit Array Size (m)</label>
            <input type="range" min={8} max={128} value={m} onChange={e => {
              const newM = Number(e.target.value)
              setBits(prev => { const next = Array(newM).fill(false); for (let i = 0; i < Math.min(prev.length, newM); i++) next[i] = prev[i]; return next })
              setM(newM); setResult(null)
            }} style={{ width: '100%', accentColor: s.accent }} />
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{m} bits</span>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Hash Functions (k)</label>
            <input type="range" min={1} max={8} value={k} onChange={e => { setK(Number(e.target.value)); setResult(null) }} style={{ width: '100%', accentColor: s.green }} />
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{k} hashes</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 16, justifyContent: 'center' }}>
          {bits.map((b, i) => {
            const isHL = result && result.positions.includes(i)
            return (
              <div key={i} style={{
                width: m > 64 ? 10 : 14, height: m > 64 ? 10 : 14, borderRadius: 3,
                background: b ? (isHL ? s.yellow : s.accent) : (isHL ? s.orange : s.bg3),
                border: `1px solid ${isHL ? s.orange : s.border}`,
                transition: 'all 0.2s',
              }} />
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={inputUrl} onChange={e => setInputUrl(e.target.value)} placeholder="Enter a URL to check..."
            onKeyDown={e => { if (e.key === 'Enter') check() }}
            style={{
              flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 14px', color: s.text, fontSize: 13, fontFamily: s.mono, outline: 'none',
            }} />
          <button onClick={check} disabled={!inputUrl} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 16px',
            color: '#fff', cursor: inputUrl ? 'pointer' : 'default', fontSize: 12, fontWeight: 600,
            opacity: inputUrl ? 1 : 0.5,
          }}>Check</button>
          <button onClick={markVisited} disabled={!inputUrl} style={{
            background: s.green, border: 'none', borderRadius: 8, padding: '10px 16px',
            color: '#fff', cursor: inputUrl ? 'pointer' : 'default', fontSize: 12, fontWeight: 600,
            opacity: inputUrl ? 1 : 0.5,
          }}>Mark Visited</button>
        </div>

        {result && (
          <div style={{
            background: s.bg, border: `1px solid ${result.found ? s.yellow : s.green}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ color: result.found ? s.yellow : s.green, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {result.found ? 'Probably visited (may be false positive)' : 'Definitely not visited'}
            </div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
              Hash positions: [{result.positions.join(', ')}]
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{addedCount}</div>
            <div style={{ color: s.text3, fontSize: 10 }}>Items</div>
          </div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{bitsSet}/{m}</div>
            <div style={{ color: s.text3, fontSize: 10 }}>Bits Set</div>
          </div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{(fillRatio * 100).toFixed(1)}%</div>
            <div style={{ color: s.text3, fontSize: 10 }}>Fill Ratio</div>
          </div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{(fpp * 100).toFixed(1)}%</div>
            <div style={{ color: s.text3, fontSize: 10 }}>False Pos. Prob.</div>
          </div>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px',
            color: s.text2, cursor: 'pointer', fontSize: 12, alignSelf: 'center',
          }}>Reset</button>
        </div>
      </div>
    </div>
  )
}

export default function BloomFilterDedupDemo() {
  return (
    <DemoBoundary name="Bloom Filter Deduplication">
      <BloomFilterInner />
    </DemoBoundary>
  )
}
