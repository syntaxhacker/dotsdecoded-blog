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

type DoubleType = 'mock' | 'stub' | 'fake' | 'spy' | 'none'

interface DoubleInfo {
  type: DoubleType
  label: string
  color: string
  desc: string
  behavior: string
  analogy: string
}

const doubles: DoubleInfo[] = [
  {
    type: 'mock', label: 'Mock', color: s.accent,
    desc: 'Verifies that the repository was called with the correct arguments. Fails the test if the expected interaction does not happen.',
    behavior: 'expect(repo).to receive(:find_user).with(42)',
    analogy: 'A detective who checks the security footage to confirm the mail carrier visited and rang the bell.',
  },
  {
    type: 'stub', label: 'Stub', color: s.green,
    desc: 'Returns a canned response when a method is called. Does not verify whether the call happened or how many times.',
    behavior: 'allow(repo).to receive(:find_user).and_return(user)',
    analogy: 'A mail slot that always has a letter ready. You receive the letter but nobody checks if you actually opened the slot.',
  },
  {
    type: 'fake', label: 'Fake', color: s.orange,
    desc: 'A lightweight working implementation. Uses an in-memory hash instead of a real database. Has real behavior but no side effects.',
    behavior: 'class FakeRepo { users = {}; find(id) { return this.users[id] } }',
    analogy: 'A toy mailbox that works like the real one but is made of plastic and stays on your desk. You can practice mailing letters without visiting the post office.',
  },
  {
    type: 'spy', label: 'Spy', color: s.purple,
    desc: 'Wraps the real object and records all calls. Lets the real implementation run while also tracking which methods were called, with what arguments, and how many times.',
    behavior: 'spy = spy(repo); spy.find_user(42); expect(spy).to have_received(:find_user)',
    analogy: 'A body camera on the mail carrier. They deliver the mail normally, but you can review the footage to see everywhere they went.',
  },
  {
    type: 'none', label: 'Real DB', color: s.red,
    desc: 'The actual database connection. Every call performs a real query. Slow, stateful, and can produce flaky tests when data leaks between test cases.',
    behavior: 'User.find(42) -- actual SQL query to PostgreSQL',
    analogy: 'Sending a letter through the actual postal service. It works but takes time, costs money, and the letter might get lost.',
  },
]

interface LogEntry {
  text: string
  color: string
}

