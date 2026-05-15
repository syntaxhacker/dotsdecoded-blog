import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const EPOCH = 1288834974657n

export default function SnowflakeDemo() {
  const [timestampBits, setTimestampBits] = useState(41)
  const [workerBits, setWorkerBits] = useState(10)
  const [workerId, setWorkerId] = useState(1)
  const [sequence, setSequence] = useState(0)
  const [autoIncrement, setAutoIncrement] = useState(false)
  const [now, setNow] = useState(Date.now())
  const intRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const seqBits = 63 - timestampBits - workerBits
  const maxWorker = (1 << workerBits) - 1
  const maxSeq = (1 << seqBits) - 1

  useEffect(() => {
    setWorkerId(prev => Math.min(prev, maxWorker))
  }, [workerBits])

  useEffect(() => {
    setSequence(prev => Math.min(prev, maxSeq))
  }, [seqBits])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const elapsed = BigInt(now) - EPOCH
  const tsMask = (1n << BigInt(timestampBits)) - 1n
  const ts = elapsed & tsMask
  const safeWorker = Math.min(workerId, maxWorker)
  const safeSeq = Math.min(sequence, maxSeq)

  const id = (ts << BigInt(workerBits + seqBits)) | (BigInt(safeWorker) << BigInt(seqBits)) | BigInt(safeSeq)
  const idHex = id.toString(16).padStart(16, '0')
  const idBin = id.toString(2).padStart(64, '0')

  const segSign = idBin[0]
  const segTs = idBin.slice(1, 1 + timestampBits)
  const segWorker = idBin.slice(1 + timestampBits, 1 + timestampBits + workerBits)
  const segSeq = idBin.slice(1 + timestampBits + workerBits)

  const incSequence = useCallback(() => {
    setSequence(prev => prev >= maxSeq ? 0 : prev + 1)
  }, [maxSeq])

  useEffect(() => {
    if (autoIncrement) {
      intRef.current = setInterval(incSequence, 300)
      return () => { if (intRef.current) clearInterval(intRef.current) }
    } else {
      if (intRef.current) { clearInterval(intRef.current); intRef.current = null }
    }
  }, [autoIncrement, incSequence])

  const maxWorkers = 1 << workerBits
  const totalPerMs = maxWorkers * (maxSeq + 1)
  const yearsLifespan = Number((1n << BigInt(timestampBits)) / 86400000n / 365n)

  return (
    <DemoBoundary name="Snowflake ID Generator">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Snowflake 64-Bit ID Dissection
      </div>

      {/* Bit visualization */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 2, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{
            width: 28, height: 36, borderRadius: 4,
            background: s.text3, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: s.mono, fontSize: 10, color: s.bg, fontWeight: 700,
          }}>{segSign}</div>
          {segTs.split('').map((bit, i) => (
            <div key={`ts-${i}`} style={{
              width: 28, height: 36, borderRadius: 4,
              background: bit === '1' ? s.accent : `${s.accent}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: s.mono, fontSize: 10, color: bit === '1' ? '#fff' : s.text3,
              transition: 'all 0.15s',
            }}>{bit}</div>
          ))}
          {segWorker.split('').map((bit, i) => (
            <div key={`w-${i}`} style={{
              width: 28, height: 36, borderRadius: 4,
              background: bit === '1' ? s.green : `${s.green}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: s.mono, fontSize: 10, color: bit === '1' ? '#fff' : s.text3,
              transition: 'all 0.15s',
            }}>{bit}</div>
          ))}
          {segSeq.split('').map((bit, i) => (
            <div key={`seq-${i}`} style={{
              width: 28, height: 36, borderRadius: 4,
              background: bit === '1' ? s.yellow : `${s.yellow}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: s.mono, fontSize: 10, color: bit === '1' ? '#fff' : s.text3,
              transition: 'all 0.15s',
            }}>{bit}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { label: 'Sign', color: s.text3, desc: '1 bit, always 0' },
            { label: 'Timestamp', color: s.accent, desc: `${timestampBits} bits, ~${yearsLifespan}y lifespan` },
            { label: 'Worker ID', color: s.green, desc: `${workerBits} bits, ${maxWorkers} workers` },
            { label: 'Sequence', color: s.yellow, desc: `${seqBits} bits, ${maxSeq + 1}/ms per worker` },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
              <div>
                <span style={{ color: s.text, fontSize: 11, fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: s.text3, fontSize: 10, marginLeft: 4 }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px',
          fontSize: 12, fontFamily: s.mono, background: s.bg3, borderRadius: 8, padding: 12,
        }}>
          <span style={{ color: s.text3 }}>ID (dec)</span>
          <span style={{ color: s.text, wordBreak: 'break-all' }}>{id.toString()}</span>
          <span style={{ color: s.text3 }}>ID (hex)</span>
          <span style={{ color: s.text2 }}>0x{idHex}</span>
          <span style={{ color: s.text3 }}>Timestamp</span>
          <span style={{ color: s.accent }}>{ts.toString()} ({now} ms since epoch)</span>
          <span style={{ color: s.text3 }}>Worker ID</span>
          <span style={{ color: s.green }}>{safeWorker} / {maxWorker}</span>
          <span style={{ color: s.text3 }}>Sequence</span>
          <span style={{ color: s.yellow }}>{safeSeq} / {maxSeq}</span>
          <span style={{ color: s.text3 }}>Throughput</span>
          <span style={{ color: s.orange }}>{totalPerMs.toLocaleString()} IDs/ms (cluster-wide)</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 16 }}>Bit Allocation</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
              Timestamp Bits: <span style={{ color: s.accent, fontFamily: s.mono }}>{timestampBits}</span>
              <span style={{ color: s.text3, marginLeft: 8, fontSize: 11 }}>~{yearsLifespan} year lifespan</span>
            </label>
            <input type="range" min={32} max={50} value={timestampBits}
              onChange={e => {
                const t = Number(e.target.value)
                const rem = 63 - t
                const w = Math.max(2, Math.min(16, rem - 8))
                setTimestampBits(t)
                setWorkerBits(w)
              }}
              style={{ width: '100%', accentColor: s.accent }} />
          </div>
          <div>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
              Worker Bits: <span style={{ color: s.green, fontFamily: s.mono }}>{workerBits}</span>
              <span style={{ color: s.text3, marginLeft: 8, fontSize: 11 }}>Max workers: {maxWorkers}</span>
            </label>
            <input type="range" min={2} max={16} value={workerBits}
              onChange={e => {
                const w = Number(e.target.value)
                const s = 63 - timestampBits - w
                if (s >= 8) setWorkerBits(w)
              }}
              style={{ width: '100%', accentColor: s.green }} />
          </div>
          <div>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
              Sequence Bits: <span style={{ color: s.yellow, fontFamily: s.mono }}>{seqBits}</span>
              <span style={{ color: s.text3, marginLeft: 8, fontSize: 11 }}>{maxSeq + 1} IDs/ms per worker</span>
            </label>
            <div style={{ height: 8, borderRadius: 4, background: s.bg3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: `linear-gradient(90deg, ${s.yellow}, ${s.orange})`,
                width: `${(seqBits / 20) * 100}%`, transition: 'width 0.2s',
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 12 }}>Worker Controls</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ color: s.text2, fontSize: 12 }}>Worker ID:</label>
            <input type="range" min={0} max={maxWorker} value={safeWorker}
              onChange={e => setWorkerId(Number(e.target.value))}
              style={{ flex: 1, minWidth: 100, accentColor: s.green }} />
            <span style={{ color: s.green, fontFamily: s.mono, fontSize: 13, minWidth: 40, textAlign: 'right' }}>{safeWorker}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setSequence(0)} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
              color: s.text2, cursor: 'pointer', fontSize: 12,
            }}>Reset Sequence</button>
            <button onClick={incSequence} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '8px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Increment Sequence</button>
            <button onClick={() => setAutoIncrement(!autoIncrement)} style={{
              background: autoIncrement ? s.green : s.bg3, border: `1px solid ${autoIncrement ? s.green : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: autoIncrement ? '#fff' : s.text2, cursor: 'pointer', fontSize: 12,
              fontWeight: autoIncrement ? 600 : 400,
            }}>{autoIncrement ? 'Running...' : 'Auto-Increment'}</button>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 12 }}>Bit Layout</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { bits: 1, name: 'Sign', color: s.text3 },
            { bits: timestampBits, name: 'Timestamp', color: s.accent },
            { bits: workerBits, name: 'Worker', color: s.green },
            { bits: seqBits, name: 'Sequence', color: s.yellow },
            { bits: 64, name: 'Total', color: s.text },
          ].map(item => (
            <div key={item.name} style={{
              background: s.bg3, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 70,
            }}>
              <div style={{ color: item.color, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{item.bits}</div>
              <div style={{ color: s.text3, fontSize: 10 }}>{item.name}</div>
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: s.mono, fontSize: 12, color: s.text3, background: s.bg3,
          borderRadius: 8, padding: '10px 14px', lineHeight: 1.6,
        }}>
          {fmtBin(idBin, 1, timestampBits, workerBits, seqBits)}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function fmtBin(bits: string, ...groups: number[]): string {
  let result = ''
  let idx = 0
  for (const g of groups) {
    if (result) result += ' '
    result += bits.slice(idx, idx + g)
    idx += g
  }
  return result
}
