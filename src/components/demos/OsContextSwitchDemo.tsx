import { useState, useEffect, useCallback } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface PCBDisplay {
  pid: number
  name: string
  state: string
  registers: Record<string, string>
  pc: string
}

const procA: PCBDisplay = {
  pid: 101, name: 'httpd', state: 'RUNNING',
  registers: { RAX: '0x3f', RBX: '0x100', RCX: '0x1a', RDX: '0x0', RSP: '0x7fff_a100', RBP: '0x7fff_a0f0' },
  pc: '0x0040_1a3c',
}

const procB: PCBDisplay = {
  pid: 202, name: 'mysqld', state: 'READY',
  registers: { RAX: '0x0', RBX: '0x200', RCX: '0x4b', RDX: '0x1', RSP: '0x7fff_b200', RBP: '0x7fff_b1f0' },
  pc: '0x0040_2b4f',
}

type Step = 'a_running' | 'timer' | 'save_a' | 'scheduler' | 'restore_b' | 'b_running'

const stepLabels: Record<Step, string> = {
  a_running: 'Process A is running on CPU',
  timer: 'Timer interrupt fires (OS preempts A)',
  save_a: 'Save registers to PCB A',
  scheduler: 'Scheduler picks next process (B)',
  restore_b: 'Restore registers from PCB B',
  b_running: 'Process B is now running',
}

const steps: Step[] = ['a_running', 'timer', 'save_a', 'scheduler', 'restore_b', 'b_running']

export default function OsContextSwitchDemo() {
  const [step, setStep] = useState<Step>('a_running')
  const [speed, setSpeed] = useState(1)
  const [autoPlay, setAutoPlay] = useState(false)

  const currentIdx = steps.indexOf(step)

  const goToStep = useCallback((idx: number) => {
    if (idx >= 0 && idx < steps.length) setStep(steps[idx])
  }, [])

  useEffect(() => {
    if (!autoPlay) return
    if (step === 'b_running') {
      setAutoPlay(false)
      return
    }
    const timer = setTimeout(() => {
      goToStep(currentIdx + 1)
    }, getStepDelay(1200, speed))
    return () => clearTimeout(timer)
  }, [autoPlay, step, currentIdx, speed, goToStep])

  return (
    <DemoBoundary name="Context Switch">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={H}>Context Switch</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A context switch saves the state of the running process and restores the next. This happens
          100-10,000 times per second. Each switch costs ~1-100 microseconds of pure overhead.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {steps.map((st, i) => {
            const isActive = i === currentIdx
            const isPast = i < currentIdx
            return (
              <button key={st} onClick={() => { goToStep(i); setAutoPlay(false) }} style={{
                background: isActive ? s.accent : isPast ? s.green : s.bg3,
                border: `1px solid ${isActive ? s.accent : isPast ? s.green : s.border}`,
                borderRadius: 8, padding: '6px 10px',
                color: isActive || isPast ? '#000' : s.text3,
                cursor: 'pointer', fontSize: 10, fontWeight: 600,
                transition: 'all 0.2s', flex: 1, minWidth: 70,
              }}>
                <div>{i + 1}</div>
                <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.8 }}>
                  {st === 'a_running' ? 'A runs' : st === 'timer' ? 'Timer' : st === 'save_a' ? 'Save A' : st === 'scheduler' ? 'Pick B' : st === 'restore_b' ? 'Rest B' : 'B runs'}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{
          background: s.bg, borderRadius: 10, border: `2px solid ${s.accent}`,
          padding: '12px 16px', marginBottom: 20, textAlign: 'center',
          transition: 'all 0.3s',
        }}>
          <div style={{ color: s.accent, fontSize: 13, fontFamily: s.mono, fontWeight: 700, marginBottom: 4 }}>
            Step {currentIdx + 1}: {stepLabels[step]}
          </div>
          <div style={{ color: s.text3, fontSize: 11 }}>
            {step === 'a_running' && 'httpd (PID 101) is executing instructions on the CPU. Registers hold current computation state.'}
            {step === 'timer' && 'Hardware timer fires an interrupt. CPU saves current instruction pointer and switches to kernel mode. The interrupt handler runs.'}
            {step === 'save_a' && 'Kernel saves all general-purpose registers, PC, and stack pointer into httpd\'s PCB. This is ~20-50 MOV instructions.'}
            {step === 'scheduler' && 'Kernel scheduler runs: iterates the ready queue, picks mysqld (PID 202) based on its policy (e.g., CFS vruntime).'}
            {step === 'restore_b' && 'Kernel loads mysqld\'s saved registers from its PCB. The stack pointer is switched to mysqld\'s kernel stack.'}
            {step === 'b_running' && 'CPU jumps to mysqld\'s saved PC. Execution resumes in user space. httpd\'s state is preserved in its PCB until it runs again.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 200,
            border: `1px solid ${currentIdx >= 0 && currentIdx <= 2 ? s.accent : s.border}`,
            borderRadius: 10, padding: 14, background: s.bg,
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: s.accent, fontWeight: 700, fontSize: 13, fontFamily: s.mono }}>PID {procA.pid}: {procA.name}</span>
              <span style={{
                background: step === 'a_running' ? s.green : currentIdx <= 2 ? s.yellow : s.text3,
                borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, fontFamily: s.mono,
                color: '#000',
              }}>
                {step === 'a_running' ? 'ACTIVE' : currentIdx <= 2 ? 'SAVING' : 'SUSPENDED'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 11, fontFamily: s.mono }}>
              <span style={{ color: s.text3 }}>PC:</span><span style={{ color: s.text }}>{procA.pc}</span>
              {Object.entries(procA.registers).map(([reg, val]) => (
                <span key={reg}>
                  <span style={{ color: s.text3 }}>{reg}: </span>
                  <span style={{
                    color: step === 'save_a' ? s.yellow : s.text,
                    transition: 'color 0.3s',
                  }}>{val}</span>
                </span>
              ))}
            </div>
          </div>

          <div style={{
            flex: 1, minWidth: 200,
            border: `1px solid ${currentIdx >= 3 ? s.green : s.border}`,
            borderRadius: 10, padding: 14, background: s.bg,
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: s.green, fontWeight: 700, fontSize: 13, fontFamily: s.mono }}>PID {procB.pid}: {procB.name}</span>
              <span style={{
                background: step === 'b_running' ? s.green : currentIdx >= 3 ? s.accent : s.text3,
                borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, fontFamily: s.mono,
                color: '#000',
              }}>
                {step === 'b_running' ? 'ACTIVE' : currentIdx >= 3 ? 'LOADING' : 'READY'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 11, fontFamily: s.mono }}>
              <span style={{ color: s.text3 }}>PC:</span><span style={{ color: s.text }}>{procB.pc}</span>
              {Object.entries(procB.registers).map(([reg, val]) => (
                <span key={reg}>
                  <span style={{ color: s.text3 }}>{reg}: </span>
                  <span style={{
                    color: step === 'restore_b' ? s.yellow : s.text,
                    transition: 'color 0.3s',
                  }}>{val}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          background: s.bg3, borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <span style={{ color: s.text3, fontSize: 11 }}>Cost of this switch: </span>
            <span style={{ color: s.yellow, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>~3.2 microseconds</span>
          </div>
          <div>
            <span style={{ color: s.text3, fontSize: 11 }}>Switches per second: </span>
            <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>~312,500</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setStep('a_running'); setAutoPlay(false) }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 20px', color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay && step === 'b_running') goToStep(0) }} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>
            {autoPlay ? 'Pause' : step === 'b_running' ? 'Replay' : 'Auto Play'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