export default function TestDoublesDemo() {
  const [doubleType, setDoubleType] = useState<DoubleType>('none')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [phase, setPhase] = useState<number>(-1)

  const currentDouble = doubles.find(d => d.type === doubleType)!

  const runTest = useCallback(() => {
    setLogs([])
    setResult(null)
    setRunning(true)
    setPhase(0)

    const timeline: Array<{ delay: number; log: LogEntry; phase: number }> = []

    timeline.push({ delay: 200, log: { text: 'Service: getting user by ID 42', color: s.text }, phase: 0 })
    timeline.push({ delay: 400, log: { text: '', color: s.text3 }, phase: 0 })

    if (doubleType === 'none') {
      timeline.push({ delay: 600, log: { text: 'Repository: User.find(42)', color: s.text2 }, phase: 1 })
      timeline.push({ delay: 800, log: { text: '  Opening database connection...', color: s.yellow }, phase: 1 })
      timeline.push({ delay: 1200, log: { text: '  SQL: SELECT * FROM users WHERE id = 42', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1600, log: { text: '  Waiting for query result...', color: s.yellow }, phase: 1 })
      timeline.push({ delay: 2200, log: { text: '  Response: 1 row returned (latency: 800ms)', color: s.green }, phase: 1 })
      timeline.push({ delay: 2600, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 2800, log: { text: 'Service: user found (name: "Alice", email: "alice@example.com")', color: s.text }, phase: 2 })
    } else if (doubleType === 'mock') {
      timeline.push({ delay: 600, log: { text: '# Mock setup: expect(repo).to receive(:find_user).with(42)', color: s.accent }, phase: 1 })
      timeline.push({ delay: 700, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 800, log: { text: 'Repository: find_user(42) called', color: s.text2 }, phase: 1 })
      timeline.push({ delay: 900, log: { text: '  Mock registered the call', color: s.accent }, phase: 1 })
      timeline.push({ delay: 1000, log: { text: '  Arguments match expectation: PASS', color: s.green }, phase: 1 })
      timeline.push({ delay: 1100, log: { text: '  Returning stubbed response', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1300, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1500, log: { text: 'Mock verification: find_user was called exactly 1 time with [42]', color: s.green }, phase: 2 })
      timeline.push({ delay: 1700, log: { text: '', color: s.text3 }, phase: 2 })
      timeline.push({ delay: 1900, log: { text: 'Test PASSED - all expectations met', color: s.green }, phase: 2 })
    } else if (doubleType === 'stub') {
      timeline.push({ delay: 600, log: { text: '# Stub setup: allow(repo).to receive(:find_user).and_return(user)', color: s.green }, phase: 1 })
      timeline.push({ delay: 700, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 800, log: { text: 'Repository: find_user(42) called', color: s.text2 }, phase: 1 })
      timeline.push({ delay: 900, log: { text: '  Stub intercepted the call', color: s.green }, phase: 1 })
      timeline.push({ delay: 1000, log: { text: '  Returning: { id: 42, name: "Alice", email: "alice@example.com" }', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1200, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1400, log: { text: 'Service: user found (name: "Alice", email: "alice@example.com")', color: s.text }, phase: 2 })
    } else if (doubleType === 'fake') {
      timeline.push({ delay: 600, log: { text: '# Fake repo: in-memory HashMap implementation', color: s.orange }, phase: 1 })
      timeline.push({ delay: 700, log: { text: 'class InMemoryUserRepo {', color: s.orange }, phase: 1 })
      timeline.push({ delay: 800, log: { text: '  private users = new Map<number, User>()', color: s.orange }, phase: 1 })
      timeline.push({ delay: 900, log: { text: '  async findUser(id: number): Promise<User | null> {', color: s.orange }, phase: 1 })
      timeline.push({ delay: 1000, log: { text: '    return this.users.get(id) ?? null', color: s.orange }, phase: 1 })
      timeline.push({ delay: 1100, log: { text: '  }', color: s.orange }, phase: 1 })
      timeline.push({ delay: 1200, log: { text: '}', color: s.orange }, phase: 1 })
      timeline.push({ delay: 1400, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1600, log: { text: 'Repository: find_user(42) called', color: s.text2 }, phase: 1 })
      timeline.push({ delay: 1700, log: { text: '  Fake checks in-memory map...', color: s.orange }, phase: 1 })
      timeline.push({ delay: 1800, log: { text: '  Found user in memory (no SQL executed)', color: s.green }, phase: 1 })
      timeline.push({ delay: 2000, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 2200, log: { text: 'Service: user found (name: "Alice", email: "alice@example.com")', color: s.text }, phase: 2 })
    } else if (doubleType === 'spy') {
      timeline.push({ delay: 600, log: { text: '# Spy setup: repo = spy(realRepo)', color: s.purple }, phase: 1 })
      timeline.push({ delay: 700, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 800, log: { text: 'Repository: find_user(42) called', color: s.text2 }, phase: 1 })
      timeline.push({ delay: 900, log: { text: '  Spy recorded the call', color: s.purple }, phase: 1 })
      timeline.push({ delay: 1000, log: { text: '  Forwarding to real implementation...', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 1500, log: { text: '  SQL: SELECT * FROM users WHERE id = 42', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 2000, log: { text: '  Response: 1 row returned', color: s.green }, phase: 1 })
      timeline.push({ delay: 2200, log: { text: '', color: s.text3 }, phase: 1 })
      timeline.push({ delay: 2400, log: { text: 'Service: user found (name: "Alice", email: "alice@example.com")', color: s.text }, phase: 2 })
      timeline.push({ delay: 2700, log: { text: '', color: s.text3 }, phase: 2 })
      timeline.push({ delay: 2900, log: { text: 'Spy recorded calls:', color: s.purple }, phase: 2 })
      timeline.push({ delay: 3100, log: { text: '  find_user(42) x1', color: s.purple }, phase: 2 })
    }

    const final = timeline[timeline.length - 1].delay + 200
    timeline.push({ delay: final, log: { text: '', color: s.text3 }, phase: 3 })

    timeline.forEach(({ delay, log, phase: p }) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log])
        setPhase(p)
      }, delay)
    })

    setTimeout(() => {
      setRunning(false)
      setResult(doubleType === 'none' ? 'PASS (2.4s)' : doubleType === 'spy' ? 'PASS (2.9s)' : doubleType === 'fake' ? 'PASS (1.8s)' : 'PASS (0.5s)')
    }, final + 100)
  }, [doubleType])

  return (
    <DemoBoundary name="Test Doubles">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          Test Doubles
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Service queries a Repository backed by a database. Toggle the double type to see how each behaves.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {doubles.map(d => (
            <button
              key={d.type}
              onClick={() => { setDoubleType(d.type); setLogs([]); setResult(null); setPhase(-1) }}
              style={{
                flex: 1, minWidth: 80, padding: '8px 10px', cursor: 'pointer', borderRadius: 6,
                background: doubleType === d.type ? `${d.color}20` : s.bg3,
                border: `1px solid ${doubleType === d.type ? d.color : s.border}`,
                color: doubleType === d.type ? d.color : s.text2,
                fontWeight: 600, fontSize: 11, fontFamily: s.mono,
                transition: 'all 0.15s',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{
              width: 70, height: 48, borderRadius: 8, background: s.bg3, border: `2px solid ${s.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: s.accent, fontWeight: 600, fontFamily: s.mono,
            }}>
              Service
            </div>
            <div style={{ color: s.text3, fontSize: 18 }}>{'\u2192'}</div>
            <div style={{
              width: 100, height: 48, borderRadius: 8,
              background: doubleType === 'none' ? s.red + '15' : `${currentDouble.color}15`,
              border: `2px solid ${doubleType === 'none' ? s.red : currentDouble.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, fontFamily: s.mono,
              color: doubleType === 'none' ? s.red : currentDouble.color,
              transition: 'all 0.2s',
            }}>
              {currentDouble.label}
            </div>
            <div style={{ color: s.text3, fontSize: 18 }}>{'\u2192'}</div>
            <div style={{
              width: 90, height: 48, borderRadius: 8,
              background: doubleType === 'none' ? s.green + '10' : s.bg3,
              border: `2px solid ${doubleType === 'none' ? s.green : s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, fontFamily: s.mono,
              color: doubleType === 'none' ? s.green : s.text3,
              transition: 'all 0.2s',
            }}>
              Database
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          <div style={{ color: currentDouble.color, fontFamily: s.mono, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>
            {currentDouble.behavior}
          </div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
            {currentDouble.desc}
          </div>
          <div style={{ color: s.text3, fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
            {currentDouble.analogy}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            {doubleType === 'none' ? 'Real database query' : `Using ${currentDouble.label.toLowerCase()} for repository`}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setLogs([]); setResult(null); setPhase(-1) }} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
              color: s.text2, cursor: 'pointer', fontSize: 11, fontFamily: s.mono,
            }}>Clear</button>
            <button
              onClick={runTest}
              disabled={running}
              style={{
                background: currentDouble.color,
                border: 'none', borderRadius: 6, padding: '6px 16px',
                color: '#fff', cursor: running ? 'wait' : 'pointer',
                fontSize: 11, fontFamily: s.mono, fontWeight: 600,
                opacity: running ? 0.6 : 1,
              }}
            >
              {running ? 'Running...' : 'Run Query'}
            </button>
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: s.bg3, padding: '8px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>Execution Log</span>
            {result && (
              <span style={{ color: s.green, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>{result}</span>
            )}
          </div>
          <div style={{ padding: 12, maxHeight: 240, overflowY: 'auto', minHeight: 80 }}>
            {logs.length === 0 && !running ? (
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, fontStyle: 'italic' }}>
                Click "Run Query" to see execution...
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, lineHeight: 1.6 }}>
                {logs.map((entry, idx) => (
                  <div key={idx} style={{ color: entry.color }}>{entry.text}</div>
                ))}
                {running && (
                  <div style={{ color: s.yellow }}>{'>'}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
