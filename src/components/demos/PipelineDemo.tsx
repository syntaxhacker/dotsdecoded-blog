import { useState, useEffect } from 'react'
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

const stages = ['IF', 'ID', 'EX', 'MEM', 'WB']

const instructions = [
  { name: 'ADD', color: s.accent },
  { name: 'SUB', color: s.green },
  { name: 'LOAD', color: s.yellow },
  { name: 'STORE', color: s.red },
  { name: 'XOR', color: s.purple },
  { name: 'CMP', color: s.orange },
]

const MAX_CYCLE = 11

export default function PipelineDemo() {
  const [cycle, setCycle] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!playing || cycle >= MAX_CYCLE) return
    const delay = getStepDelay(900, speed)
    const timer = setTimeout(() => setCycle(prev => prev + 1), delay)
    return () => clearTimeout(timer)
  }, [playing, speed, cycle])

  const step = () => {
    if (cycle >= MAX_CYCLE) return
    setPlaying(false)
    setCycle(prev => prev + 1)
  }

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
    } else {
      if (cycle >= MAX_CYCLE) setCycle(0)
      setPlaying(true)
    }
  }

  const reset = () => {
    setPlaying(false)
    setCycle(0)
  }

  const rows: { instr: typeof instructions[number] | null }[][] = []
  for (let c = 0; c <= cycle && c <= MAX_CYCLE; c++) {
    const row: { instr: typeof instructions[number] | null }[] = []
    for (let st = 0; st < stages.length; st++) {
      const idx = c - st
      const instr = (idx >= 0 && idx < instructions.length) ? instructions[idx] : null
      row.push({ instr })
    }
    rows.push(row)
  }

  const occupied = rows.length > 0 ? rows[rows.length - 1].filter(cell => cell.instr !== null).length : 0

  return (
    <DemoBoundary name="CPU Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>CPU Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>
            Cycle <span style={{ color: s.text, fontWeight: 600 }}>{cycle}</span>
          </div>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
            Stages: <span style={{ color: occupied === stages.length ? s.green : s.text2, fontWeight: 600 }}>{occupied}</span>/{stages.length}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `40px repeat(${stages.length}, 1fr)`,
        gap: 2,
        marginBottom: 24,
        overflowX: 'auto',
      }}>
        <div style={{
          background: s.bg3,
          borderRadius: '6px 0 0 0',
          padding: '10px 6px',
          textAlign: 'center',
          color: s.text3,
          fontSize: 10,
          fontFamily: s.mono,
        }}>
          CYC
        </div>
        {stages.map((stageName, colIdx) => (
          <div key={stageName} style={{
            background: s.bg3,
            borderRadius: colIdx === stages.length - 1 ? '0 6px 0 0' : 0,
            padding: '10px 6px',
            textAlign: 'center',
            color: s.text2,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: s.mono,
          }}>
            {stageName}
          </div>
        ))}
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'contents' }}>
            <div style={{
              background: rowIdx % 2 === 0 ? s.bg2 : s.bg,
              padding: '10px 4px',
              textAlign: 'center',
              color: s.text3,
              fontFamily: s.mono,
              fontSize: 10,
              borderBottom: rowIdx < rows.length - 1 ? `1px solid ${s.border}` : 'none',
            }}>
              {rowIdx}
            </div>
            {row.map((cell, cellIdx) => (
              <div key={cellIdx} style={{
                background: cell.instr
                  ? `${cell.instr.color}18`
                  : (rowIdx % 2 === 0 ? s.bg2 : s.bg),
                padding: '10px 4px',
                textAlign: 'center',
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: cell.instr ? 600 : 400,
                color: cell.instr ? cell.instr.color : s.text3,
                borderBottom: rowIdx < rows.length - 1 ? `1px solid ${s.border}` : 'none',
                borderRight: cellIdx < stages.length - 1 ? `1px solid ${s.border}` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {cell.instr ? cell.instr.name : ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={step}
          disabled={cycle >= MAX_CYCLE}
          style={{
            background: s.accent,
            border: 'none',
            borderRadius: 8,
            padding: '10px 22px',
            color: '#fff',
            cursor: cycle >= MAX_CYCLE ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: playing ? 0.4 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          Step
        </button>
        <button
          onClick={togglePlay}
          style={{
            background: playing ? s.red : s.green,
            border: 'none',
            borderRadius: 8,
            padding: '10px 22px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          {playing ? 'Stop' : 'Auto-Play'}
        </button>
        <button
          onClick={reset}
          style={{
            background: s.bg3,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '10px 20px',
            color: s.text2,
            cursor: 'pointer',
            fontSize: 13,
            transition: 'all 0.15s',
          }}
        >
          Reset
        </button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Pipeline State</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Filling', desc: 'Cycles 0-3: pipeline fills one stage per cycle', color: s.yellow },
            { label: 'Full', desc: 'Cycles 4-8: all 5 stages occupied, 1 IPC throughput', color: s.green },
            { label: 'Draining', desc: 'Cycles 9-10: instructions complete, pipeline empties', color: s.accent },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 55 }}>{item.label}</span>
              <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
