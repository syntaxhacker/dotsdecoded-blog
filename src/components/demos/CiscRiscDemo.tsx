import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface CodeLine {
  text: string
  isLabel?: boolean
}

interface ArchData {
  code: CodeLine[]
  count: number
  cycles: number
}

interface TaskData {
  name: string
  desc: string
  cisc: ArchData
  risc: ArchData
  insight: string
}

const tasks: TaskData[] = [
  {
    name: 'Add Two Numbers',
    desc: 'Compute C = A + B',
    cisc: {
      code: [{ text: 'ADD C, A, B' }],
      count: 1, cycles: 3,
    },
    risc: {
      code: [
        { text: 'LOAD R1, A' },
        { text: 'LOAD R2, B' },
        { text: 'ADD R3, R1, R2' },
        { text: 'STORE C, R3' },
      ],
      count: 4, cycles: 4,
    },
    insight: "CISC packs the entire operation into one instruction, saving memory and decode bandwidth. RISC decomposes it into primitive steps, each completing in one cycle for simpler pipelining.",
  },
  {
    name: 'Copy 100 Bytes',
    desc: 'Memcpy 100 bytes from SRC to DST',
    cisc: {
      code: [{ text: 'REP MOVSB' }],
      count: 1, cycles: 120,
    },
    risc: {
      code: [
        { text: 'MOV R0, #100' },
        { text: 'LOOP:', isLabel: true },
        { text: 'LDRB R1, [SRC]' },
        { text: 'STRB R1, [DST]' },
        { text: 'ADD SRC, #1' },
        { text: 'ADD DST, #1' },
        { text: 'SUBS R0, #1' },
        { text: 'BGT LOOP' },
      ],
      count: 7, cycles: 600,
    },
    insight: "CISC uses microcode to loop in hardware — one instruction but many internal cycles. RISC keeps the CPU simple and lets the compiler manage repetition explicitly.",
  },
  {
    name: 'Conditional Branch',
    desc: 'If A > B, jump to label',
    cisc: {
      code: [
        { text: 'CMP A, B' },
        { text: 'JG label' },
      ],
      count: 2, cycles: 2,
    },
    risc: {
      code: [
        { text: 'LOAD R1, A' },
        { text: 'LOAD R2, B' },
        { text: 'CMP R1, R2' },
        { text: 'BGT label' },
      ],
      count: 4, cycles: 4,
    },
    insight: "CISC can compare memory operands directly, saving instructions. RISC requires explicit loads before comparison, adding steps but keeping each stage simple.",
  },
  {
    name: 'Multiply by 10',
    desc: 'Compute A = B * 10',
    cisc: {
      code: [{ text: 'IMUL A, B, 10' }],
      count: 1, cycles: 4,
    },
    risc: {
      code: [
        { text: 'LSL R1, B, #1' },
        { text: 'LSL R2, B, #3' },
        { text: 'ADD A, R1, R2' },
      ],
      count: 3, cycles: 3,
    },
    insight: "CISC has a dedicated multiplier. RISC synthesizes multiplication from shifts (x2 + x8 = x10) — more instructions but no special hardware needed.",
  },
]

function CodeBlock({ lines, arch }: { lines: CodeLine[]; arch: 'cisc' | 'risc' }) {
  const opcodeColor = arch === 'cisc' ? s.accent : s.green
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
      padding: '12px 14px', fontFamily: s.mono, fontSize: 13, lineHeight: 1.7,
      minHeight: 80,
    }}>
      {lines.map((line, i) => {
        if (line.isLabel) {
          return (
            <div key={i} style={{ color: s.text3, fontStyle: 'italic' }}>
              {line.text}
            </div>
          )
        }
        const spaceIdx = line.text.indexOf(' ')
        const opcode = spaceIdx === -1 ? line.text : line.text.slice(0, spaceIdx)
        const operands = spaceIdx === -1 ? '' : line.text.slice(spaceIdx + 1)
        return (
          <div key={i} style={{ whiteSpace: 'pre' }}>
            <span style={{ color: opcodeColor }}>{opcode}</span>
            {operands ? <span style={{ color: s.text }}> {operands}</span> : null}
          </div>
        )
      })}
    </div>
  )
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{ minWidth: 80, color: s.text3, fontSize: 11, textAlign: 'right' }}>{label}</div>
      <div style={{
        flex: 1, height: 20, background: s.bg3, borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: 4, transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ minWidth: 30, color: s.text, fontFamily: s.mono, fontSize: 12 }}>{value}</div>
    </div>
  )
}

export default function CiscRiscDemo() {
  const [taskIdx, setTaskIdx] = useState(0)
  const task = tasks[taskIdx]
  const maxCount = Math.max(task.cisc.count, task.risc.count)
  const maxCycles = Math.max(task.cisc.cycles, task.risc.cycles)

  return (
    <DemoBoundary name="CISC vs RISC">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>
        CISC vs RISC
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 6px 0', lineHeight: 1.6 }}>
        Compare how Complex Instruction Set Computer (x86) and Reduced Instruction Set Computer (ARM) implement each task.
      </p>
      <p style={{ color: s.text3, fontSize: 13, margin: '0 0 20px 0', fontStyle: 'italic' }}>
        Current task: {task.desc}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {tasks.map((t, i) => (
          <button
            key={t.name}
            onClick={() => setTaskIdx(i)}
            style={{
              padding: '7px 16px', borderRadius: 8, border: `1px solid ${i === taskIdx ? s.accent : s.border}`,
              background: i === taskIdx ? `${s.accent}20` : s.bg3,
              color: i === taskIdx ? s.accent : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: i === taskIdx ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: s.accent, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: s.accent, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>CISC</span>
            x86
          </div>
          <CodeBlock lines={task.cisc.code} arch="cisc" />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
              <div style={{ color: s.text3, fontSize: 10 }}>Instr Count</div>
              <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{task.cisc.count}</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
              <div style={{ color: s.text3, fontSize: 10 }}>Est. Cycles</div>
              <div style={{ color: s.orange, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{task.cisc.cycles}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: s.green, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: s.green, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>RISC</span>
            ARM
          </div>
          <CodeBlock lines={task.risc.code} arch="risc" />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
              <div style={{ color: s.text3, fontSize: 10 }}>Instr Count</div>
              <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{task.risc.count}</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
              <div style={{ color: s.text3, fontSize: 10 }}>Est. Cycles</div>
              <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{task.risc.cycles}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 12 }}>Comparison</div>
        <Bar value={task.cisc.count} max={maxCount} color={s.accent} label="CISC Instr" />
        <Bar value={task.risc.count} max={maxCount} color={s.green} label="RISC Instr" />
        <div style={{ height: 1, background: s.border, margin: '8px 0' }} />
        <Bar value={task.cisc.cycles} max={maxCycles} color={s.orange} label="CISC Cycles" />
        <Bar value={task.risc.cycles} max={maxCycles} color={s.yellow} label="RISC Cycles" />
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${s.bg2}, ${s.bg3})`,
        borderRadius: 12, padding: '16px 20px', border: `1px solid ${s.border}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.purple, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Key Insight
        </div>
        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
          {task.insight}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
