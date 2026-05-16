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

interface RingSegment {
  name: string
  level: number
  color: string
  desc: string
}

const rings: RingSegment[] = [
  { name: 'User Mode (Ring 3)', level: 3, color: s.accent, desc: 'Applications run here. No access to hardware directly. Limited instructions.' },
  { name: 'Kernel Mode (Ring 0)', level: 0, color: s.red, desc: 'OS kernel runs here. Full hardware access. All instructions allowed.' },
]

interface StepConfig {
  id: number
  label: string
  stage: string
  mode: 'user' | 'kernel'
  detail: string
}

const steps: StepConfig[] = [
  { id: 1, label: 'Program calls read()', stage: 'User calls read(fd, buf, count)', mode: 'user', detail: 'Your C program calls read() on a file descriptor. This is a standard POSIX function.' },
  { id: 2, label: 'libc wrapper', stage: 'libc wrapper function', mode: 'user', detail: 'The C standard library (glibc) exposes read(). It places syscall number (0 on x86-64) and args in registers: RAX=0, RDI=fd, RSI=buf, RDX=count.' },
  { id: 3, label: 'Software interrupt (trap)', stage: 'syscall instruction', mode: 'user', detail: 'The wrapper executes the syscall instruction (or int 0x80 on 32-bit). This triggers a trap: CPU switches to Ring 0, loads kernel stack, and jumps to the syscall handler at MSR_LSTAR.' },
  { id: 4, label: 'System call dispatch', stage: 'Syscall handler in kernel', mode: 'kernel', detail: 'Kernel entry code saves user registers. Calls do_syscall_x64() which indexes into the sys_call_table array using RAX to find the right handler.' },
  { id: 5, label: 'Kernel executes read', stage: 'vfs_read() -> file->f_op->read()', mode: 'kernel', detail: 'The VFS layer resolves the file descriptor. Calls the filesystem-specific read implementation (e.g., ext4_file_read_iter). May block for disk I/O.' },
  { id: 6, label: 'Return to user mode', stage: 'sysretq instruction', mode: 'kernel', detail: 'Kernel copies return value (bytes read or error code) to RAX. Runs sysretq which restores user registers and switches back to Ring 3.' },
  { id: 7, label: 'Program continues', stage: 'User code resumes', mode: 'user', detail: 'Your program gets the result from read(). It has no idea the kernel did all that work. This is the fundamental abstraction of the OS.' },
]

export default function OsSyscallDemo() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <DemoBoundary name="System Call Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>System Call Flow</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          When a user program needs kernel services (reading a file, allocating memory, sending network data),
          it makes a system call. This transitions from user mode to kernel mode and back.
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Protection Rings</div>
            {rings.map(r => (
              <div key={r.level} style={{
                background: activeStep !== null && steps.find(s => s.id === activeStep)?.mode === (r.level === 3 ? 'user' : 'kernel') ? `${r.color}20` : s.bg,
                border: `2px solid ${r.color}`,
                borderRadius: 10, padding: 14, marginBottom: 8,
                transition: 'all 0.3s',
              }}>
                <div style={{ color: r.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{r.name}</div>
                <div style={{ color: s.text3, fontSize: 11 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: 2, minWidth: 280 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Step Through a Syscall</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {steps.map(st => (
                <button key={st.id} onClick={() => setActiveStep(st.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: activeStep === st.id ? (st.mode === 'kernel' ? `${s.red}15` : `${s.accent}15`) : s.bg,
                  border: `1px solid ${activeStep === st.id ? (st.mode === 'kernel' ? s.red : s.accent) : s.border}`,
                  borderRadius: 8, padding: '8px 14px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: activeStep === st.id ? (st.mode === 'kernel' ? s.red : s.accent) : s.bg3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, fontFamily: s.mono, flexShrink: 0,
                    color: activeStep === st.id ? '#000' : s.text3,
                  }}>{st.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: activeStep === st.id ? s.text : s.text2,
                      fontSize: 13, fontWeight: 600,
                    }}>{st.label}</div>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>{st.stage}</div>
                  </div>
                  <div style={{
                    background: st.mode === 'kernel' ? s.red : s.accent,
                    borderRadius: 4, padding: '2px 6px',
                    fontSize: 9, fontWeight: 700, fontFamily: s.mono,
                    color: '#000', flexShrink: 0,
                  }}>
                    {st.mode === 'kernel' ? 'KERNEL' : 'USER'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeStep !== null && (
          <div style={{
            background: s.bg, borderRadius: 10,
            border: `1px solid ${steps[activeStep - 1].mode === 'kernel' ? s.red : s.accent}`,
            padding: '14px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: steps[activeStep - 1].mode === 'kernel' ? s.red : s.accent,
                borderRadius: 4, padding: '2px 8px',
                fontSize: 11, fontWeight: 700, fontFamily: s.mono, color: '#000',
              }}>
                {steps[activeStep - 1].mode === 'kernel' ? 'KERNEL' : 'USER'}
              </span>
              <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
                Step {activeStep} of {steps.length}
              </span>
            </div>
            <div style={{ color: s.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {steps[activeStep - 1].label}
            </div>
            <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
              {steps[activeStep - 1].detail}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />
              <span style={{ color: s.text3, fontSize: 11 }}>User Mode</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Kernel Mode</span>
            </div>
            <span style={{ color: s.text3, fontSize: 11 }}>Click each step to see details</span>
            <span style={{ color: s.text3, fontSize: 11 }}>~100-200ns per syscall (no I/O)</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
