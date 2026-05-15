import { useState, useMemo } from 'react'
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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface Process {
  id: string
  burst: number
  priority: number
  arrival: number
  color: string
}

const initialProcesses: Process[] = [
  { id: 'P1', burst: 8, priority: 3, arrival: 0, color: s.accent },
  { id: 'P2', burst: 4, priority: 1, arrival: 1, color: s.green },
  { id: 'P3', burst: 9, priority: 4, arrival: 2, color: s.yellow },
  { id: 'P4', burst: 5, priority: 2, arrival: 3, color: s.orange },
]

type Algo = 'fcfs' | 'rr' | 'sjf' | 'priority'

interface GanttEntry {
  pid: string
  start: number
  end: number
  color: string
}

function simulate(processes: Process[], algo: Algo, quantum: number): { gantt: GanttEntry[]; waiting: number; turnaround: number } {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }))
  const gantt: GanttEntry[] = []
  let time = 0
  let completed = 0
  const n = procs.length
  const finished: number[] = []
  let queue: number[] = []
  let current: number | null = null
  let rrTime = 0

  if (algo === 'fcfs') {
    const sorted = [...procs].sort((a, b) => a.arrival - b.arrival)
    for (const p of sorted) {
      if (time < p.arrival) time = p.arrival
      gantt.push({ pid: p.id, start: time, end: time + p.burst, color: p.color })
      time += p.burst
    }
  } else if (algo === 'sjf') {
    const arrivalMap = new Map<number, number[]>()
    procs.forEach((p, i) => {
      if (!arrivalMap.has(p.arrival)) arrivalMap.set(p.arrival, [])
      arrivalMap.get(p.arrival)!.push(i)
    })
    while (completed < n) {
      if (arrivalMap.has(time)) {
        for (const idx of arrivalMap.get(time)!) {
          queue.push(idx)
        }
      }
      if (queue.length === 0) { time++; continue }
      queue.sort((a, b) => procs[a].remaining - procs[b].remaining || procs[a].arrival - procs[b].arrival)
      const idx = queue.shift()!
      const p = procs[idx]
      gantt.push({ pid: p.id, start: time, end: time + p.remaining, color: p.color })
      time += p.remaining
      p.remaining = 0
      completed++
      finished.push(idx)
    }
  } else if (algo === 'priority') {
    const arrivalMap = new Map<number, number[]>()
    procs.forEach((p, i) => {
      if (!arrivalMap.has(p.arrival)) arrivalMap.set(p.arrival, [])
      arrivalMap.get(p.arrival)!.push(i)
    })
    while (completed < n) {
      if (arrivalMap.has(time)) {
        for (const idx of arrivalMap.get(time)!) {
          queue.push(idx)
        }
      }
      if (queue.length === 0) { time++; continue }
      queue.sort((a, b) => procs[a].priority - procs[b].priority || procs[a].arrival - procs[b].arrival)
      const idx = queue.shift()!
      const p = procs[idx]
      gantt.push({ pid: p.id, start: time, end: time + p.remaining, color: p.color })
      time += p.remaining
      p.remaining = 0
      completed++
      finished.push(idx)
    }
  } else if (algo === 'rr') {
    let readyQueue: number[] = []
    const arrivalEvents: [number, number][] = procs.map((p, i) => [p.arrival, i])
    arrivalEvents.sort((a, b) => a[0] - b[0])
    let arrivalIdx = 0
    while (completed < n) {
      while (arrivalIdx < arrivalEvents.length && arrivalEvents[arrivalIdx][0] <= time) {
        readyQueue.push(arrivalEvents[arrivalIdx][1])
        arrivalIdx++
      }
      if (readyQueue.length === 0 && current === null) {
        if (arrivalIdx < arrivalEvents.length) {
          time = arrivalEvents[arrivalIdx][0]
          continue
        } else break
      }
      if (current === null) {
        current = readyQueue.shift()!
        rrTime = 0
      }
      const idx = current
      const p = procs[idx]
      const slice = Math.min(quantum, p.remaining)
      gantt.push({ pid: p.id, start: time, end: time + slice, color: p.color })
      time += slice
      p.remaining -= slice
      rrTime += slice
      while (arrivalIdx < arrivalEvents.length && arrivalEvents[arrivalIdx][0] <= time) {
        readyQueue.push(arrivalEvents[arrivalIdx][1])
        arrivalIdx++
      }
      if (p.remaining === 0) {
        completed++
        finished.push(idx)
        current = null
        rrTime = 0
      } else {
        readyQueue.push(idx)
        current = null
        rrTime = 0
      }
    }
  }

  const completionTimes = new Map<string, number>()
  for (const entry of gantt) {
    completionTimes.set(entry.pid, entry.end)
  }
  const totalWaiting = procs.reduce((sum, p) => {
    const ct = completionTimes.get(p.id) || 0
    return sum + (ct - p.arrival - p.burst)
  }, 0)
  const totalTurnaround = procs.reduce((sum, p) => {
    const ct = completionTimes.get(p.id) || 0
    return sum + (ct - p.arrival)
  }, 0)

  return {
    gantt,
    waiting: totalWaiting / n,
    turnaround: totalTurnaround / n,
  }
}

