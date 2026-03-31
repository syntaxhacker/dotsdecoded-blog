import { useState, useRef, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

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

type WalEntry = {
  lsn: number
  type: string
  desc: string
  status: 'writing' | 'flushed' | 'committed' | 'lost' | 'undone' | 'redone' | 'rolled-back'
}

type BufRow = {
  pageId: number
  account: string
  balance: number
  original: number
  dirty: boolean
}

type DiskRow = {
  pageId: number
  account: string
  balance: number
}

const INIT_BUF: BufRow[] = [
  { pageId: 1, account: 'alice', balance: 100, original: 100, dirty: false },
  { pageId: 2, account: 'bob', balance: 50, original: 50, dirty: false },
]

const INIT_DISK: DiskRow[] = [
  { pageId: 1, account: 'alice', balance: 100 },
  { pageId: 2, account: 'bob', balance: 50 },
]

const ANIM_CSS = `
@keyframes wPulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes wSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes wShake{0%,100%{transform:translateX(0)}10%{transform:translateX(-6px)}30%{transform:translateX(6px)}50%{transform:translateX(-3px)}70%{transform:translateX(3px)}90%{transform:translateX(-1px)}}
@keyframes wFlash{0%{opacity:.35}100%{opacity:0}}
@keyframes wScan{0%{transform:scaleX(0);opacity:.8}100%{transform:scaleX(1);opacity:0}}
`

export default function WalDemo() {
  const [phase, setPhase] = useState('idle')
  const [wal, setWal] = useState<WalEntry[]>([])
  const [buf, setBuf] = useState<BufRow[]>(INIT_BUF)
  const [disk, setDisk] = useState<DiskRow[]>(INIT_DISK)
  const [msg, setMsg] = useState('Click a button to begin')
  const [msgColor, setMsgColor] = useState(s.text3)
  const [txActive, setTxActive] = useState(false)
  const [crashPt, setCrashPt] = useState(-1)
  const [shaking, setShaking] = useState(false)
  const [flashRed, setFlashRed] = useState(false)
  const [scanning, setScanning] = useState(false)
  const abortRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const rejectRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const wait = (ms: number): Promise<void> => new Promise((resolve, reject) => {
    rejectRef.current = reject
    const t = window.setTimeout(() => {
      rejectRef.current = null
      resolve()
    }, ms)
    timersRef.current.push(t)
  })

  const reset = () => {
    abortRef.current = true
    rejectRef.current?.()
    rejectRef.current = null
    clearTimers()
    setPhase('idle')
    setWal([])
    setBuf(INIT_BUF)
    setDisk(INIT_DISK)
    setMsg('Click a button to begin')
    setMsgColor(s.text3)
    setTxActive(false)
    setCrashPt(-1)
    setShaking(false)
    setFlashRed(false)
    setScanning(false)
    setTimeout(() => { abortRef.current = false }, 60)
  }

  const doCrash = async () => {
    setShaking(true)
    setFlashRed(true)
    setTxActive(false)
    setMsg('CRASH! Power failure detected')
    setMsgColor(s.red)
    setPhase('crashed')
    await wait(2800)
    setShaking(false)
    setFlashRed(false)
  }

  const runNormal = async () => {
    reset()
    try {
      await wait(250)

      setTxActive(true)
      setPhase('running')
      setWal([{ lsn: 1, type: 'BEGIN', desc: 'Transaction started', status: 'writing' }])
      setMsg('Step 1: Write BEGIN record to WAL')
      setMsgColor(s.yellow)
      await wait(1100)

      setWal(p => [...p, { lsn: 2, type: 'UPDATE', desc: 'page=1  alice  balance: 100 -> 80', status: 'writing' }])
      setMsg('Step 2: Log update to WAL — alice 100 -> 80')
      await wait(1100)

      setWal(p => [...p, { lsn: 3, type: 'UPDATE', desc: 'page=2  bob    balance: 50 -> 70', status: 'writing' }])
      setMsg('Step 3: Log update to WAL — bob 50 -> 70')
      await wait(1100)

      setWal(p => p.map(e => ({ ...e, status: 'flushed' as const })))
      setMsg('Step 4: Flush WAL to disk (fsync)')
      setMsgColor(s.green)
      await wait(1300)

      setWal(p => [...p, { lsn: 4, type: 'COMMIT', desc: 'Transaction committed', status: 'writing' }])
      setMsg('Step 5: Write COMMIT record to WAL')
      setMsgColor(s.yellow)
      await wait(900)

      setWal(p => p.map(e => e.lsn === 4 ? { ...e, status: 'committed' as const } : e))
      setMsg('Step 6: Flush COMMIT to disk — transaction is durable')
      setMsgColor(s.green)
      await wait(1300)

      setBuf([
        { pageId: 1, account: 'alice', balance: 80, original: 100, dirty: true },
        { pageId: 2, account: 'bob', balance: 70, original: 50, dirty: true },
      ])
      setMsg('Step 7: Apply changes to buffer pool (memory)')
      setMsgColor(s.accent)
      await wait(1300)

      setTxActive(false)
      setMsg('Transaction committed and durable')
      setMsgColor(s.green)
      await wait(900)

      setDisk([
        { pageId: 1, account: 'alice', balance: 80 },
        { pageId: 2, account: 'bob', balance: 70 },
      ])
      setBuf(p => p.map(r => ({ ...r, dirty: false })))
      setMsg('Background: data pages lazily written to disk')
      await wait(1100)

      setPhase('done')
      setMsg('Complete — all changes persisted')
    } catch { /* aborted */ }
  }

  const runCrash = async () => {
    reset()
    try {
      const cp = Math.floor(Math.random() * 3)
      setCrashPt(cp)
      await wait(250)

      setTxActive(true)
      setPhase('running')
      setWal([{ lsn: 1, type: 'BEGIN', desc: 'Transaction started', status: 'writing' }])
      setMsg('Writing BEGIN record to WAL')
      setMsgColor(s.yellow)
      await wait(1000)

      setWal(p => [...p, { lsn: 2, type: 'UPDATE', desc: 'page=1  alice  balance: 100 -> 80', status: 'writing' }])
      setMsg('Logging: alice 100 -> 80')
      await wait(1000)

      setWal(p => [...p, { lsn: 3, type: 'UPDATE', desc: 'page=2  bob    balance: 50 -> 70', status: 'writing' }])
      setMsg('Logging: bob 50 -> 70')
      await wait(1000)

      if (cp === 0) {
        await doCrash()

        setScanning(true)
        setMsg('Recovery: scanning WAL...')
        setMsgColor(s.purple)
        setPhase('recovering')
        await wait(1800)

        setWal([])
        setScanning(false)
        setMsg('No data loss — change was never logged to disk')
        setMsgColor(s.green)
        setPhase('done')
      } else if (cp === 1) {
        setWal(p => p.map(e => ({ ...e, status: 'flushed' as const })))
        setMsg('WAL flushed to disk')
        setMsgColor(s.green)
        await wait(1200)

        await doCrash()

        setScanning(true)
        setMsg('Recovery: scanning WAL for uncommitted transactions...')
        setMsgColor(s.purple)
        setPhase('recovering')
        await wait(1800)

        setScanning(false)
        setWal(p => p.map(e => e.type === 'UPDATE' ? { ...e, status: 'undone' as const } : e))
        setMsg('UNDO phase: rolling back uncommitted changes')
        setMsgColor(s.orange)
        await wait(1800)

        setWal(p => p.map(e => ({ ...e, status: 'rolled-back' as const })))
        setMsg('Uncommitted — will be rolled back during recovery')
        setMsgColor(s.yellow)
        setPhase('done')
      } else {
        setWal(p => p.map(e => ({ ...e, status: 'flushed' as const })))
        setMsg('WAL flushed to disk')
        setMsgColor(s.green)
        await wait(1000)

        setWal(p => [...p, { lsn: 4, type: 'COMMIT', desc: 'Transaction committed', status: 'writing' }])
        setMsg('Writing COMMIT record')
        setMsgColor(s.yellow)
        await wait(800)

        setWal(p => p.map(e => e.lsn === 4 ? { ...e, status: 'committed' as const } : e))
        setMsg('COMMIT flushed to disk')
        setMsgColor(s.green)
        await wait(1000)

        setBuf([
          { pageId: 1, account: 'alice', balance: 80, original: 100, dirty: true },
          { pageId: 2, account: 'bob', balance: 70, original: 50, dirty: true },
        ])
        setMsg('Applying changes to buffer pool')
        setMsgColor(s.accent)
        await wait(1000)

        await doCrash()

        setScanning(true)
        setMsg('Recovery: scanning WAL for committed transactions...')
        setMsgColor(s.purple)
        setPhase('recovering')
        await wait(1800)

        setScanning(false)
        setWal(p => p.map(e => e.type === 'UPDATE' ? { ...e, status: 'redone' as const } : e))
        setMsg('REDO phase: replaying committed changes from WAL')
        setMsgColor(s.green)
        await wait(1800)

        setDisk([
          { pageId: 1, account: 'alice', balance: 80 },
          { pageId: 2, account: 'bob', balance: 70 },
        ])
        setBuf(p => p.map(r => ({ ...r, dirty: false })))
        setMsg('Committed — will be redone during recovery')
        setMsgColor(s.green)
        setPhase('done')
      }
    } catch { /* aborted */ }
  }

  const running = phase === 'running' || phase === 'crashed' || phase === 'recovering'

  const getStatus = (status: WalEntry['status']) => {
    switch (status) {
      case 'writing': return { label: 'Writing...', color: s.yellow, bg: 'rgba(224,176,64,.1)' }
      case 'flushed': return { label: 'Flushed to disk', color: s.green, bg: 'rgba(61,214,140,.1)' }
      case 'committed': return { label: 'Committed', color: s.green, bg: 'rgba(61,214,140,.15)' }
      case 'lost': return { label: 'Lost (not flushed)', color: s.red, bg: 'rgba(232,93,93,.1)' }
      case 'undone': return { label: 'Undoing...', color: s.orange, bg: 'rgba(232,148,90,.1)' }
      case 'rolled-back': return { label: 'Rolled Back', color: s.yellow, bg: 'rgba(224,176,64,.1)' }
      case 'redone': return { label: 'Redone', color: s.green, bg: 'rgba(61,214,140,.15)' }
    }
  }

  const typeColor = (type: string) => {
    if (type === 'BEGIN') return { color: s.accent, bg: 'rgba(91,141,239,.15)' }
    if (type === 'COMMIT') return { color: s.green, bg: 'rgba(61,214,140,.15)' }
    if (type === 'UPDATE') return { color: s.yellow, bg: 'rgba(224,176,64,.12)' }
    return { color: s.text2, bg: 'transparent' }
  }

  return (
    <DemoBoundary name="Write-Ahead Logging">
      <style>{ANIM_CSS}</style>
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, position: 'relative' }}>
        {flashRed && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 10, pointerEvents: 'none', zIndex: 20,
            background: 'rgba(232,93,93,.18)', animation: 'wFlash .8s ease-out forwards',
          }} />
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <button onClick={runNormal} disabled={running} style={{
            padding: '8px 18px', background: running ? s.bg3 : s.accent, color: s.text,
            border: 'none', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, opacity: running ? 0.5 : 1, transition: 'opacity .2s',
          }}>
            Execute Transaction
          </button>
          <button onClick={runCrash} disabled={running} style={{
            padding: '8px 18px', background: running ? s.bg3 : s.red, color: s.text,
            border: 'none', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, opacity: running ? 0.5 : 1, transition: 'opacity .2s',
          }}>
            Simulate Crash
          </button>
          <button onClick={reset} style={{
            padding: '8px 18px', background: s.bg3, color: s.text2,
            border: `1px solid ${s.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 14,
          }}>
            Reset
          </button>
        </div>

        <div style={{
          padding: '10px 14px', background: s.bg2, border: `1px solid ${s.border}`,
          borderRadius: 6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
          animation: shaking ? 'wShake .5s ease-in-out' : undefined,
          minHeight: 38,
        }}>
          {txActive && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: s.yellow, flexShrink: 0,
              animation: 'wPulse 1s ease-in-out infinite',
            }} />
          )}
          {(phase === 'recovering' || scanning) && !txActive && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: s.purple, flexShrink: 0,
              animation: 'wPulse .6s ease-in-out infinite',
            }} />
          )}
          {phase === 'crashed' && !txActive && !scanning && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: s.red, flexShrink: 0,
              animation: 'wPulse .5s ease-in-out infinite',
            }} />
          )}
          <span style={{ color: msgColor, fontSize: 13, fontFamily: s.mono, lineHeight: 1.4 }}>
            {msg}
          </span>
        </div>

        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          marginBottom: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 14px', background: s.bg3, borderBottom: `1px solid ${s.border}`,
            fontSize: 12, fontWeight: 700, color: s.text2, textTransform: 'uppercase',
            letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: wal.length > 0 && wal.some(e => e.status !== 'lost' && e.status !== 'rolled-back') ? s.green : s.text3,
              transition: 'background .3s',
            }} />
            Transaction Log (WAL)
          </div>

          <div style={{ padding: wal.length === 0 ? '20px 14px' : '0', position: 'relative' }}>
            {scanning && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: s.purple, animation: 'wScan 1.5s ease-in-out infinite',
                transformOrigin: 'left', zIndex: 5,
              }} />
            )}
            {wal.length === 0 ? (
              <div style={{ color: s.text3, fontSize: 13, textAlign: 'center', fontFamily: s.mono }}>
                WAL is empty — no transactions logged
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: s.mono }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: s.text3, fontWeight: 600, width: 52 }}>LSN</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: s.text3, fontWeight: 600, width: 72 }}>Type</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '6px 12px', textAlign: 'right', color: s.text3, fontWeight: 600, width: 140 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wal.map((entry) => {
                    const st = getStatus(entry.status)
                    const tc = typeColor(entry.type)
                    return (
                      <tr key={entry.lsn} style={{ borderBottom: `1px solid ${s.border}`, animation: 'wSlide .3s ease-out' }}>
                        <td style={{ padding: '8px 12px', color: s.accent, fontWeight: 600 }}>
                          {String(entry.lsn).padStart(3, '0')}
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{
                            padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                            background: tc.bg, color: tc.color,
                          }}>
                            {entry.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 8px', color: s.text, letterSpacing: '0.2px' }}>
                          {entry.desc}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11,
                            background: st.bg, color: st.color,
                            animation: entry.status === 'writing' ? 'wPulse 1s ease-in-out infinite' : undefined,
                            transition: 'all .3s',
                          }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 300px', background: s.bg2, border: `1px solid ${s.border}`,
            borderRadius: 8, overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderBottom: `1px solid ${s.border}`,
              fontSize: 12, fontWeight: 700, color: s.text2, textTransform: 'uppercase',
              letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.orange }} />
              Data Pages (Disk)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: s.mono }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Page</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Account</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: s.text3, fontWeight: 600 }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {disk.map((row) => {
                  const orig = INIT_DISK.find(d => d.pageId === row.pageId)?.balance ?? row.balance
                  const changed = row.balance !== orig
                  return (
                    <tr key={row.pageId} style={{ borderBottom: `1px solid ${s.border}` }}>
                      <td style={{ padding: '8px 10px', color: s.text3 }}>{row.pageId}</td>
                      <td style={{ padding: '8px 10px', color: s.text }}>{row.account}</td>
                      <td style={{
                        padding: '8px 10px', textAlign: 'right', color: changed ? s.green : s.text,
                        fontWeight: changed ? 600 : 400, transition: 'color .4s',
                      }}>
                        ${row.balance}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            flex: '1 1 300px', background: s.bg2, border: `1px solid ${s.border}`,
            borderRadius: 8, overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderBottom: `1px solid ${s.border}`,
              fontSize: 12, fontWeight: 700, color: s.text2, textTransform: 'uppercase',
              letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent }} />
              Buffer Pool (Memory)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: s.mono }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Page</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Account</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right', color: s.text3, fontWeight: 600 }}>Balance</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center', color: s.text3, fontWeight: 600, width: 56 }}>Dirty</th>
                </tr>
              </thead>
              <tbody>
                {buf.map((row) => {
                  const changed = row.balance !== row.original
                  return (
                    <tr key={row.pageId} style={{ borderBottom: `1px solid ${s.border}` }}>
                      <td style={{ padding: '8px 10px', color: s.text3 }}>{row.pageId}</td>
                      <td style={{ padding: '8px 10px', color: s.text }}>{row.account}</td>
                      <td style={{
                        padding: '8px 10px', textAlign: 'right', color: changed ? s.yellow : s.text,
                        fontWeight: changed ? 600 : 400, transition: 'color .4s',
                      }}>
                        ${row.balance}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {row.dirty ? (
                          <span style={{
                            padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                            background: 'rgba(224,176,64,.15)', color: s.yellow,
                          }}>
                            DIRTY
                          </span>
                        ) : (
                          <span style={{ color: s.text3, fontSize: 10 }}>clean</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {crashPt >= 0 && (phase === 'crashed' || phase === 'recovering' || phase === 'done') && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 6, fontSize: 12,
            fontFamily: s.mono, lineHeight: 1.6,
            background: crashPt === 1 ? 'rgba(224,176,64,.06)' : 'rgba(61,214,140,.06)',
            border: `1px solid ${crashPt === 1 ? 'rgba(224,176,64,.2)' : 'rgba(61,214,140,.2)'}`,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: crashPt === 1 ? s.yellow : s.green, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Crash Scenario
            </div>
            <div style={{ color: s.text2 }}>
              {crashPt === 0 && 'Crash before WAL flush — WAL entries were only in memory and are lost on power failure'}
              {crashPt === 1 && 'Crash after WAL flush but before COMMIT — uncommitted transaction found in WAL during recovery'}
              {crashPt === 2 && 'Crash after COMMIT but before data page write — committed data exists only in WAL'}
            </div>
          </div>
        )}

        {phase === 'done' && crashPt < 0 && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 6, fontSize: 12,
            fontFamily: s.mono, lineHeight: 1.6,
            background: 'rgba(61,214,140,.06)', border: '1px solid rgba(61,214,140,.2)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: s.green, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              WAL Guarantees
            </div>
            <div style={{ color: s.text2 }}>
              Even if a crash occurred after COMMIT but before the lazy disk write, the data is safe.
              The WAL contains all committed changes and can replay them during recovery (REDO phase).
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
