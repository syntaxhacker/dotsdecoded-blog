import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const stages = [
  {
    id: 'parse',
    label: 'Parsing',
    color: s.accent,
    icon: '{ }',
    details: [
      { k: 'Table', v: 'users' },
      { k: 'Columns', v: 'name, email' },
      { k: 'Filter', v: 'age > 25' },
      { k: 'Sort', v: 'name ASC' },
    ],
  },
  {
    id: 'plan',
    label: 'Query Planning',
    color: s.yellow,
    icon: '>>',
    details: [
      { k: 'Strategy', v: 'Index Scan using idx_age on users' },
      { k: 'Filter', v: 'age > 25' },
      { k: 'Sort', v: 'name ASC' },
      { k: 'Cost estimate', v: '4.2' },
    ],
  },
  {
    id: 'execute',
    label: 'Execution',
    color: s.orange,
    icon: '=>',
    details: null,
  },
  {
    id: 'return',
    label: 'Return Results',
    color: s.green,
    icon: '<=',
    details: null,
  },
]

const sampleRows = [
  { name: 'Alice Chen', email: 'alice@example.com' },
  { name: 'Bob Martinez', email: 'bob@example.com' },
  { name: 'Charlie Kim', email: 'charlie@example.com' },
]

export default function QueryLifecycleDemo() {
  const [activeStage, setActiveStage] = useState(-1)
  const [running, setRunning] = useState(false)
  const [execLines, setExecLines] = useState<string[]>([])
  const [visibleRows, setVisibleRows] = useState<number>(0)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (activeStage !== 2) return
    const lines = ['Reading page 42...', 'Reading page 43...', 'Reading page 44...', 'Found 156 matching rows']
    const timers: ReturnType<typeof setTimeout>[] = []
    lines.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setExecLines((prev) => [...prev, line])
      }, getStepDelay(300 * (i + 1), speed)))
    })
    return () => timers.forEach(clearTimeout)
  }, [activeStage, speed])

  useEffect(() => {
    if (activeStage !== 3) return
    const timers: ReturnType<typeof setTimeout>[] = []
    sampleRows.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleRows((v) => v + 1)
      }, getStepDelay(250 * (i + 1), speed)))
    })
    return () => timers.forEach(clearTimeout)
  }, [activeStage, speed])

  const handleRun = () => {
    setRunning(true)
    setActiveStage(-1)
    setExecLines([])
    setVisibleRows(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    stages.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActiveStage(i)
        if (i === stages.length - 1) {
          setTimeout(() => setRunning(false), getStepDelay(1500, speed))
        }
      }, getStepDelay(1200 * (i + 1), speed)))
    })
  }

  const handleReset = () => {
    setRunning(false)
    setActiveStage(-1)
    setExecLines([])
    setVisibleRows(0)
  }

  const getStageState = (idx: number) => {
    if (idx === activeStage) return 'active'
    if (activeStage > idx) return 'done'
    return 'idle'
  }

  const renderDetails = (stage: typeof stages[number]) => {
    if (stage.id === 'execute') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {execLines.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: s.mono,
                fontSize: 13,
                color: i === execLines.length - 1 ? s.green : s.text2,
                opacity: 0,
                animation: 'fadeSlideIn 0.3s ease forwards',
                animationDelay: '0s',
              }}
            >
              {line.includes('Found') ? '> ' : '  '}{line}
            </div>
          ))}
          {execLines.length === 0 && activeStage === 2 && (
            <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text3 }}>Scanning storage engine...</div>
          )}
        </div>
      )
    }

    if (stage.id === 'return') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: s.mono, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: s.text3, borderBottom: `1px solid ${s.border}`, fontWeight: 600 }}>name</th>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: s.text3, borderBottom: `1px solid ${s.border}`, fontWeight: 600 }}>email</th>
              </tr>
            </thead>
            <tbody>
              {sampleRows.slice(0, visibleRows).map((row, i) => (
                <tr key={i} style={{ opacity: 0, animation: 'fadeSlideIn 0.3s ease forwards' }}>
                  <td style={{ padding: '6px 12px', color: s.text, borderBottom: `1px solid ${s.border}` }}>{row.name}</td>
                  <td style={{ padding: '6px 12px', color: s.text2, borderBottom: `1px solid ${s.border}` }}>{row.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows === 0 && activeStage === 3 && (
            <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text3, padding: '6px 0' }}>Preparing result set...</div>
          )}
          {visibleRows > 0 && (
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text3, padding: '6px 0' }}>
              ... and 153 more rows
            </div>
          )}
        </div>
      )
    }

    if (stage.details) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stage.details.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text3, minWidth: 100, flexShrink: 0 }}>{d.k}:</span>
              <span style={{ fontFamily: s.mono, fontSize: 13, color: s.text }}>{d.v}</span>
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  const activeStageData = activeStage >= 0 ? stages[activeStage] : null

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: '0 auto' }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color); }
          50% { box-shadow: 0 0 12px 2px var(--pulse-color); }
        }
      `}</style>

      <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}`, background: s.bg2 }}>
          <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text3, marginBottom: 8 }}>SQL Query</div>
          <code style={{ fontFamily: s.mono, fontSize: 14, color: s.accent, lineHeight: 1.6, display: 'block', whiteSpace: 'pre-wrap' }}>
            SELECT name, email FROM users WHERE age {'>'} 25 ORDER BY name
          </code>
        </div>

        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {stages.map((stage, idx) => {
              const state = getStageState(idx)
              const isActive = state === 'active'
              const isDone = state === 'done'
              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: 8,
                      border: `1px solid ${isActive ? stage.color : isDone ? `${stage.color}44` : s.border}`,
                      background: isActive ? `${stage.color}11` : isDone ? `${stage.color}08` : s.bg2,
                      textAlign: 'center',
                      transition: 'all 0.4s ease',
                      cursor: 'default',
                      ...(isActive ? { ['--pulse-color' as string]: `${stage.color}33`, animation: 'pulse 2s ease infinite' } : {}),
                    }}
                  >
                    <div style={{
                      fontFamily: s.mono,
                      fontSize: 16,
                      fontWeight: 700,
                      color: isActive ? stage.color : isDone ? stage.color : s.text3,
                      transition: 'color 0.3s',
                      marginBottom: 4,
                    }}>
                      {isDone && !isActive ? '\u2713' : stage.icon}
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isActive ? stage.color : isDone ? s.text2 : s.text3,
                      transition: 'color 0.3s',
                      lineHeight: 1.3,
                    }}>
                      {stage.label}
                    </div>
                  </div>
                  {idx < stages.length - 1 && (
                    <div style={{
                      width: 20,
                      height: 2,
                      background: isDone ? stage.color : s.border,
                      transition: 'background 0.4s ease',
                      margin: '0 -1px',
                      position: 'relative',
                      zIndex: 1,
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {activeStageData && (
          <div style={{ padding: '0 20px 8px' }}>
            <div style={{
              background: s.bg2,
              borderRadius: 8,
              border: `1px solid ${activeStageData.color}33`,
              padding: 16,
              opacity: 0,
              animation: 'fadeSlideIn 0.4s ease forwards',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: activeStageData.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                {activeStageData.label} Output
              </div>
              {renderDetails(activeStageData)}
            </div>
          </div>
        )}

        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 24px',
              borderRadius: 6,
              border: `1px solid ${running ? s.border : s.accent}`,
              background: running ? s.bg2 : s.accent,
              color: running ? s.text3 : '#fff',
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Run Query
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button
            onClick={handleReset}
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 24px',
              borderRadius: 6,
              border: `1px solid ${s.border}`,
              background: s.bg2,
              color: s.text2,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
