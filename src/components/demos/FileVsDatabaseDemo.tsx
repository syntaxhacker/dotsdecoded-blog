import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const rows = [
  { id: 1, name: 'Alice Chen', email: 'alice@corp.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@webmail.io' },
  { id: 3, name: 'Carol Wu', email: 'carol@startup.co' },
  { id: 4, name: 'Dan Lee', email: 'dan@dev.tech' },
  { id: 5, name: 'Eve Park', email: 'eve@company.org' },
  { id: 6, name: 'Frank Kim', email: 'frank@cloud.dev' },
  { id: 7, name: 'Grace Liu', email: 'grace@data.ai' },
  { id: 8, name: 'Hank Zhao', email: 'hank@service.net' },
]

const TARGET = 4

type Phase = 'idle' | 'searching' | 'complete'

export default function FileVsDatabaseDemo() {
  const [count, setCount] = useState(10000)
  const [query, setQuery] = useState('eve@company.org')
  const [phase, setPhase] = useState<Phase>('idle')
  const [scanned, setScanned] = useState(0)
  const [hlRow, setHlRow] = useState(-1)
  const [found, setFound] = useState(false)
  const [dbStep, setDbStep] = useState(-1)
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dbRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [speed, setSpeed] = useState(1)
  const scanStateRef = useRef({ cur: 0, vi: 0 })

  const foundAt = Math.floor(count * 0.6)

  useEffect(() => {
    return () => {
      if (scanRef.current) clearInterval(scanRef.current)
      dbRef.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (phase === 'searching' && found && dbStep >= 2) {
      const t = setTimeout(() => setPhase('complete'), getStepDelay(500, speed))
      return () => clearTimeout(t)
    }
  }, [phase, found, dbStep, speed])

  const doSearch = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('searching')
    setScanned(0)
    setHlRow(-1)
    setFound(false)
    setDbStep(-1)
    scanStateRef.current = { cur: 0, vi: 0 }
  }, [phase])

  const doReset = () => {
    if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null }
    dbRef.current.forEach(clearTimeout)
    dbRef.current = []
    setPhase('idle')
    setScanned(0)
    setHlRow(-1)
    setFound(false)
    setDbStep(-1)
  }

  useEffect(() => {
    if (phase !== 'searching' || found) {
      if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null }
      return
    }
    if (scanRef.current) clearInterval(scanRef.current)
    const dur = Math.min(6000, Math.max(1500, 1500 + Math.log10(Math.max(10, count / 100)) * 1500))
    const tick = getStepDelay(25, speed)
    const totalTicks = Math.ceil(dur / tick)
    const inc = Math.max(1, Math.ceil(count / totalTicks))
    scanRef.current = setInterval(() => {
      const st = scanStateRef.current
      st.cur += inc
      st.vi = (st.vi + 1) % 8
      if (st.cur >= foundAt) {
        setScanned(foundAt)
        setHlRow(TARGET)
        setFound(true)
        if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null }
        return
      }
      setScanned(st.cur)
      setHlRow(st.vi)
    }, tick)
    return () => {
      if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null }
    }
  }, [phase, speed, found, count, foundAt])

  useEffect(() => {
    if (phase !== 'searching') return
    dbRef.current.forEach(clearTimeout)
    dbRef.current = [
      setTimeout(() => setDbStep(0), getStepDelay(200, speed)),
      setTimeout(() => setDbStep(1), getStepDelay(700, speed)),
      setTimeout(() => setDbStep(2), getStepDelay(1200, speed)),
    ]
    return () => {
      dbRef.current.forEach(clearTimeout)
      dbRef.current = []
    }
  }, [phase, speed])

  const fileMs = count * 0.01
  const fileLabel = fileMs >= 1000 ? `${(fileMs / 1000).toFixed(1)} s` : `${fileMs.toFixed(1)} ms`
  const speedup = Math.round(fileMs / 0.3)
  const pct = count > 0 ? Math.min(100, (scanned / count) * 100) : 0

  const nFill = (step: number, onPath: boolean) => {
    if (!onPath || dbStep < step) return s.bg
    if (dbStep === step) return 'rgba(91,141,239,0.15)'
    return 'rgba(61,214,140,0.15)'
  }
  const nStroke = (step: number, onPath: boolean) => {
    if (!onPath || dbStep < step) return s.border
    if (dbStep === step) return s.accent
    return s.green
  }
  const pColor = (activeAt: number) => {
    if (dbStep < activeAt) return s.border
    if (dbStep === activeAt) return s.accent
    return s.green
  }
  const nText = (step: number, onPath: boolean) => {
    if (!onPath || dbStep < step) return s.text3
    if (dbStep === step) return s.accent
    return s.green
  }
  const nVal = (step: number, onPath: boolean) => {
    if (!onPath || dbStep < step) return s.text2
    if (dbStep === step) return s.text
    return s.green
  }

  return (
    <DemoBoundary name="Files vs Database">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: '16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: s.bg2, borderRadius: 8, padding: '10px 16px', border: `1px solid ${s.border}` }}>
            <span style={{ fontSize: 13, color: s.text2, whiteSpace: 'nowrap' }}>Number of records</span>
            <input type="range" min={100} max={1000000} step={100} value={count}
              onChange={e => phase === 'idle' && setCount(Number(e.target.value))}
              style={{ flex: 1, accentColor: s.accent, height: 6 }} disabled={phase !== 'idle'} />
            <span style={{ fontFamily: s.mono, fontSize: 13, color: s.accent, minWidth: 80, textAlign: 'right' }}>
              {count.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Find user by email..."
              disabled={phase !== 'idle'}
              style={{
                flex: 1, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
                padding: '10px 14px', color: s.text, fontFamily: s.mono, fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }} />
            <button onClick={phase === 'idle' ? doSearch : doReset}
              style={{
                background: phase === 'idle' ? s.accent : phase === 'searching' ? s.bg3 : s.green,
                border: 'none', borderRadius: 8, padding: '10px 22px', color: '#fff',
                cursor: phase === 'searching' ? 'wait' : 'pointer', fontWeight: 600, fontSize: 13,
                whiteSpace: 'nowrap', transition: 'background 0.2s',
              }}>
              {phase === 'idle' ? 'Search' : phase === 'searching' ? 'Searching...' : 'Reset'}
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: s.bg2, borderRadius: 10, padding: 14, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Flat File (CSV)</div>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 10 }}>Linear scan: check every row</div>

            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1.3fr', gap: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <span>#</span><span>Name</span><span>Email</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 10 }}>
              {rows.map((r, i) => {
                const active = !found && hlRow === i
                const hit = found && i === TARGET
                return (
                  <div key={r.id} style={{
                    display: 'grid', gridTemplateColumns: '32px 1fr 1.3fr', gap: 6,
                    padding: '4px 8px', borderRadius: 4, fontSize: 12, fontFamily: s.mono,
                    background: hit ? 'rgba(61,214,140,0.12)' : active ? 'rgba(91,141,239,0.1)' : 'transparent',
                    borderLeft: `3px solid ${hit ? s.green : active ? s.accent : 'transparent'}`,
                    color: hit ? s.green : active ? s.text : s.text2,
                    transition: 'background 0.1s',
                  }}>
                    <span>{r.id}</span><span>{r.name}</span><span>{r.email}</span>
                  </div>
                )
              })}
              <div style={{ textAlign: 'center', color: s.text3, fontSize: 11, padding: '4px 0', fontFamily: s.mono }}>
                ... {Math.max(0, count - 8).toLocaleString()} more rows
              </div>
            </div>

            {(phase === 'searching' || phase === 'complete') && (
              <div>
                <div style={{ fontSize: 12, fontFamily: s.mono, color: found ? s.green : s.text2, marginBottom: 6 }}>
                  {found
                    ? `Found at row ${foundAt.toLocaleString()}`
                    : `Checking row ${scanned.toLocaleString()}...`}
                </div>
                <div style={{ height: 4, background: s.bg3, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: found ? s.green : s.accent,
                    borderRadius: 2, transition: 'width 0.05s linear',
                  }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: s.bg2, borderRadius: 10, padding: 14, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Database with Index</div>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 10 }}>B-tree index: logarithmic lookup</div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="320" height="175" viewBox="0 0 320 175">
                <line x1="160" y1="42" x2="80" y2="64" stroke={s.border} strokeWidth="1.5" />
                <line x1="160" y1="42" x2="240" y2="64" stroke={pColor(0)} strokeWidth="1.5" />
                <line x1="80" y1="96" x2="40" y2="126" stroke={s.border} strokeWidth="1" />
                <line x1="80" y1="96" x2="120" y2="126" stroke={s.border} strokeWidth="1" />
                <line x1="240" y1="96" x2="200" y2="126" stroke={pColor(1)} strokeWidth="1.5" />
                <line x1="240" y1="96" x2="280" y2="126" stroke={s.border} strokeWidth="1" />

                <rect x="124" y="10" width="72" height="32" rx="6" fill={nFill(0, true)} stroke={nStroke(0, true)} strokeWidth="1.5" />
                <text x="160" y="24" textAnchor="middle" fill={nText(0, true)} fontSize="9" fontFamily={s.mono}>root</text>
                <text x="160" y="37" textAnchor="middle" fill={nVal(0, true)} fontSize="13" fontWeight="600">E</text>

                <rect x="44" y="64" width="72" height="32" rx="6" fill={nFill(1, false)} stroke={nStroke(1, false)} strokeWidth="1.5" />
                <text x="80" y="78" textAnchor="middle" fill={s.text3} fontSize="9" fontFamily={s.mono}>page 1</text>
                <text x="80" y="91" textAnchor="middle" fill={s.text2} fontSize="12">A - D</text>

                <rect x="204" y="64" width="72" height="32" rx="6" fill={nFill(1, true)} stroke={nStroke(1, true)} strokeWidth="1.5" />
                <text x="240" y="78" textAnchor="middle" fill={nText(1, true)} fontSize="9" fontFamily={s.mono}>page 2</text>
                <text x="240" y="91" textAnchor="middle" fill={nVal(1, true)} fontSize="12">E - Z</text>

                <rect x="6" y="126" width="68" height="28" rx="5" fill={nFill(2, false)} stroke={nStroke(2, false)} strokeWidth="1" />
                <text x="40" y="144" textAnchor="middle" fill={s.text3} fontSize="10" fontFamily={s.mono}>alice, bob</text>

                <rect x="86" y="126" width="68" height="28" rx="5" fill={nFill(2, false)} stroke={nStroke(2, false)} strokeWidth="1" />
                <text x="120" y="144" textAnchor="middle" fill={s.text3} fontSize="10" fontFamily={s.mono}>carol, dan</text>

                <rect x="166" y="126" width="68" height="28" rx="5" fill={nFill(2, true)} stroke={nStroke(2, true)} strokeWidth="1.5" />
                <text x="200" y="144" textAnchor="middle" fill={dbStep >= 2 ? s.green : s.text2} fontSize="10" fontFamily={s.mono}>eve, frank</text>

                <rect x="246" y="126" width="68" height="28" rx="5" fill={nFill(2, false)} stroke={nStroke(2, false)} strokeWidth="1" />
                <text x="280" y="144" textAnchor="middle" fill={s.text3} fontSize="10" fontFamily={s.mono}>grace, hank</text>
              </svg>
            </div>

            {(phase === 'searching' || phase === 'complete') && (
              <div style={{ fontSize: 12, fontFamily: s.mono, color: dbStep >= 2 ? s.green : s.text2 }}>
                {dbStep < 0 && 'Preparing index lookup...'}
                {dbStep === 0 && 'Read root page (1/3)...'}
                {dbStep === 1 && 'Read internal page (2/3)...'}
                {dbStep >= 2 && 'Read leaf page (3/3) -- Found!'}
              </div>
            )}
          </div>
        </div>

        {phase === 'complete' && (
          <div style={{
            marginTop: 14, background: s.bg2, borderRadius: 10, padding: '18px 24px',
            border: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>File scan</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: s.mono, color: s.red }}>{fileLabel}</div>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>estimated</div>
            </div>
            <div style={{ width: 1, height: 44, background: s.border }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Database lookup</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: s.mono, color: s.green }}>0.3 ms</div>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>3 page reads</div>
            </div>
            <div style={{ width: 1, height: 44, background: s.border }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Speedup</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: s.mono, color: s.accent }}>{speedup.toLocaleString()}x</div>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>faster</div>
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