export default function OsSchedulingDemo() {
  const [algo, setAlgo] = useState<Algo>('fcfs')
  const [quantum, setQuantum] = useState(3)

  const result = useMemo(() => simulate(initialProcesses, algo, quantum), [algo, quantum])

  const totalTime = result.gantt.length > 0 ? result.gantt[result.gantt.length - 1].end : 1
  const scale = 600 / totalTime

  return (
    <DemoBoundary name="CPU Scheduling Algorithms">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CPU Scheduling</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Different scheduling algorithms yield different performance. The Gantt chart below shows execution order.
          Average waiting time and turnaround time measure efficiency.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['fcfs', 'sjf', 'priority', 'rr'] as Algo[]).map(a => (
            <button key={a} onClick={() => setAlgo(a)} style={{
              background: algo === a ? s.accent : s.bg3,
              border: `1px solid ${algo === a ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: algo === a ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, fontFamily: s.mono, fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              {a === 'fcfs' ? 'FCFS' : a === 'rr' ? 'Round Robin' : a === 'sjf' ? 'SJF' : 'Priority'}
            </button>
          ))}
        </div>

        {algo === 'rr' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Time Quantum: {quantum}</label>
            <input type="range" min={1} max={8} value={quantum} onChange={e => setQuantum(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
          </div>
        )}

        <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 16, marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Gantt Chart</div>
          <div style={{ display: 'flex', height: 40, borderRadius: 6, overflow: 'hidden' }}>
            {result.gantt.map((entry, i) => (
              <div key={i} style={{
                width: (entry.end - entry.start) * scale,
                minWidth: 0,
                background: entry.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#000',
                fontFamily: s.mono,
                position: 'relative',
              }}>
                {entry.end - entry.start >= 2 ? entry.pid : ''}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 4, position: 'relative', height: 16 }}>
            {result.gantt.map((entry, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: entry.start * scale,
                fontSize: 9, color: s.text3, fontFamily: s.mono,
              }}>
                {entry.start}
              </div>
            ))}
            {result.gantt.length > 0 && (
              <div style={{
                position: 'absolute',
                left: result.gantt[result.gantt.length - 1].end * scale,
                fontSize: 9, color: s.text3, fontFamily: s.mono,
              }}>
                {result.gantt[result.gantt.length - 1].end}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {initialProcesses.map(p => (
            <div key={p.id} style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 14px', flex: 1, minWidth: 100,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>{p.id}</span>
              </div>
              <div style={{ color: s.text3, fontSize: 11 }}>
                Burst: {p.burst} | Arrival: {p.arrival} | Pri: {p.priority}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{
            background: s.bg3, borderRadius: 8, padding: '12px 20px', flex: 1, textAlign: 'center',
          }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Avg Waiting Time</div>
            <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{result.waiting.toFixed(1)}</div>
          </div>
          <div style={{
            background: s.bg3, borderRadius: 8, padding: '12px 20px', flex: 1, textAlign: 'center',
          }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Avg Turnaround</div>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{result.turnaround.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
