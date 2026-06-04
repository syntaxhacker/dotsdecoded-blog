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

interface UserState {
  title: string
  time: string
  notes: string
  version: number
}

export default function OptimisticLockingDemo() {
  const [global, setGlobal] = useState<UserState>({ title: 'Q4 Planning', time: '14:00', notes: 'Budget review', version: 1 })
  const [alice, setAlice] = useState<UserState>({ title: 'Q4 Planning', time: '14:00', notes: 'Budget review', version: 1 })
  const [bob, setBob] = useState<UserState>({ title: 'Q4 Planning', time: '14:00', notes: 'Budget review', version: 1 })
  const [aliceMsg, setAliceMsg] = useState('')
  const [bobMsg, setBobMsg] = useState('')
  const [diff, setDiff] = useState<string | null>(null)
  const [mergeResult, setMergeResult] = useState('')

  const save = (who: 'alice' | 'bob') => {
    const me = who === 'alice' ? alice : bob
    const other = who === 'alice' ? bob : alice
    setDiff(null)
    setMergeResult('')

    if (me.version !== global.version) {
      const msg = `412 Precondition Failed — event is now v${global.version} (changed by ${who === 'alice' ? 'Bob' : 'Alice'})`
      if (who === 'alice') setAliceMsg(msg)
      else setBobMsg(msg)
      setDiff(`Your v${me.version} vs server v${global.version}\nTitle: "${me.title}" vs "${global.title}"\nTime: ${me.time} vs ${global.time}\nNotes: ${me.notes} vs ${global.notes}`)
      return
    }

    const nextV = global.version + 1
    const newGlobal = { ...me, version: nextV }
    setGlobal(newGlobal)
    setAlice(a => ({ ...a, version: nextV }))
    setBob(b => ({ ...b, version: nextV }))
    const ok = `${who} saved successfully → v${nextV}`
    if (who === 'alice') { setAliceMsg(ok); setBobMsg('') } else { setBobMsg(ok); setAliceMsg('') }
  }

  const take = (who: 'alice' | 'bob', which: 'mine' | 'theirs') => {
    const me = who === 'alice' ? alice : bob
    const base = which === 'mine' ? me : global
    const nextV = global.version + 1
    const newG = { ...base, version: nextV }
    setGlobal(newG)
    setAlice(a => ({ ...a, version: nextV }))
    setBob(b => ({ ...b, version: nextV }))
    setDiff(null)
    setAliceMsg(who === 'alice' ? 'Took my version → resolved' : '')
    setBobMsg(who === 'bob' ? 'Took my version → resolved' : '')
  }

  const do3WayMerge = () => {
    const mergedTitle = alice.title !== global.title ? alice.title : bob.title
    const mergedTime = alice.time !== global.time ? alice.time : bob.time
    const mergedNotes = alice.notes !== global.notes ? alice.notes : bob.notes
    const nextV = global.version + 1
    const merged = { title: mergedTitle, time: mergedTime, notes: mergedNotes, version: nextV }
    setGlobal(merged)
    setAlice(merged)
    setBob(merged)
    setMergeResult(`3-way merge resolved → v${nextV} (title/time/notes from first differing edit)`)
    setDiff(null)
    setAliceMsg('')
    setBobMsg('')
  }

  const reset = () => {
    const base = { title: 'Q4 Planning', time: '14:00', notes: 'Budget review', version: 1 }
    setGlobal(base); setAlice(base); setBob(base)
    setAliceMsg(''); setBobMsg(''); setDiff(null); setMergeResult('')
  }

  const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, color: s.text3, marginBottom: 2 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 6px', color: s.text, fontSize: 12, fontFamily: s.mono }} />
    </div>
  )

  return (
    <DemoBoundary name="Optimistic Locking">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['alice', 'bob'] as const).map(who => {
            const st = who === 'alice' ? alice : bob
            const msg = who === 'alice' ? aliceMsg : bobMsg
            const isConflict = msg.includes('412')
            return (
              <div key={who} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ color: who === 'alice' ? s.accent : s.purple, fontSize: 12, fontWeight: 600 }}>{who === 'alice' ? 'Alice' : 'Bob'} (v{st.version})</div>
                  <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>ETag: "v{st.version}"</div>
                </div>
                <Field label="Title" value={st.title} onChange={v => who === 'alice' ? setAlice(a => ({ ...a, title: v })) : setBob(b => ({ ...b, title: v }))} />
                <Field label="Time" value={st.time} onChange={v => who === 'alice' ? setAlice(a => ({ ...a, time: v })) : setBob(b => ({ ...b, time: v }))} />
                <Field label="Notes" value={st.notes} onChange={v => who === 'alice' ? setAlice(a => ({ ...a, notes: v })) : setBob(b => ({ ...b, notes: v }))} />
                <button onClick={() => save(who)} style={{ width: '100%', background: s.green, color: '#000', border: 'none', borderRadius: 4, padding: '5px 0', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>Save Changes (If-Match v{st.version})</button>
                {msg && <div style={{ marginTop: 6, fontSize: 10, color: isConflict ? s.red : s.green, background: s.bg2, padding: '4px 6px', borderRadius: 3 }}>{msg}</div>}
                {isConflict && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <button onClick={() => take(who, 'mine')} style={{ flex: 1, background: s.yellow, color: '#000', border: 'none', borderRadius: 3, padding: '3px 0', fontSize: 10, cursor: 'pointer' }}>Take Mine</button>
                    <button onClick={() => take(who, 'theirs')} style={{ flex: 1, background: s.orange, color: '#000', border: 'none', borderRadius: 3, padding: '3px 0', fontSize: 10, cursor: 'pointer' }}>Take Theirs</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={do3WayMerge} style={{ background: s.purple, color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Simulate 3-way Merge</button>
          <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Reset All</button>
          <div style={{ flex: 1, fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Global v{global.version} — {global.title} @ {global.time}</div>
        </div>

        {diff && <div style={{ marginTop: 8, background: s.bg, border: `1px solid ${s.red}`, borderRadius: 6, padding: 8, fontFamily: s.mono, fontSize: 11, color: s.text2, whiteSpace: 'pre' }}>{diff}</div>}
        {mergeResult && <div style={{ marginTop: 6, fontSize: 11, color: s.green }}>{mergeResult}</div>}

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Each Save sends If-Match: "vX". Server rejects with 412 if current != expected. Client must re-fetch, diff, and choose or merge. This is exactly how Google Calendar + CalDAV prevent lost updates without pessimistic locks.</div>
      </div>
    </DemoBoundary>
  )
}
