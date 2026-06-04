import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const USERS = ['Owner', 'Editor1', 'Editor2', 'Viewer', 'Stranger'] as const
const ACTIONS = ['View', 'Edit', 'Delete', 'Share', 'Admin'] as const

type Level = 0 | 1 | 2 | 3
const LEVELS: Level[] = [0,1,2,3]
const LEVEL_LABEL = ['none', 'view', 'edit', 'owner']
const LEVEL_COLOR = [s.bg3, s.yellow, s.accent, s.green]

const ROLE_CAPS: Record<string, Record<string, boolean>> = {
  Owner: { View: true, Edit: true, Delete: true, Share: true, Admin: true },
  Editor1: { View: true, Edit: true, Delete: false, Share: true, Admin: false },
  Editor2: { View: true, Edit: true, Delete: true, Share: false, Admin: false },
  Viewer: { View: true, Edit: false, Delete: false, Share: false, Admin: false },
  Stranger: { View: false, Edit: false, Delete: false, Share: false, Admin: false },
}

export default function SharingPermissionsDemo() {
  const [matrix, setMatrix] = useState<Record<string, Level>>(() => {
    const m: Record<string, Level> = {}
    USERS.forEach(u => { ACTIONS.forEach(a => { m[`${u}:${a}`] = u === 'Owner' ? 3 : u.includes('Editor') ? 2 : u === 'Viewer' ? 1 : 0 }) })
    return m
  })
  const [testUser, setTestUser] = useState<typeof USERS[number]>('Editor1')
  const [testActions, setTestActions] = useState<Record<string, boolean>>({ View: true, Edit: true, Delete: false, Share: false, Admin: false })
  const [inheritMode, setInheritMode] = useState<'calendar' | 'event'>('calendar')

  const getLevel = (u: string, a: string): Level => matrix[`${u}:${a}`] ?? 0

  const cycle = (u: string, a: string) => {
    const key = `${u}:${a}`
    setMatrix(m => {
      const cur = m[key] ?? 0
      const next = ((cur + 1) % 4) as Level
      return { ...m, [key]: next }
    })
  }

  const effectiveForTest = (action: string): boolean => {
    const lvl = getLevel(testUser, action)
    if (inheritMode === 'event' && testUser === 'Editor2' && action === 'Delete') return false
    return ROLE_CAPS[testUser][action] && lvl >= (action === 'Admin' ? 3 : action === 'Delete' || action === 'Share' ? 2 : 1)
  }

  const toggleTestAction = (a: string) => {
    setTestActions(t => ({ ...t, [a]: !t[a] }))
  }

  const exportAcl = () => {
    const acl = USERS.map(u => ({ user: u, permissions: ACTIONS.map(a => ({ action: a, level: LEVEL_LABEL[getLevel(u,a)], granted: effectiveForTest(a) })) }))
    const json = JSON.stringify({ calendarId: 'cal_123', mode: inheritMode, acl }, null, 2)
    navigator.clipboard?.writeText(json)
    alert('ACL JSON copied to clipboard')
  }

  const reset = () => {
    const m: Record<string, Level> = {}
    USERS.forEach(u => { ACTIONS.forEach(a => { m[`${u}:${a}`] = u === 'Owner' ? 3 : u.includes('Editor') ? 2 : u === 'Viewer' ? 1 : 0 }) })
    setMatrix(m)
    setTestUser('Editor1')
    setTestActions({ View: true, Edit: true, Delete: false, Share: false, Admin: false })
    setInheritMode('calendar')
  }

  return (
    <DemoBoundary name="Sharing and Permissions">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: s.text2 }}>ACL Matrix — click any cell to cycle permission level</div>
          <button onClick={reset} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(5, 1fr)`, gap: 3, marginBottom: 14 }}>
          <div />
          {ACTIONS.map(a => <div key={a} style={{ fontSize: 10, color: s.text3, textAlign: 'center', padding: '2px 0' }}>{a}</div>)}
          {USERS.map(u => (
            <>
              <div key={u} style={{ fontSize: 11, color: s.text2, padding: '4px 6px', background: s.bg, borderRadius: 3 }}>{u}</div>
              {ACTIONS.map(a => {
                const lvl = getLevel(u, a)
                const col = LEVEL_COLOR[lvl]
                return (
                  <div key={`${u}:${a}`} onClick={() => cycle(u, a)} style={{
                    background: col, height: 28, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${lvl === 0 ? s.border : col}`, transition: 'all 0.1s', fontSize: 10, color: lvl > 1 ? '#000' : s.text, fontFamily: s.mono
                  }}>
                    {LEVEL_LABEL[lvl]}
                  </div>
                )
              })}
            </>
          ))}
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: s.text2, marginBottom: 6 }}>Test Access</div>
            <select value={testUser} onChange={e => setTestUser(e.target.value as any)} style={{ width: '100%', background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '5px 8px', color: s.text, fontSize: 13, marginBottom: 8 }}>
              {USERS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ACTIONS.map(a => (
                <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                  <input type="checkbox" checked={testActions[a]} onChange={() => toggleTestAction(a)} /> {a}
                </label>
              ))}
            </div>
          </div>
          <div style={{ flex: 1.1, background: s.bg3, borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 11, color: s.text2, marginBottom: 4 }}>Effective result for {testUser}</div>
            {ACTIONS.map(a => {
              const granted = effectiveForTest(a)
              const want = testActions[a]
              const ok = granted && want
              return (
                <div key={a} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: ok ? s.green : (want ? s.red : s.text3) }}>
                  <span>{a}</span>
                  <span style={{ fontFamily: s.mono }}>{granted ? 'ALLOW' : 'DENY'} {want ? (ok ? '✓' : '✗') : ''}</span>
                </div>
              )
            })}
            <div style={{ fontSize: 10, color: s.text3, marginTop: 6 }}>Because role={testUser.toLowerCase()}, level={LEVEL_LABEL[getLevel(testUser, 'Edit')]} on Edit — {inheritMode} override active</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button onClick={() => setInheritMode(inheritMode === 'calendar' ? 'event' : 'calendar')} style={{ background: inheritMode === 'event' ? s.purple : s.accent, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
            {inheritMode === 'calendar' ? 'Calendar-level ACL' : 'Event-level override'}
          </button>
          <button onClick={exportAcl} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Export ACL JSON</button>
          <div style={{ fontSize: 10, color: s.text3 }}>Click matrix cells to raise/lower grants. Event override can revoke Delete even if calendar grants it.</div>
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Real systems evaluate in LRU cache (user,cal)→role then check domain ACLs before wildcard. Deny rows always win. 5 roles × 5 actions = 25 decisions per request, &lt;1us with bitmasks.</div>
      </div>
    </DemoBoundary>
  )
}
