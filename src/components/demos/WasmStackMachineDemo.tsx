import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Step {
  instr: string
  stackBefore: number[]
  stackAfter: number[]
  locals: number[]
  desc: string
}

interface Sequence {
  name: string
  initLocals: number[]
  steps: Step[]
}

const sequences: Sequence[] = [
  {
    name: 'Simple Add',
    initLocals: [0, 0],
    steps: [
      { instr: 'i32.const 1', stackBefore: [], stackAfter: [1], locals: [0, 0], desc: 'Push the constant 1 onto the value stack.' },
      { instr: 'i32.const 2', stackBefore: [1], stackAfter: [1, 2], locals: [0, 0], desc: 'Push the constant 2 onto the value stack.' },
      { instr: 'i32.add', stackBefore: [1, 2], stackAfter: [3], locals: [0, 0], desc: 'Pop two values (1 and 2), add them, push the result (3).' },
      { instr: 'end', stackBefore: [3], stackAfter: [3], locals: [0, 0], desc: 'Return the top of the stack (3) as the function result.' },
    ],
  },
  {
    name: 'Local Variables',
    initLocals: [5, 3],
    steps: [
      { instr: 'local.get $a', stackBefore: [], stackAfter: [5], locals: [5, 3], desc: 'Push the value of local $a (index 0) onto the stack. Locals are set before execution.' },
      { instr: 'local.get $b', stackBefore: [5], stackAfter: [5, 3], locals: [5, 3], desc: 'Push the value of local $b (index 1) onto the stack.' },
      { instr: 'i32.add', stackBefore: [5, 3], stackAfter: [8], locals: [5, 3], desc: 'Pop two values (5 and 3), add them, push the result (8).' },
      { instr: 'end', stackBefore: [8], stackAfter: [8], locals: [5, 3], desc: 'Return 8 as the function result.' },
    ],
  },
  {
    name: 'Control Flow (if/else)',
    initLocals: [0, 0],
    steps: [
      { instr: 'i32.const 10', stackBefore: [], stackAfter: [10], locals: [0, 0], desc: 'Push 10 for comparison.' },
      { instr: 'i32.const 5', stackBefore: [10], stackAfter: [10, 5], locals: [0, 0], desc: 'Push 5 for comparison.' },
      { instr: 'i32.gt_s', stackBefore: [10, 5], stackAfter: [1], locals: [0, 0], desc: 'Pop 5 then 10, compare signed. 10 > 5 is true, push 1.' },
      { instr: 'if (result i32)', stackBefore: [1], stackAfter: [], locals: [0, 0], desc: 'Pop the condition (1 = true). Enter the if branch.' },
      { instr: '  i32.const 42', stackBefore: [], stackAfter: [42], locals: [0, 0], desc: 'True branch: push 42 as the result.' },
      { instr: 'end', stackBefore: [42], stackAfter: [42], locals: [0, 0], desc: 'End of if/else. Return the selected value (42).' },
    ],
  },
  {
    name: 'Loop with Block',
    initLocals: [3, 0],
    steps: [
      { instr: 'block $exit', stackBefore: [], stackAfter: [1], locals: [3, 0], desc: 'Push block marker. This creates a control flow boundary.' },
      { instr: 'loop $loop', stackBefore: [1], stackAfter: [1, 2], locals: [3, 0], desc: 'Push loop marker. Execution can branch back here.' },
      { instr: 'local.get $i', stackBefore: [1, 2], stackAfter: [1, 2, 0], locals: [3, 0], desc: 'Push loop counter from local $i (index 1, value 0).' },
      { instr: 'local.get $n', stackBefore: [1, 2, 0], stackAfter: [1, 2, 0, 3], locals: [3, 0], desc: 'Push the limit from local $n (index 0, value 3).' },
      { instr: 'i32.lt_s', stackBefore: [1, 2, 0, 3], stackAfter: [1, 2, 1], locals: [3, 0], desc: 'Compare 0 < 3. True, push 1.' },
      { instr: 'br_if $exit', stackBefore: [1, 2, 1], stackAfter: [1, 2], locals: [3, 0], desc: 'Pop condition (1 = true). Branch to $exit to leave the loop.' },
    ],
  },
]

