import { useState, useRef } from 'react'
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

const MESSAGES = [
  { id: 0, content: 'order:42 created', offset: 0 },
  { id: 1, content: 'payment:42 processed', offset: 1 },
  { id: 2, content: 'inventory:42 reserved', offset: 2 },
  { id: 3, content: 'shipment:42 dispatched', offset: 3 },
  { id: 4, content: 'order:43 created', offset: 4 },
  { id: 5, content: 'payment:43 processed', offset: 5 },
  { id: 6, content: 'email:42 sent', offset: 6 },
  { id: 7, content: 'inventory:43 reserved', offset: 7 },
  { id: 8, content: 'shipment:43 dispatched', offset: 8 },
  { id: 9, content: 'order:44 created', offset: 9 },
]

export default function OffsetManagementDemo() {
  const [readOffset, setReadOffset] = useState(0)
  const [committedOffset, setCommittedOffset] = useState(0)
  const [autoCommit, setAutoCommit] = useState(true)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const readNext = () => {
    if (readOffset >= MESSAGES.length) return
    setReadOffset(prev => prev + 1)
    setLastAction(`Read offset ${readOffset}`)
    if (autoCommit) {
      setCommittedOffset(prev => Math.max(prev, readOffset + 1))
      setLastAction(`Read + committed offset ${readOffset}`)
    }
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight
      }
    }, 50)
  }

  const commit = () => {
    setCommittedOffset(readOffset)
    setLastAction(`Manually committed offset ${readOffset}`)
  }

  const rewind = (offset: number) => {
    setReadOffset(offset)
    setCommittedOffset(prev => Math.min(prev, offset))
    setLastAction(`Rewound to offset ${offset}`)
  }

  const resetAll = () => {
    setReadOffset(0)
    setCommittedOffset(0)
    setLastAction('Reset to start')
  }

  return (
    <DemoBoundary name="Offset Management">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Offset Management</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button onClick={readNext} disabled={readOffset >= MESSAGES.length} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', cursor: readOffset >= MESSAGES.length ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
          opacity: readOffset >= MESSAGES.length ? 0.4 : 1,
        }}>Read Next</button>
        <button onClick={commit} disabled={autoCommit || readOffset <= committedOffset} style={{
          background: s.bg3, border: `1px solid ${autoCommit || readOffset <= committedOffset ? s.bg3 : s.border}`, borderRadius: 8, padding: '10px 20px',
          color: autoCommit || readOffset <= committedOffset ? s.text3 : s.text, cursor: autoCommit || readOffset <= committedOffset ? 'default' : 'pointer', fontSize: 13,
        }}>Commit Offset</button>
        <button onClick={resetAll} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', cursor: 'pointer' }}>
          <div onClick={() => setAutoCommit(!autoCommit)} style={{
            width: 36, height: 20, borderRadius: 10, background: autoCommit ? s.green : s.bg3,
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2, left: autoCommit ? 18 : 2,
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ color: s.text2, fontSize: 12 }}>Auto-commit</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div ref={logRef} style={{
          flex: 1, background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
          padding: 8, maxHeight: 260, overflow: 'auto',
        }}>
          {MESSAGES.map((msg) => {
            const isRead = msg.offset < readOffset
            const isCommitted = msg.offset < committedOffset
            const isCurrent = msg.offset === readOffset
            let bg = s.bg
            let borderColor = s.border
            let label = ''
            if (isCommitted) {
              bg = `${s.green}08`
              borderColor = s.green
              label = 'committed'
            } else if (isRead) {
              bg = `${s.accent}10`
              borderColor = s.accent
              label = 'read'
            }
            if (isCurrent) {
              borderColor = s.yellow
              bg = `${s.yellow}10`
              label = 'reading'
            }

            return (
              <div key={msg.offset} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', marginBottom: 3, borderRadius: 6,
                background: bg, border: `1px solid ${borderColor}`,
                transition: 'all 0.3s',
              }}>
                <span style={{
                  fontFamily: s.mono, fontSize: 11, color: s.text3, minWidth: 24,
                }}>@{msg.offset}</span>
                <span style={{
                  fontFamily: s.mono, fontSize: 11, color: s.text2, flex: 1,
                }}>{msg.content}</span>
                <span style={{
                  fontSize: 9, color: label === 'committed' ? s.green : label === 'reading' ? s.yellow : label === 'read' ? s.accent : s.text3,
                  fontWeight: 600, textTransform: 'uppercase',
                }}>{label}</span>
              </div>
            )
          })}
        </div>

        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8 }}>Rewind to Offset</div>
            <input type="range" min={0} max={MESSAGES.length - 1} value={readOffset}
              onChange={e => rewind(Number(e.target.value))}
              style={{ width: '100%', accentColor: s.yellow }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>0</span>
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>@{readOffset}</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{MESSAGES.length - 1}</span>
            </div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 14, flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6 }}>State</div>
            <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.8 }}>
              <div>Read: <span style={{ color: s.accent, fontFamily: s.mono }}>@{readOffset}</span></div>
              <div>Committed: <span style={{ color: s.green, fontFamily: s.mono }}>@{committedOffset}</span></div>
              <div>Lag: <span style={{ color: readOffset - committedOffset > 0 ? s.yellow : s.text3, fontFamily: s.mono }}>
                {readOffset - committedOffset}
              </span></div>
            </div>
          </div>

          {lastAction && (
            <div style={{ background: `${s.accent}10`, border: `1px solid ${s.accent}`, borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ color: s.text2, fontSize: 11 }}>{lastAction}</div>
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
