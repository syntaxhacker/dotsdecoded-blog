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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const stateColors: Record<string, string> = {
  running: s.green,
  ready: s.accent,
  blocked: s.yellow,
  terminated: s.red,
}

interface PCB {
  pid: number
  name: string
  state: 'running' | 'ready' | 'blocked' | 'terminated'
  pc: string
  registers: Record<string, string>
  memoryMap: { text: string; data: string; heap: string; stack: string }
}

function makePCB(pid: number, name: string, state: PCB['state']): PCB {
  return {
    pid,
    name,
    state,
    pc: '0x0040' + (pid * 10 + 20).toString(16),
    registers: { RAX: '0x0', RBX: '0x0', RCX: `0x${(pid * 100).toString(16)}`, RDX: '0x0', RSP: `0x7fff${pid}00`, RBP: `0x7fff${pid}10` },
    memoryMap: { text: '0x00400000', data: '0x00600000', heap: `0x00a${pid}0000`, stack: `0x7fff${pid}000` },
  }
}

const processStates = ['running', 'ready', 'blocked'] as const

export default function OsProcessDemo() {
  const [parent, setParent] = useState<PCB>(makePCB(1, 'init', 'running'))
  const [children, setChildren] = useState<PCB[]>([])
  const [selectedPCB, setSelectedPCB] = useState<number>(1)
  const [stateMsg, setStateMsg] = useState('')

  const current = parent.pid === selectedPCB ? parent : children.find(c => c.pid === selectedPCB) || parent

  const fork = () => {
    const childPid = children.length + 2
    const child: PCB = {
      ...makePCB(childPid, `child_${childPid - 1}`, 'ready'),
      pc: parent.pc,
      registers: { ...parent.registers, RAX: '0x0' },
      memoryMap: { ...parent.memoryMap },
    }
    setChildren(prev => [...prev, child])
    setSelectedPCB(childPid)
    setStateMsg(`fork() returned ${childPid} in parent, 0 in child. COW shares memory pages.`)
  }

  const changeState = (st: PCB['state']) => {
    if (current.pid === 1) {
      setParent(prev => ({ ...prev, state: st }))
    } else {
      setChildren(prev => prev.map(c => c.pid === current.pid ? { ...c, state: st } : c))
    }
    setStateMsg(`Process ${current.pid} (${current.name}) transitioned to ${st}`)
  }

  const terminate = () => {
    changeState('terminated')
    setStateMsg(`Process ${current.pid} exited. PCB is freed.`)
  }

  return (
    <DemoBoundary name="Process vs Thread">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Process Control Block</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Every process has a PCB: a kernel data structure holding PID, state, registers, and memory map.
          Click Fork to create a child process. Click state buttons to transition.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[parent, ...children].map(p => (
              <button key={p.pid} onClick={() => { setSelectedPCB(p.pid); setStateMsg('') }} style={{
                background: selectedPCB === p.pid ? stateColors[p.state] : s.bg3,
                border: `2px solid ${selectedPCB === p.pid ? stateColors[p.state] : s.border}`,
                borderRadius: 8, padding: '6px 14px',
                color: selectedPCB === p.pid ? '#000' : s.text2,
                cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
                transition: 'all 0.2s', fontWeight: 600,
              }}>
                {p.name} (PID {p.pid})
              </button>
            ))}
          </div>
          <button onClick={fork} style={{
            background: s.purple, border: 'none', borderRadius: 8, padding: '8px 18px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>fork()</button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>PCB #{current.pid}</span>
                <span style={{
                  background: stateColors[current.state], borderRadius: 4,
                  padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: s.mono,
                  color: current.state === 'running' || current.state === 'terminated' ? '#000' : '#fff',
                }}>{current.state}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, fontFamily: s.mono }}>
                <span style={{ color: s.text3 }}>PID:</span><span style={{ color: s.text }}>{current.pid}</span>
                <span style={{ color: s.text3 }}>PC:</span><span style={{ color: s.text }}>{current.pc}</span>
                <span style={{ color: s.text3 }}>RAX:</span><span style={{ color: s.text }}>{current.registers.RAX}</span>
                <span style={{ color: s.text3 }}>RBX:</span><span style={{ color: s.text }}>{current.registers.RBX}</span>
                <span style={{ color: s.text3 }}>RCX:</span><span style={{ color: s.text }}>{current.registers.RCX}</span>
                <span style={{ color: s.text3 }}>RDX:</span><span style={{ color: s.text }}>{current.registers.RDX}</span>
                <span style={{ color: s.text3 }}>RSP:</span><span style={{ color: s.text }}>{current.registers.RSP}</span>
                <span style={{ color: s.text3 }}>RBP:</span><span style={{ color: s.text }}>{current.registers.RBP}</span>
              </div>
            </div>
            <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 12, marginTop: 8 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Memory Map</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', fontSize: 11, fontFamily: s.mono }}>
                <span style={{ color: s.text3 }}>Text:</span><span style={{ color: s.green }}>{current.memoryMap.text}</span>
                <span style={{ color: s.text3 }}>Data:</span><span style={{ color: s.accent }}>{current.memoryMap.data}</span>
                <span style={{ color: s.text3 }}>Heap:</span><span style={{ color: s.yellow }}>{current.memoryMap.heap}</span>
                <span style={{ color: s.text3 }}>Stack:</span><span style={{ color: s.orange }}>{current.memoryMap.stack}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>State Transitions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {processStates.map(st => (
                <button key={st} onClick={() => changeState(st)} disabled={current.state === st || current.state === 'terminated'} style={{
                  background: current.state === st ? stateColors[st] : s.bg3,
                  border: `1px solid ${stateColors[st]}`,
                  borderRadius: 8, padding: '10px 16px',
                  color: current.state === st ? (st === 'terminated' || st === 'running' ? '#000' : '#fff') : stateColors[st],
                  cursor: current.state === 'terminated' ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: s.mono,
                  opacity: current.state === 'terminated' ? 0.5 : 1,
                  textAlign: 'left', transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: 13 }}>{st.toUpperCase()}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>
                    {st === 'running' ? 'CPU is executing this process' : st === 'ready' ? 'Waiting for CPU' : 'Waiting for I/O or resource'}
                  </div>
                </button>
              ))}
              <button onClick={terminate} disabled={current.state === 'terminated'} style={{
                background: current.state === 'terminated' ? s.red : s.bg3,
                border: `1px solid ${s.red}`,
                borderRadius: 8, padding: '10px 16px',
                color: current.state === 'terminated' ? '#000' : s.red,
                cursor: current.state === 'terminated' ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: s.mono,
                opacity: current.state === 'terminated' ? 0.5 : 1,
                textAlign: 'left', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 13 }}>TERMINATED</div>
                <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>Process exited, PCB freed</div>
              </button>
            </div>
          </div>
        </div>

        {stateMsg && (
          <div style={{
            background: s.bg, border: `1px solid ${s.accent}`, borderRadius: 8,
            padding: '10px 14px', color: s.text2, fontSize: 12, fontFamily: s.mono,
            lineHeight: 1.5,
          }}>
            {stateMsg}
          </div>
        )}

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Running</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Ready</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.yellow }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Blocked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Terminated</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: s.purple, fontFamily: s.mono, fontSize: 11 }}>fork()</span>
              <span style={{ color: s.text3, fontSize: 11 }}>creates child with COW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