export default function WasmStackMachineDemo() {
  const [seqIdx, setSeqIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [animating, setAnimating] = useState<'push' | 'pop' | null>(null)

  const seq = sequences[seqIdx]
  const step = seq.steps[stepIdx]
  const isFirst = stepIdx === 0
  const isLast = stepIdx === seq.steps.length - 1

  useEffect(() => {
    if (!playing) return
    if (isLast) { setPlaying(false); return }
    const timer = setTimeout(() => {
      setStepIdx(i => Math.min(i + 1, seq.steps.length - 1))
    }, 1200)
    return () => clearTimeout(timer)
  }, [playing, stepIdx, isLast, seq.steps.length])

  const goNext = useCallback(() => {
    if (stepIdx < seq.steps.length - 1) {
      setAnimating('pop')
      setTimeout(() => {
        setStepIdx(i => i + 1)
        setAnimating('push')
        setTimeout(() => setAnimating(null), 300)
      }, 150)
    }
  }, [stepIdx, seq.steps.length])

  const goPrev = useCallback(() => {
    if (stepIdx > 0) {
      setAnimating('push')
      setTimeout(() => {
        setStepIdx(i => i - 1)
        setAnimating('pop')
        setTimeout(() => setAnimating(null), 300)
      }, 150)
    }
  }, [stepIdx])

  const selectSequence = (idx: number) => {
    setSeqIdx(idx)
    setStepIdx(0)
    setPlaying(false)
    setAnimating(null)
  }

  return (
    <DemoBoundary name="WASM Stack Machine">
    <div style={{
      background: s.bg, padding: '24px 20px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>
        WASM Stack Machine
      </div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.5 }}>
        WASM is a stack-based virtual machine. Instructions push values onto the stack and pop values off. The stack never grows past the current function scope.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {sequences.map((seq, i) => (
          <button key={i} onClick={() => selectSequence(i)} style={{
            background: seqIdx === i ? s.accent : s.bg3,
            border: `1px solid ${seqIdx === i ? s.accent : s.border}`,
            borderRadius: 6, padding: '6px 14px',
            color: seqIdx === i ? '#fff' : s.text2,
            fontSize: 12, cursor: 'pointer', fontWeight: seqIdx === i ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {seq.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: 16, border: `1px solid ${s.border}`, height: '100%' }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Current Instruction
            </div>
            <div style={{
              background: s.bg, borderRadius: 8, padding: '10px 14px',
              fontFamily: s.mono, fontSize: 15, color: s.accent,
              textAlign: 'center', border: `1px solid ${s.accent}40`,
              marginBottom: 12,
            }}>
              {step.instr}
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>
              {step.desc}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Locals
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {step.locals.map((val, i) => (
                  <div key={i} style={{
                    background: s.bg, border: `1px solid ${s.border}`,
                    borderRadius: 6, padding: '6px 12px', textAlign: 'center',
                  }}>
                    <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono }}>${i === 0 ? 'a' : i === 1 ? 'b' : `l${i}`}</div>
                    <div style={{ color: s.yellow, fontSize: 14, fontFamily: s.mono }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: 200 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: 16, border: `1px solid ${s.border}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
              Value Stack
            </div>
            <div style={{
              flex: 1, background: s.bg, borderRadius: 8, padding: 10,
              display: 'flex', flexDirection: 'column-reverse',
              gap: 4, minHeight: 180, overflowY: 'auto',
            }}>
              {step.stackAfter.length === 0 && (
                <div style={{ color: s.text3, fontSize: 11, textAlign: 'center', padding: 20 }}>
                  (empty)
                </div>
              )}
              {step.stackAfter.map((val, i) => (
                <div key={i} style={{
                  background: s.bg3, borderRadius: 6, padding: '6px 12px',
                  fontFamily: s.mono, fontSize: 14, color: s.green,
                  textAlign: 'center', border: `1px solid ${s.border}`,
                  animation: animating === 'push' && i === step.stackAfter.length - 1
                    ? 'stackFadeIn 0.3s ease'
                    : undefined,
                }}>
                  {val}
                </div>
              ))}
            </div>
            <style>{`
              @keyframes stackFadeIn {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>
                [{step.stackAfter.map((v, i, a) => (
                  <span key={i}>
                    <span style={{ color: animating === 'pop' && i >= step.stackBefore.length ? s.red : s.green }}>{v}</span>
                    {i < a.length - 1 ? ', ' : ''}
                  </span>
                ))}]
              </div>
              <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>
                depth: {step.stackAfter.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={goPrev} disabled={isFirst} style={{
          background: s.bg3, border: `1px solid ${s.border}`,
          borderRadius: 8, padding: '8px 16px',
          color: isFirst ? s.text3 : s.text2, cursor: isFirst ? 'default' : 'pointer',
          fontSize: 13, opacity: isFirst ? 0.5 : 1,
        }}>
          Prev
        </button>
        <button onClick={() => { setStepIdx(0); setPlaying(false); setAnimating(null) }} style={{
          background: s.bg3, border: `1px solid ${s.border}`,
          borderRadius: 8, padding: '8px 16px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>
          Reset
        </button>
        <button onClick={() => setPlaying(!playing)} style={{
          background: playing ? s.red : s.accent, border: 'none',
          borderRadius: 8, padding: '8px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
        }}>
          {playing ? 'Stop' : isLast ? 'Restart' : 'Auto Play'}
        </button>
        <button onClick={goNext} disabled={isLast} style={{
          background: s.accent, border: 'none',
          borderRadius: 8, padding: '8px 16px',
          color: '#fff', cursor: isLast ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 600, opacity: isLast ? 0.5 : 1,
        }}>
          Next
        </button>
      </div>

      <div style={{
        marginTop: 16, display: 'flex', gap: 4, justifyContent: 'center',
      }}>
        {seq.steps.map((st, i) => (
          <div key={i} onClick={() => { setStepIdx(i); setPlaying(false); setAnimating(null) }} style={{
            width: 24, height: 6, borderRadius: 3,
            background: i === stepIdx ? s.accent : i < stepIdx ? s.accent + '60' : s.bg3,
            cursor: 'pointer', transition: 'all 0.15s',
          }} />
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}
