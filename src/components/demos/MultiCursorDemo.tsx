import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface UserCursor {
  id: string
  name: string
  color: string
  pos: number
  selection: [number, number] | null
}

const INIT_TEXT = 'Hello World'

const USERS: UserCursor[] = [
  { id: 'you', name: 'You', color: s.green, pos: 5, selection: null },
  { id: 'alice', name: 'Alice', color: s.red, pos: 0, selection: null },
  { id: 'bob', name: 'Bob', color: s.accent, pos: 6, selection: null },
]

const ALICE_TYPING = 'Lorem ipsum dolor sit amet consectetur adipiscing elit'
const BOB_TYPING = 'Sed do eiusmod tempor incididunt ut labore'

export default function MultiCursorDemo() {
  const [text, setText] = useState(INIT_TEXT)
  const [cursors, setCursors] = useState<UserCursor[]>(USERS)
  const [youPos, setYouPos] = useState(5)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const aliceRef = useRef(0)
  const bobRef = useRef(0)
  const aliceTargetRef = useRef(0)
  const bobTargetRef = useRef(0)

  const clampPos = useCallback((pos: number, len: number) => Math.max(0, Math.min(pos, len)), [])

  const updateCursor = useCallback((id: string, upd: Partial<UserCursor>) => {
    setCursors(prev => prev.map(c => c.id === id ? { ...c, ...upd } : c))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setText(prev => {
        const len = prev.length

        aliceTargetRef.current = Math.min(aliceTargetRef.current + 1, ALICE_TYPING.length)
        if (aliceTargetRef.current > aliceRef.current) {
          const ch = ALICE_TYPING[aliceRef.current]
          aliceRef.current++
          setCursors(c => c.map(uc => uc.id === 'alice' ? { ...uc, pos: uc.pos + 1 } : uc))
          return prev + ch
        }
        return prev
      })

      setText(prev => {
        const len = prev.length

        bobTargetRef.current = Math.min(bobTargetRef.current + 1, BOB_TYPING.length)
        if (bobTargetRef.current > bobRef.current) {
          const ch = BOB_TYPING[bobRef.current]
          bobRef.current++
          setCursors(c => c.map(uc => uc.id === 'bob' ? { ...uc, pos: uc.pos + 1 } : uc))
          return prev + ch
        }
        return prev
      })
    }, 800)

    return () => clearInterval(interval)
  }, [])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setText(val)
    setYouPos(val.length)
    setCursors(prev => prev.map(c => c.id === 'you' ? { ...c, pos: val.length } : c))
  }, [])

  const handleClick = useCallback((pos: number) => {
    setYouPos(pos)
    setCursors(prev => prev.map(c => c.id === 'you' ? { ...c, pos } : c))
    inputRef.current?.focus()
  }, [])

  const charWidth = 9.6
  const lineHeightVal = 28
  const charsPerLine = Math.floor(680 / charWidth)

  const lines: string[] = []
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.slice(i, i + charsPerLine))
  }

  const posToXY = (pos: number): { x: number; y: number; lineIdx: number; colIdx: number } => {
    const lineIdx = Math.min(Math.floor(pos / charsPerLine), lines.length - 1)
    const colIdx = pos - lineIdx * charsPerLine
    return { x: colIdx * charWidth, y: lineIdx * lineHeightVal, lineIdx, colIdx }
  }

  return (
    <DemoBoundary name="Multi-Cursor Collaboration">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Multi-Cursor Collaboration</div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.5 }}>
        Alice and Bob type automatically. You can click to position your cursor and type. Each user has a unique color.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {cursors.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: u.color }} />
            <span style={{ color: u.color, fontSize: 12, fontWeight: 600 }}>{u.name}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: 'relative', background: s.bg2, border: `2px solid ${isFocused ? s.accent : s.border}`,
        borderRadius: 12, padding: '16px 20px', minHeight: 120,
        transition: 'border-color 0.2s', cursor: 'text',
        fontFamily: s.mono, fontSize: 16, lineHeight: `${lineHeightVal}px`,
      }}
        onClick={() => {
          inputRef.current?.focus()
          setIsFocused(true)
        }}
      >
        {lines.map((line, li) => (
          <div key={li} style={{ position: 'relative', height: lineHeightVal, whiteSpace: 'nowrap' }}>
            {line.split('').map((ch, ci) => {
              const globalPos = li * charsPerLine + ci
              return (
                <span
                  key={ci}
                  onClick={(e) => { e.stopPropagation(); handleClick(globalPos) }}
                  style={{
                    position: 'relative', display: 'inline-block', width: charWidth,
                    color: s.text, textAlign: 'center', cursor: 'text',
                    background: cursors.some(c => c.selection && globalPos >= c.selection[0] && globalPos < c.selection[1])
                      ? `${cursors.find(c => c.selection && globalPos >= c.selection[0] && globalPos < c.selection[1])!.color}30`
                      : 'transparent',
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              )
            })}
          </div>
        ))}

        {cursors.map(u => {
          const xy = posToXY(u.pos)
          if (xy.lineIdx < 0 || xy.lineIdx >= lines.length) return null
          const isLineLongEnough = (u.pos - xy.lineIdx * charsPerLine) <= (lines[xy.lineIdx]?.length || 0)
          if (!isLineLongEnough && u.pos >= text.length) return null
          return (
            <div key={u.id} style={{
              position: 'absolute',
              left: xy.x + 20,
              top: xy.y + 16,
              transition: 'left 0.15s ease, top 0.15s ease',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 2, height: 18,
                background: u.color,
                borderRadius: 1,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                  background: u.color, color: '#fff', fontSize: 10, padding: '1px 5px',
                  borderRadius: 4, whiteSpace: 'nowrap', fontWeight: 600,
                }}>
                  {u.name}
                </div>
              </div>
            </div>
          )
        })}

        <input
          ref={inputRef}
          value={text}
          onChange={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            position: 'absolute', left: -9999, top: -9999, opacity: 0, width: 1, height: 1,
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div style={{ marginTop: 12, color: s.text3, fontSize: 12, lineHeight: 1.5 }}>
        Click in the document to position your cursor (green). Type to add text. Alice (red) and Bob (blue) type automatically. Each user has their own cursor color, position, and label.
      </div>

      <div style={{
        marginTop: 16, background: s.bg3, borderRadius: 8, padding: '10px 14px',
        border: `1px solid ${s.border}`, fontSize: 12, color: s.text2, lineHeight: 1.5,
      }}>
        <span style={{ color: s.text3 }}>Real cursor sync:</span> Cursor positions are sent as frequent updates (throttled to 30fps) over WebSocket. Selection ranges use start/end offsets. Each client renders remote cursors as overlays without modifying the document text.
      </div>
    </div>
    </DemoBoundary>
  )
}
