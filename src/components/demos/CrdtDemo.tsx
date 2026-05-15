import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface CharItem {
  id: string
  char: string
  pos: number
  userId: 'A' | 'B'
}

function charToDisplay(ch: string): string {
  if (ch === ' ') return '\u2423'
  return ch
}

function makeChar(id: string, char: string, pos: number, userId: 'A' | 'B'): CharItem {
  return { id, char, pos, userId }
}

const USER_A_COLOR = s.red
const USER_B_COLOR = s.accent

const A_CHARS = ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd']
const B_CHARS = ['!', '?', '.', ',', ':', ';', '-', '_', 'x', 'y', 'z']

let idCounter = 100
function nextId(userId: 'A' | 'B'): string {
  idCounter++
  return `${userId}-${idCounter}`
}

function initialChars(): CharItem[] {
  return [
    makeChar('A-1', 'H', 0, 'A'),
    makeChar('A-2', 'i', 1, 'A'),
  ]
}

function sorted(chars: CharItem[]): CharItem[] {
  return [...chars].sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos
    return a.userId.localeCompare(b.userId)
  })
}

function findInsertPos(chars: CharItem[], index: number): number {
  if (chars.length === 0) return 0
  if (index <= 0) return chars[0].pos - 1
  if (index >= chars.length) return chars[chars.length - 1].pos + 1
  const left = chars[index - 1].pos
  const right = chars[index].pos
  return (left + right) / 2
}

