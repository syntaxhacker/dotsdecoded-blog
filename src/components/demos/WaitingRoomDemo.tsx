import { useState, useEffect, useCallback, useRef } from 'react'
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

const USER_NAMES = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace',
  'Hank', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Nick', 'Olivia',
  'Pete', 'Quinn', 'Rosa', 'Sam', 'Tina', 'Uma', 'Vince', 'Wade',
]

interface QueueUser {
  id: number
  name: string
  isVip: boolean
  joinedAt: number
}

let nextId = 1

function createUser(name: string, vip: boolean): QueueUser {
  return { id: nextId++, name, isVip: vip, joinedAt: Date.now() }
}

function buildInitialQueue(): QueueUser[] {
  const q: QueueUser[] = []
  for (let i = 0; i < 8; i++) {
    const name = USER_NAMES[i % USER_NAMES.length]
    q.push(createUser(name, i < 2))
  }
  return q
}

const BASE_PROCESS_TIME = 2500
const VIP_ADVANCE = 3

export default function WaitingRoomDemo() {
  const [queue, setQueue] = useState<QueueUser[]>(buildInitialQueue)
  const [serving, setServing] = useState<QueueUser | null>(null)
  const [served, setServed] = useState<QueueUser[]>([])
  const [speed, setSpeed] = useState(1)
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const processNext = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) {
        setActive(false)
        return prev
      }
      const nextUser = prev[0]
      const rest = prev.slice(1)
      setServing(nextUser)
      setTimeout(() => {
        setServed(prevServed => [...prevServed, nextUser])
        setServing(null)
      }, getStepDelay(1800, speed))
      return rest
    })
    return undefined
  }, [speed])

  useEffect(() => {
    if (!active) return
    timerRef.current = setTimeout(() => {
      processNext()
    }, getStepDelay(BASE_PROCESS_TIME, speed))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, queue.length, processNext, speed])

  const startQueue = () => {
    if (queue.length === 0) return
    setActive(true)
  }

  const pauseQueue = () => setActive(false)

  const addUser = (vip: boolean) => {
    const pool = USER_NAMES.filter(n => !queue.some(u => u.name === n) && !served.some(u => u.name === n) && serving?.name !== n)
    const name = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : `User ${nextId}`
    const newUser = createUser(name, vip)
    setQueue(prev => {
      if (vip) {
        const insertAt = Math.min(VIP_ADVANCE, prev.length)
        const copy = [...prev]
        copy.splice(insertAt, 0, newUser)
        return copy
      }
      return [...prev, newUser]
    })
  }

  const reset = () => {
    setQueue(buildInitialQueue())
    setServing(null)
    setServed([])
    setActive(false)
    nextId = 1
  }

  const getWaitEstimate = (idx: number): string => {
    const secs = (idx + 1) * getStepDelay(BASE_PROCESS_TIME, speed) / 1000
    if (secs < 60) return `~${Math.round(secs)}s`
    return `~${Math.round(secs / 60)}m ${Math.round(secs % 60)}s`
  }

  const totalWait = queue.reduce((sum, _, i) => sum + (i + 1) * getStepDelay(BASE_PROCESS_TIME, speed), 0) / 1000
  const totalWaitStr = totalWait < 60
    ? `~${Math.round(totalWait)}s`
    : `~${Math.round(totalWait / 60)}m ${Math.round(totalWait % 60)}s`

  return (
    <DemoBoundary name="Virtual Waiting Room">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Virtual Waiting Room</div>
            <div style={{ color: s.text3, fontSize: 12, marginTop: 4 }}>
              {served.length} served &middot; {queue.length} waiting &middot; Est. total: {totalWaitStr}
            </div>
          </div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        {serving && (
          <div style={{
            background: `linear-gradient(135deg, ${s.accent}22, ${s.green}11)`,
            border: `1px solid ${s.accent}`, borderRadius: 10,
            padding: '14px 20px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'pulseGlow 1.5s ease-in-out infinite',
          }}>
            <div>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Now Serving</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: s.text, fontSize: 18, fontWeight: 700 }}>{serving.name}</span>
                {serving.isVip && <span style={{
                  background: s.yellow, color: '#000', fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 4,
                }}>VIP</span>}
              </div>
            </div>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 12 }}>Booking Window Active</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {!active ? (
            <button onClick={startQueue} disabled={queue.length === 0} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
              color: '#fff', cursor: queue.length === 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
              opacity: queue.length === 0 ? 0.4 : 1,
            }}>Start Queue</button>
          ) : (
            <button onClick={pauseQueue} style={{
              background: s.yellow, border: 'none', borderRadius: 8, padding: '8px 20px',
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Pause</button>
          )}
          <button onClick={() => addUser(false)} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>+ Add User</button>
          <button onClick={() => addUser(true)} style={{
            background: s.bg3, border: `1px solid ${s.yellow}`, borderRadius: 8, padding: '8px 16px',
            color: s.yellow, cursor: 'pointer', fontSize: 13,
          }}>+ Add VIP</button>
          <button onClick={reset} style={{
            background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px',
            color: s.text3, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 70px 80px 90px',
            gap: 0, padding: '8px 14px', borderBottom: `1px solid ${s.border}`,
            color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            <div>#</div>
            <div>Name</div>
            <div>Tier</div>
            <div>Est. Wait</div>
            <div>Status</div>
          </div>
          {queue.length === 0 ? (
            <div style={{ color: s.text3, fontSize: 13, padding: '24px', textAlign: 'center' }}>
              Queue is empty
            </div>
          ) : (
            queue.map((user, i) => (
              <div key={user.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 70px 80px 90px',
                gap: 0, padding: '8px 14px',
                borderBottom: i < queue.length - 1 ? `1px solid ${s.bg3}` : 'none',
                background: user.isVip ? `${s.yellow}08` : 'transparent',
                transition: 'background 0.3s',
                animation: i === 0 && active ? 'fadeSlide 0.5s ease' : undefined,
              }}>
                <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: s.text, fontSize: 13 }}>{user.name}</span>
                  {user.isVip && <span style={{
                    background: s.yellow, color: '#000', fontSize: 9, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 3,
                  }}>VIP</span>}
                </div>
                <div style={{ color: user.isVip ? s.yellow : s.text3, fontSize: 11 }}>
                  {user.isVip ? 'Priority' : 'Standard'}
                </div>
                <div style={{
                  color: i < 2 ? s.green : i < 5 ? s.yellow : s.text2,
                  fontFamily: s.mono, fontSize: 11,
                }}>
                  {getWaitEstimate(i)}
                </div>
                <div style={{ color: s.text3, fontSize: 11 }}>
                  {active && i === 0 ? 'Next up' : 'Waiting'}
                </div>
              </div>
            ))
          )}
        </div>

        {served.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Recently Served ({served.length})
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {served.slice(-6).reverse().map(u => (
                <div key={u.id} style={{
                  background: s.bg3, borderRadius: 6, padding: '4px 12px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ color: s.green, fontSize: 10 }}>O</span>
                  <span style={{ color: s.text2, fontSize: 12 }}>{u.name}</span>
                  {u.isVip && <span style={{ color: s.yellow, fontSize: 9 }}>VIP</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 ${s.accent}44; }
          50% { box-shadow: 0 0 12px 4px ${s.accent}33; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
    </DemoBoundary>
  )
}
