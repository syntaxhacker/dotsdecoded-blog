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

type UserStatus = 'online' | 'idle' | 'offline'

interface User {
  id: string
  name: string
  color: string
  status: UserStatus
  lastSeen: number
  typing: boolean
  typingTarget?: string
}

const initialUsers: User[] = [
  { id: 'alice', name: 'Alice', color: s.accent, status: 'online', lastSeen: Date.now(), typing: false },
  { id: 'bob', name: 'Bob', color: s.green, status: 'online', lastSeen: Date.now(), typing: false },
  { id: 'carol', name: 'Carol', color: s.orange, status: 'idle', lastSeen: Date.now() - 300000, typing: false },
  { id: 'dave', name: 'Dave', color: s.purple, status: 'offline', lastSeen: Date.now() - 3600000, typing: false },
  { id: 'eve', name: 'Eve', color: s.yellow, status: 'online', lastSeen: Date.now(), typing: false },
]

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

const statusLabel: Record<UserStatus, string> = {
  online: 'ONLINE',
  idle: 'IDLE',
  offline: 'OFFLINE',
}

const statusColor: Record<UserStatus, string> = {
  online: s.green,
  idle: s.yellow,
  offline: s.text3,
}

export default function PresenceDemo() {
  const [users, setUsers] = useState(initialUsers)
  const [privacyMode, setPrivacyMode] = useState(false)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [eventLog, setEventLog] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    setUsers((prev) => {
      return prev.map((u) => {
        if (Math.random() < 0.15) {
          const statuses: UserStatus[] = ['online', 'idle', 'offline']
          const weights = [0.5, 0.2, 0.3]
          let r = Math.random()
          let newStatus: UserStatus = 'online'
          for (let i = 0; i < statuses.length; i++) {
            r -= weights[i]
            if (r <= 0) { newStatus = statuses[i]; break }
          }

          if (newStatus !== u.status) {
            const logEntry = `${u.name}: ${statusLabel[u.status]} -> ${statusLabel[newStatus]}`
            setEventLog((prev) => [...prev.slice(-19), logEntry])
          }

          return {
            ...u,
            status: newStatus,
            lastSeen: newStatus === 'online' ? Date.now() : u.lastSeen,
            typing: newStatus !== 'online' ? false : u.typing,
          }
        }

        if (u.status === 'online' && Math.random() < 0.1) {
          const others = prev.filter((o) => o.id !== u.id && o.status === 'online')
          if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)]
            const logEntry = `${u.name} is typing to ${target.name}...`
            setEventLog((prev) => [...prev.slice(-19), logEntry])
            return { ...u, typing: true, typingTarget: target.id }
          }
        }

        if (u.typing && Math.random() < 0.25) {
          setEventLog((prev) => [...prev.slice(-19), `${u.name} stopped typing`])
          return { ...u, typing: false, typingTarget: undefined }
        }

        return u
      })
    })
  }, [])

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    const interval = setInterval(tick, getStepDelay(600, speed))
    tickRef.current = interval as unknown as number
    return () => clearInterval(interval)
  }, [running, speed, tick])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [eventLog])

  return (
    <DemoBoundary name="Online Presence">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <button
            onClick={() => setRunning(!running)}
            style={{
              padding: '6px 20px',
              background: running ? s.bg3 : s.accent,
              color: running ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: s.mono,
              transition: 'all 0.2s',
            }}
          >
            {running ? 'Pause' : 'Simulate'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{
              padding: '5px 14px',
              background: privacyMode ? `${s.red}15` : s.bg2,
              border: `1px solid ${privacyMode ? s.red : s.border}`,
              borderRadius: 6,
              color: privacyMode ? s.red : s.text3,
              fontFamily: s.mono,
              fontSize: 11,
              cursor: 'pointer',
              marginLeft: 'auto',
              transition: 'all 0.15s',
            }}
          >
            {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono,
                fontSize: 10,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                User Status
              </div>
              <div style={{ padding: '8px' }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      marginBottom: 4,
                      borderRadius: 6,
                      background: `${u.color}08`,
                      border: `1px solid ${u.color}20`,
                    }}
                  >
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: statusColor[u.status],
                      boxShadow: u.status === 'online' ? `0 0 6px ${s.green}` : 'none',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: u.color }}>
                          {u.name}
                        </span>
                        <span style={{
                          fontFamily: s.mono,
                          fontSize: 9,
                          color: statusColor[u.status],
                          background: `${statusColor[u.status]}15`,
                          padding: '1px 6px',
                          borderRadius: 3,
                        }}>
                          {statusLabel[u.status]}
                        </span>
                      </div>
                      {u.typing && (
                        <div style={{ fontFamily: s.mono, fontSize: 10, color: s.accent, marginTop: 2 }}>
                          typing to {users.find((x) => x.id === u.typingTarget)?.name || 'someone'}...
                        </div>
                      )}
                    </div>
                    {!privacyMode && u.status !== 'online' && (
                      <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                        {formatTimeAgo(u.lastSeen)}
                      </span>
                    )}
                    {privacyMode && u.status !== 'online' && (
                      <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, fontStyle: 'italic' }}>
                        hidden
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono,
                fontSize: 10,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Presence Event Log
              </div>
              <div ref={logRef} style={{ maxHeight: 320, overflowY: 'auto', padding: '6px 10px', fontFamily: s.mono, fontSize: 10, lineHeight: 1.7 }}>
                {eventLog.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 11, textAlign: 'center', padding: '40px 0' }}>
                    Events will appear here
                  </div>
                )}
                {eventLog.map((evt, i) => (
                  <div key={i} style={{ color: s.text2 }}>
                    {evt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