export default function CrdtDemo() {
  const [charsA, setCharsA] = useState<CharItem[]>(initialChars())
  const [charsB, setCharsB] = useState<CharItem[]>(initialChars())
  const [tab, setTab] = useState<'a' | 'b' | 'merge'>('a')
  const [aInsertIdx, setAInsertIdx] = useState(2)
  const [bInsertIdx, setBInsertIdx] = useState(2)
  const [aChar, setAChar] = useState('!')
  const [bChar, setBChar] = useState('?')
  const [mergeMsg, setMergeMsg] = useState('')

  const addCharA = useCallback(() => {
    const sortedA = sorted(charsA)
    const pos = findInsertPos(sortedA, aInsertIdx)
    const ch: CharItem = makeChar(nextId('A'), aChar, pos, 'A')
    const newChars = [...charsA, ch]
    setCharsA(newChars)
    setCharsB(prev => {
      const sortedB = sorted(prev)
      const posB = findInsertPos(sortedB, bInsertIdx)
      if (posB === pos && bInsertIdx === aInsertIdx) {
        return [...prev, makeChar(ch.id, ch.char, pos, ch.userId)]
      }
      return prev
    })
    setAInsertIdx(prev => Math.min(prev + 1, sortedA.length))
  }, [charsA, aInsertIdx, aChar])

  const addCharB = useCallback(() => {
    const sortedB = sorted(charsB)
    const pos = findInsertPos(sortedB, bInsertIdx)
    const ch: CharItem = makeChar(nextId('B'), bChar, pos, 'B')
    setCharsB([...charsB, ch])
    setCharsA(prev => {
      const sortedA = sorted(prev)
      const posA = findInsertPos(sortedA, aInsertIdx)
      if (posA === pos && aInsertIdx === bInsertIdx) {
        return [...prev, makeChar(ch.id, ch.char, pos, ch.userId)]
      }
      return prev
    })
    setBInsertIdx(prev => Math.min(prev + 1, sortedB.length))
    setMergeMsg('')
  }, [charsB, bInsertIdx, bChar])

  const doMerge = useCallback(() => {
    const allIds = new Set<string>()
    const merged: CharItem[] = []
    for (const c of [...charsA, ...charsB]) {
      if (!allIds.has(c.id)) {
        allIds.add(c.id)
        merged.push(c)
      }
    }
    const s = sorted(merged)
    const text = s.map(c => c.char).join('')
    setMergeMsg(text)
  }, [charsA, charsB])

  const reset = useCallback(() => {
    const init = initialChars()
    setCharsA(init)
    setCharsB(init)
    setAInsertIdx(2)
    setBInsertIdx(2)
    setMergeMsg('')
  }, [])

  const renderChars = (chars: CharItem[], label: string) => {
    const sChars = sorted(chars)
    return (
      <div>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8,
          fontFamily: s.mono, fontSize: 13,
        }}>
          {sChars.map(ch => (
            <div key={ch.id} style={{
              background: ch.userId === 'A' ? `${USER_A_COLOR}15` : `${USER_B_COLOR}15`,
              border: `1px solid ${ch.userId === 'A' ? USER_A_COLOR : USER_B_COLOR}40`,
              borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 16, color: s.text }}>{charToDisplay(ch.char)}</span>
              <span style={{ color: s.text3, fontSize: 10, fontWeight: 500 }}>#{ch.id}</span>
              <span style={{ color: ch.userId === 'A' ? USER_A_COLOR : USER_B_COLOR, fontSize: 10 }}>pos={ch.pos.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: s.mono, fontSize: 16, background: s.bg, border: `1px solid ${s.border}`,
          borderRadius: 6, padding: '6px 10px', color: s.text, letterSpacing: 1,
        }}>
          {sChars.map(ch => ch.char).join('') || '\u00A0'}
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="CRDT Conflict-Free Replicated Data Type">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>CRDT: Commutative Merge</div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.5 }}>
        Each character has a unique ID and position. Sorting by (position, user ID) gives the same result on every client -- no server coordination needed.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {([{ id: 'a', label: 'User A', color: USER_A_COLOR }, { id: 'b', label: 'User B', color: USER_B_COLOR }, { id: 'merge', label: 'Merge Result', color: s.green }] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === t.id ? `${t.color}20` : s.bg2,
            border: `1px solid ${tab === t.id ? t.color : s.border}`,
            color: tab === t.id ? t.color : s.text2,
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'a' && (
        <div>
          {renderChars(charsA, 'User A document')}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: s.text3, fontSize: 12 }}>Char:</span>
              {A_CHARS.slice(0, 6).map(c => (
                <button key={c} onClick={() => setAChar(c)} style={{
                  width: 30, height: 30, borderRadius: 6, cursor: 'pointer', fontSize: 14,
                  background: aChar === c ? `${USER_A_COLOR}30` : s.bg3,
                  border: `1px solid ${aChar === c ? USER_A_COLOR : s.border}`,
                  color: aChar === c ? USER_A_COLOR : s.text,
                  fontWeight: aChar === c ? 700 : 400,
                }}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: s.text3, fontSize: 12 }}>Insert at index:</span>
              <input type="number" min={0} max={sorted(charsA).length} value={aInsertIdx}
                onChange={e => setAInsertIdx(Math.max(0, Math.min(sorted(charsA).length, Number(e.target.value))))}
                style={{ width: 50, padding: '4px 8px', borderRadius: 6, border: `1px solid ${s.border}`, background: s.bg3, color: s.text, fontFamily: s.mono, fontSize: 13, textAlign: 'center' }}
              />
            </div>
            <button onClick={addCharA} style={{
              background: USER_A_COLOR, border: 'none', borderRadius: 8, padding: '8px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Add</button>
          </div>
          <div style={{ color: s.text3, fontSize: 11, marginTop: 8 }}>
            Each character gets a position value between its neighbors. This enables insertions at any point.
          </div>
        </div>
      )}

      {tab === 'b' && (
        <div>
          {renderChars(charsB, 'User B document')}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: s.text3, fontSize: 12 }}>Char:</span>
              {B_CHARS.slice(0, 6).map(c => (
                <button key={c} onClick={() => setBChar(c)} style={{
                  width: 30, height: 30, borderRadius: 6, cursor: 'pointer', fontSize: 14,
                  background: bChar === c ? `${USER_B_COLOR}30` : s.bg3,
                  border: `1px solid ${bChar === c ? USER_B_COLOR : s.border}`,
                  color: bChar === c ? USER_B_COLOR : s.text,
                  fontWeight: bChar === c ? 700 : 400,
                }}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: s.text3, fontSize: 12 }}>Insert at index:</span>
              <input type="number" min={0} max={sorted(charsB).length} value={bInsertIdx}
                onChange={e => setBInsertIdx(Math.max(0, Math.min(sorted(charsB).length, Number(e.target.value))))}
                style={{ width: 50, padding: '4px 8px', borderRadius: 6, border: `1px solid ${s.border}`, background: s.bg3, color: s.text, fontFamily: s.mono, fontSize: 13, textAlign: 'center' }}
              />
            </div>
            <button onClick={addCharB} style={{
              background: USER_B_COLOR, border: 'none', borderRadius: 8, padding: '8px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Add</button>
          </div>
          <div style={{ color: s.text3, fontSize: 11, marginTop: 8 }}>
            Characters added offline or concurrently will have the same position. Sorting is deterministic via tiebreaker.
          </div>
        </div>
      )}

      {tab === 'merge' && (
        <div>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Merge both users changes</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 10, border: `1px solid ${s.border}` }}>
              <div style={{ color: USER_A_COLOR, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>User A chars: {charsA.length}</div>
              <div style={{ fontFamily: s.mono, fontSize: 14, color: s.text, letterSpacing: 1 }}>
                {sorted(charsA).map(c => c.char).join('') || '\u00A0'}
              </div>
            </div>
            <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 10, border: `1px solid ${s.border}` }}>
              <div style={{ color: USER_B_COLOR, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>User B chars: {charsB.length}</div>
              <div style={{ fontFamily: s.mono, fontSize: 14, color: s.text, letterSpacing: 1 }}>
                {sorted(charsB).map(c => c.char).join('') || '\u00A0'}
              </div>
            </div>
          </div>

          <button onClick={doMerge} style={{
            width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: s.green, border: 'none', color: '#fff', marginBottom: 12,
          }}>Merge</button>

          {mergeMsg && (
            <div>
              <div style={{
                background: `${s.green}12`, border: `1px solid ${s.green}35`, borderRadius: 8,
                padding: '12px 16px', marginBottom: 16,
              }}>
                <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Merged Result</div>
                <div style={{ fontFamily: s.mono, fontSize: 18, color: s.text, letterSpacing: 1 }}>
                  {mergeMsg}
                </div>
              </div>
              <div style={{
                background: s.bg3, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`,
              }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Characters sorted by (pos, userId)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {sorted([...charsA, ...charsB].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)).map(ch => (
                    <span key={ch.id} style={{
                      background: ch.userId === 'A' ? `${USER_A_COLOR}18` : `${USER_B_COLOR}18`,
                      padding: '2px 6px', borderRadius: 4, fontFamily: s.mono, fontSize: 12, color: s.text,
                    }}>
                      {charToDisplay(ch.char)}
                      <span style={{ color: s.text3, fontSize: 9, marginLeft: 2 }}>{ch.pos.toFixed(1)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!mergeMsg && (
            <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.6 }}>
              Add characters from both User A and User B tabs, then merge here. The merge uses the CRDT property: sorting by (position, user ID) produces the same result regardless of operation order.
            </div>
          )}
        </div>
      )}

      {tab !== 'merge' && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
