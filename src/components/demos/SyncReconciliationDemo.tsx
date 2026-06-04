import { useState, useEffect, useCallback } from 'react'
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

interface Ev { title: string; time: string; etag: string; mod: number }

export default function SyncReconciliationDemo() {
  const [client, setClient] = useState<Ev>({ title: 'Q3 planning', time: '14:00', etag: 'v1', mod: 1 })
  const [server, setServer] = useState<Ev>({ title: 'Q3 planning', time: '14:00', etag: 'v1', mod: 1 })
  const [lamport, setLamport] = useState({ c: 1, s: 1 })
  const [syncStep, setSyncStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [conflict, setConflict] = useState(false)
  const [resolution, setResolution] = useState<'lww' | 'merge' | null>(null)
  const [diff, setDiff] = useState<string | null>(null)

  const mutate = (side: 'c' | 's', field: 'title' | 'time' | 'del') => {
    const ts = Date.now()
    if (side === 'c') {
      setClient(prev => {
        const next = field === 'del' ? { ...prev, title: '(deleted)', mod: ts } : field === 'title' ? { ...prev, title: prev.title + ' (local)', mod: ts } : { ...prev, time: '15:30', mod: ts }
        setLamport(l => ({ ...l, c: l.c + 1 }))
        return { ...next, etag: `v${lamport.c + 1}` }
      })
    } else {
      setServer(prev => {
        const next = field === 'del' ? { ...prev, title: '(deleted)', mod: ts } : field === 'title' ? { ...prev, title: 'Q3 offsite (server)', mod: ts } : { ...prev, time: '09:45', mod: ts }
        setLamport(l => ({ ...l, s: l.s + 1 }))
        return { ...next, etag: `v${lamport.s + 1}` }
      })
    }
    setConflict(false)
    setResolution(null)
    setDiff(null)
  }

  const stop = useCallback(() => { setIsPlaying(false); setSyncStep(-1) }, [])

  const runSync = useCallback(() => {
    if (isPlaying) { stop(); return }
    setSyncStep(0)
    setIsPlaying(true)
    setConflict(false)
    setResolution(null)
    setDiff(null)
  }, [isPlaying, stop])

  useEffect(() => {
    if (!isPlaying || syncStep < 0) return
    if (syncStep >= 6) { setIsPlaying(false); setSyncStep(-1); return }
    const d = getStepDelay(syncStep === 3 ? 900 : 520, speed)
    const t = setTimeout(() => {
      if (syncStep === 0) {
        setDiff(client.etag !== server.etag ? 'Client push: ETag v' + client.etag.slice(1) + ' vs server v' + server.etag.slice(1) : 'No change')
      }
      if (syncStep === 1) {
        const cmod = client.mod > server.mod
        const smod = server.mod > client.mod
        if (cmod && smod) { setConflict(true); setDiff('Conflict: both sides mutated after last sync') }
        else setDiff(cmod ? 'Client newer — push wins' : smod ? 'Server newer — pull wins' : 'In sync')
      }
      if (syncStep === 3 && conflict) {
        setDiff('Choose resolution: LWW keeps latest mod, Merge creates two versions')
      }
      if (syncStep === 5) {
        if (resolution === 'merge') {
          setClient(c => ({ ...c, title: 'Q3 planning (merged)', etag: 'vM' }))
          setServer(s => ({ ...s, title: 'Q3 planning (merged)', etag: 'vM' }))
        }
        setDiff('Resolved. Client pulls new ETag + If-Match header next time.')
      }
      setSyncStep(s => s + 1)
    }, d)
    return () => clearTimeout(t)
  }, [isPlaying, syncStep, speed, client, server, conflict, resolution])

  const resolve = (mode: 'lww' | 'merge') => {
    setResolution(mode)
    if (mode === 'lww') {
      const win = client.mod > server.mod ? client : server
      setClient(win)
      setServer(win)
    }
    setTimeout(() => setSyncStep(4), 60)
  }

  const reset = () => {
    const base = { title: 'Q3 planning', time: '14:00', etag: 'v1', mod: 1 }
    setClient(base); setServer(base); setLamport({ c: 1, s: 1 })
    setSyncStep(-1); setIsPlaying(false); setConflict(false); setResolution(null); setDiff(null)
  }

  const arrow = syncStep >= 0 ? (syncStep < 3 ? '→ push' : '← pull') : ''

  return (
    <DemoBoundary name="Sync Reconciliation">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, color: s.accent, marginBottom: 4 }}>Client A (Lamport {lamport.c})</div>
            <div style={{ fontFamily: s.mono, fontSize: 13, marginBottom: 6 }}>{client.title} @ {client.time} <span style={{ color: s.text3, fontSize: 10 }}>ETag {client.etag}</span></div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => mutate('c', 'title')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}>Edit title locally</button>
              <button onClick={() => mutate('c', 'time')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}>Change time</button>
              <button onClick={() => mutate('c', 'del')} style={{ fontSize: 10, background: s.red, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, color: s.purple, marginBottom: 4 }}>Server (Lamport {lamport.s}) {arrow}</div>
            <div style={{ fontFamily: s.mono, fontSize: 13, marginBottom: 6 }}>{server.title} @ {server.time} <span style={{ color: s.text3, fontSize: 10 }}>ETag {server.etag}</span></div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => mutate('s', 'title')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}>Edit title</button>
              <button onClick={() => mutate('s', 'time')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}>Change time</button>
              <button onClick={() => mutate('s', 'del')} style={{ fontSize: 10, background: s.red, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button onClick={runSync} style={{ background: isPlaying ? s.red : s.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>{isPlaying ? 'Stop' : 'Run Sync (auto-step)'}</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>Reset</button>
          {conflict && !resolution && (
            <>
              <button onClick={() => resolve('lww')} style={{ background: s.yellow, color: '#000', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Last-Write-Wins</button>
              <button onClick={() => resolve('merge')} style={{ background: s.purple, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Three-way Merge</button>
            </>
          )}
        </div>

        {diff && <div style={{ marginTop: 8, fontSize: 12, color: s.text2, background: s.bg, padding: '6px 10px', borderRadius: 4, border: `1px solid ${s.border}` }}>{diff}</div>}
        {resolution && <div style={{ marginTop: 4, fontSize: 11, color: s.green }}>Resolved via {resolution}. CalDAV sends If-Match: "vX" on PUT; 412 Precondition Failed on conflict forces client to re-fetch.</div>}

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Vector clocks (or Lamport + ETag) detect concurrent mutations. Sync token + If-Match is how Google Calendar + CalDAV avoid lost updates without full locks.</div>
      </div>
    </DemoBoundary>
  )
}
