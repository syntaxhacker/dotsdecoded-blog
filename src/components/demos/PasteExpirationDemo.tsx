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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface Paste {
  id: number
  title: string
  slug: string
  expiration: string
  remaining: number
  total: number
  burned: boolean
  status: 'active' | 'expired' | 'burned'
  grace: boolean
}

function createPastes(): Paste[] {
  return [
    { id: 1, title: 'Config Snippet', slug: 'aB3x9Q', expiration: '10 min', remaining: 340, total: 600, burned: false, status: 'active', grace: false },
    { id: 2, title: 'Deploy Script', slug: 'kL7m2P', expiration: '1 hr', remaining: 2100, total: 3600, burned: false, status: 'active', grace: false },
    { id: 3, title: 'API Keys Rotate', slug: 'xY4z8R', expiration: 'Burn After Read', remaining: 0, total: 1, burned: false, status: 'active', grace: false },
    { id: 4, title: 'Debug Log', slug: 'nC5v1W', expiration: '1 day', remaining: 43200, total: 86400, burned: false, status: 'active', grace: false },
    { id: 5, title: 'Temp Migration', slug: 'hT8b6F', expiration: '1 week', remaining: 345600, total: 604800, burned: false, status: 'active', grace: false },
  ]
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return 'Expired'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const sec = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export default function PasteExpirationDemo() {
  const [pastes, setPastes] = useState<Pastes[]>(createPastes)
  const [workerTick, setWorkerTick] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [scannedId, setScannedId] = useState<number | null>(null)
  const [showBurnConfirm, setShowBurnConfirm] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPastes(prev => prev.map(p => {
        if (p.status !== 'active') return p
        const dec = p.expiration === 'Burn After Read' ? 0 : 1
        const next = Math.max(0, p.remaining - dec)
        if (next <= 0 && p.expiration !== 'Burn After Read') {
          return { ...p, remaining: 0, status: 'expired', grace: true }
        }
        return { ...p, remaining: next }
      }))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (workerTick === 0) return
    const active = pastes.filter(p => p.status === 'active' || p.grace)
    if (active.length === 0) return
    const idx = Math.floor((workerTick - 1) % active.length)
    const target = active[idx]
    setScannedId(target.id)

    const graceTimeout = setTimeout(() => {
      setPastes(prev => prev.map(p => {
        if (p.id === target.id && p.grace) {
          return { ...p, status: 'expired', grace: false }
        }
        return p
      }))
      setScannedId(null)
    }, 600)

    return () => clearTimeout(graceTimeout)
  }, [workerTick])

  const runWorker = useCallback(() => {
    if (scanning) return
    setScanning(true)
    let ticks = 0
    const interval = setInterval(() => {
      ticks++
      setWorkerTick(ticks)
      if (ticks >= 10) {
        clearInterval(interval)
        setScanning(false)
        setScannedId(null)
        setWorkerTick(0)
      }
    }, 500)
  }, [scanning])

  const burnPaste = useCallback((id: number) => {
    setPastes(prev => prev.map(p => {
      if (p.id === id && p.expiration === 'Burn After Read') {
        return { ...p, burned: true, status: 'burned' }
      }
      return p
    }))
    setShowBurnConfirm(null)
  }, [])

  const resetAll = () => {
    setPastes(createPastes())
    setWorkerTick(0)
    setScanning(false)
    setScannedId(null)
    setShowBurnConfirm(null)
  }

  return (
    <DemoBoundary name="Pastebin Expiration">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Expiration & Cleanup</div>
          <button onClick={resetAll} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Each paste has a TTL countdown. A background worker scans for expired pastes, soft-deletes them, then permanently removes them after a grace period.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {pastes.map(p => {
            const pct = p.total > 0 ? (p.remaining / p.total) * 100 : 0
            const isActive = p.status === 'active'
            const isExpired = p.status === 'expired'
            const isBurned = p.status === 'burned'
            const isScanned = scannedId === p.id

            return (
              <div key={p.id} style={{
                background: s.bg,
                border: `1px solid ${isScanned ? s.accent : isBurned ? s.red : isExpired ? s.border2 : s.border}`,
                borderRadius: 8,
                padding: '12px 16px',
                transition: 'all 0.2s ease',
                opacity: isBurned ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{p.title}</span>
                    <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, marginLeft: 8 }}>{p.slug}</span>
                    <span style={{
                      marginLeft: 8,
                      background: isBurned ? `${s.red}20` : isExpired ? `${s.red}10` : `${s.green}15`,
                      color: isBurned ? s.red : isExpired ? s.red : s.green,
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    }}>
                      {isBurned ? 'Burned' : isExpired ? 'Expired' : 'Active'}
                    </span>
                    {p.grace && (
                      <span style={{ marginLeft: 4, background: `${s.yellow}20`, color: s.yellow, fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>
                        Grace
                      </span>
                    )}
                    {isScanned && (
                      <span style={{ marginLeft: 4, background: `${s.accent}20`, color: s.accent, fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>
                        Scanning...
                      </span>
                    )}
                  </div>
                  <span style={{ color: isExpired || isBurned ? s.red : s.text2, fontFamily: s.mono, fontSize: 12 }}>
                    {p.expiration === 'Burn After Read' ? (isBurned ? 'Consumed' : 'Unread') : formatTime(p.remaining)}
                  </span>
                </div>

                {p.expiration !== 'Burn After Read' && (
                  <div style={{ width: '100%', height: 4, background: s.bg3, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: isExpired ? s.red : pct < 20 ? s.red : pct < 50 ? s.yellow : s.green,
                      borderRadius: 2, transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}

                {p.expiration === 'Burn After Read' && !isBurned && (
                  <div style={{ marginTop: 8 }}>
                    {showBurnConfirm === p.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: s.text3, fontSize: 11 }}>Delete this paste after viewing?</span>
                        <button onClick={() => burnPaste(p.id)} style={{
                          background: s.red, border: 'none', borderRadius: 4,
                          padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 11,
                        }}>Burn</button>
                        <button onClick={() => setShowBurnConfirm(null)} style={{
                          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 4,
                          padding: '4px 10px', color: s.text2, cursor: 'pointer', fontSize: 11,
                        }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowBurnConfirm(p.id)} style={{
                        background: `${s.red}15`, border: `1px solid ${s.red}40`,
                        borderRadius: 4, padding: '4px 10px', color: s.red, cursor: 'pointer', fontSize: 11,
                      }}>
                        View & Burn
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Background Cleanup Worker</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, marginLeft: 8 }}>
                Scan #{workerTick}
              </span>
            </div>
            <button onClick={runWorker} disabled={scanning} style={{
              background: scanning ? s.bg3 : s.accent,
              border: 'none', borderRadius: 6,
              padding: '8px 16px',
              color: scanning ? s.text3 : '#fff',
              cursor: scanning ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600,
            }}>
              {scanning ? 'Scanning...' : 'Run Cleanup Scan'}
            </button>
          </div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
            The worker queries for pastes where expiration &lt; NOW(), moves them to a soft-delete state with a 24-hour grace period, then hard-deletes after the grace window expires. Burn-after-read pastes are deleted immediately on the first view.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Active</div>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{pastes.filter(p => p.status === 'active' && p.expiration !== 'Burn After Read').length}</div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Burn After Read</div>
            <div style={{ color: s.orange, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{pastes.filter(p => p.expiration === 'Burn After Read' && !p.burned).length}</div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Expired / Deleted</div>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{pastes.filter(p => p.status === 'expired' || p.status === 'burned').length}</div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
