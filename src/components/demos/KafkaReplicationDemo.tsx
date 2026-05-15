import { useState, useCallback, useEffect, useRef } from 'react'
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

type ReplicaStatus = 'leader' | 'isr' | 'lagging' | 'dead'

interface Replica {
  id: number
  status: ReplicaStatus
  log: number[]
}

const INITIAL_REPLICAS: Replica[] = [
  { id: 0, status: 'leader', log: [0, 1, 2] },
  { id: 1, status: 'isr', log: [0, 1, 2] },
  { id: 2, status: 'isr', log: [0, 1, 2] },
]

export default function KafkaReplicationDemo() {
  const [replicas, setReplicas] = useState<Replica[]>(INITIAL_REPLICAS)
  const [nextMsg, setNextMsg] = useState(3)
  const [phase, setPhase] = useState<'idle' | 'writing' | 'replicating' | 'elected'>('idle')
  const [electionMsg, setElectionMsg] = useState<string | null>(null)
  const [flashBroker, setFlashBroker] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const sendMessage = useCallback(() => {
    const msgId = nextMsg
    setNextMsg(n => n + 1)
    setPhase('writing')
    setElectionMsg(null)

    setReplicas(prev => {
      const leader = prev.find(r => r.status === 'leader')
      if (!leader) return prev
      return prev.map(r =>
        r.id === leader.id ? { ...r, log: [...r.log, msgId] } : r
      )
    })
    setFlashBroker(0)
    setTimeout(() => setFlashBroker(null), 400)

    setTimeout(() => {
      setPhase('replicating')
      setReplicas(prev => prev.map(r => {
        if (r.status === 'isr') {
          return { ...r, log: [...r.log, msgId] }
        }
        return r
      }))
      setFlashBroker(1)
      setTimeout(() => setFlashBroker(null), 400)
      setTimeout(() => {
        setFlashBroker(2)
        setTimeout(() => setFlashBroker(null), 400)
      }, 300)
      setTimeout(() => setPhase('idle'), 800)
    }, 600)
  }, [nextMsg])

  const killLeader = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setElectionMsg('Leader broker 0 has failed! Initiating controller election...')

    setReplicas(prev => prev.map(r =>
      r.id === 0 ? { ...r, status: 'dead' as ReplicaStatus } : r
    ))

    setTimeout(() => {
      setPhase('elected')
      setElectionMsg('Controller detected failure. Electing new leader from ISR...')
      setReplicas(prev => {
        const newLeader = prev.find(r => r.status === 'isr' && r.log.length > 0)
        if (!newLeader) return prev
        return prev.map(r =>
          r.id === newLeader.id
            ? { ...r, status: 'leader' as ReplicaStatus }
            : r.id === 1
              ? { ...r, status: 'isr' as ReplicaStatus }
              : r
        )
      })
    }, 1000)

    setTimeout(() => {
      setElectionMsg('New leader elected. Partition is available again.')
      setPhase('idle')
    }, 2200)
  }

  const resetAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setReplicas(INITIAL_REPLICAS.map(r => ({ ...r, log: [...r.log] })))
    setNextMsg(3)
    setPhase('idle')
    setElectionMsg(null)
    setFlashBroker(null)
  }

  const statusColor = (st: ReplicaStatus) => {
    switch (st) {
      case 'leader': return s.green
      case 'isr': return s.accent
      case 'lagging': return s.yellow
      case 'dead': return s.red
    }
  }

  const statusLabel = (st: ReplicaStatus) => {
    switch (st) {
      case 'leader': return 'Leader'
      case 'isr': return 'ISR'
      case 'lagging': return 'Lagging'
      case 'dead': return 'Dead'
    }
  }

  const leader = replicas.find(r => r.status === 'leader')

  return (
    <DemoBoundary name="Kafka Replication">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Partition Replication</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={sendMessage} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>Send Message</button>
        <button onClick={killLeader} disabled={!leader} style={{
          background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', cursor: leader ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
          opacity: leader ? 1 : 0.4,
        }}>Kill Leader</button>
        <button onClick={resetAll} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: s.mono,
            background: `${s.green}15`, color: s.green, border: `1px solid ${s.green}`,
          }}>replication.factor=3</span>
          <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: s.mono,
            background: `${s.accent}15`, color: s.accent, border: `1px solid ${s.accent}`,
          }}>min.insync.replicas=2</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {replicas.map((r) => {
          const isLeader = r.status === 'leader'
          return (
            <div key={r.id} style={{
              flex: 1, background: s.bg2, borderRadius: 12,
              border: `2px solid ${flashBroker === r.id ? s.yellow : statusColor(r.status)}`,
              padding: 14, transition: 'all 0.3s', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: statusColor(r.status),
                  flexShrink: 0,
                }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Broker {r.id}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontFamily: s.mono, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 4,
                  background: `${statusColor(r.status)}20`, color: statusColor(r.status),
                  border: `1px solid ${statusColor(r.status)}`,
                }}>{statusLabel(r.status)}</span>
              </div>
              {isLeader && (
                <div style={{
                  background: `${s.green}10`, border: `1px solid ${s.green}`, borderRadius: 6,
                  padding: '4px 8px', marginBottom: 8, fontSize: 10, color: s.text2,
                }}>
                  Producers write here. Leader appends to local log.
                </div>
              )}
              {!isLeader && r.status !== 'dead' && (
                <div style={{
                  background: `${s.accent}10`, border: `1px solid ${s.accent}`, borderRadius: 6,
                  padding: '4px 8px', marginBottom: 8, fontSize: 10, color: s.text2,
                }}>
                  Pulls from leader. In-sync replica set.
                </div>
              )}
              {r.status === 'dead' && (
                <div style={{
                  background: `${s.red}10`, border: `1px solid ${s.red}`, borderRadius: 6,
                  padding: '4px 8px', marginBottom: 8, fontSize: 10, color: s.text2,
                }}>
                  Broker offline. Removed from ISR.
                </div>
              )}
              <div style={{
                background: s.bg, borderRadius: 6, padding: 6,
                border: `1px solid ${s.border}`, maxHeight: 100, overflowY: 'auto',
              }}>
                {r.log.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 10, textAlign: 'center', padding: 8 }}>
                    empty
                  </div>
                )}
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {r.log.map((msgId) => (
                    <span key={msgId} style={{
                      background: `${statusColor(r.status)}15`, color: s.text,
                      fontFamily: s.mono, fontSize: 10, padding: '2px 5px', borderRadius: 3,
                      border: `1px solid ${statusColor(r.status)}40`,
                    }}>{msgId}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {electionMsg && (
        <div style={{
          background: `${s.yellow}10`, border: `1px solid ${s.yellow}`, borderRadius: 8,
          padding: '10px 14px', fontSize: 12, color: s.text2, lineHeight: 1.5,
        }}>
          <span style={{ color: s.yellow, fontWeight: 600 }}>Event: </span>
          {electionMsg}
        </div>
      )}

      <div style={{ marginTop: 14, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.green }} />
            <span style={{ color: s.text2, fontSize: 11 }}>Leader: handles all reads/writes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.accent }} />
            <span style={{ color: s.text2, fontSize: 11 }}>ISR: in-sync replicas (eligible to become leader)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.yellow }} />
            <span style={{ color: s.text2, fontSize: 11 }}>min.insync.replicas: minimum ISR count for acks=all</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
