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

interface Instr {
  offset: number
  name: string
  arg: string
  desc: string
  stackEffect: number
  pushVal?: string
}

interface FuncExample {
  name: string
  source: string
  bytecodes: Instr[]
}

const examples: FuncExample[] = [
  {
    name: 'add(a, b)',
    source: 'def add(a, b):\n    return a + b',
    bytecodes: [
      { offset: 0, name: 'LOAD_FAST', arg: 'a (0)', desc: 'Push local variable a onto stack', stackEffect: 1, pushVal: 'a' },
      { offset: 2, name: 'LOAD_FAST', arg: 'b (1)', desc: 'Push local variable b onto stack', stackEffect: 1, pushVal: 'b' },
      { offset: 4, name: 'BINARY_ADD', arg: '', desc: 'Pop b, pop a, push a + b', stackEffect: -1, pushVal: 'a + b' },
      { offset: 6, name: 'RETURN_VALUE', arg: '', desc: 'Pop result and return it', stackEffect: -1 },
    ],
  },
  {
    name: 'square(n)',
    source: 'def square(n):\n    return n * n',
    bytecodes: [
      { offset: 0, name: 'LOAD_FAST', arg: 'n (0)', desc: 'Push local variable n', stackEffect: 1, pushVal: 'n' },
      { offset: 2, name: 'LOAD_FAST', arg: 'n (0)', desc: 'Push local variable n again', stackEffect: 1, pushVal: 'n' },
      { offset: 4, name: 'BINARY_MULTIPLY', arg: '', desc: 'Pop n, pop n, push n * n', stackEffect: -1, pushVal: 'n * n' },
      { offset: 6, name: 'RETURN_VALUE', arg: '', desc: 'Pop result and return it', stackEffect: -1 },
    ],
  },
  {
    name: 'factorial(n)',
    source: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
    bytecodes: [
      { offset: 0, name: 'LOAD_FAST', arg: 'n (0)', desc: 'Push n', stackEffect: 1, pushVal: 'n' },
      { offset: 2, name: 'LOAD_CONST', arg: '1', desc: 'Push constant 1', stackEffect: 1, pushVal: '1' },
      { offset: 4, name: 'COMPARE_OP', arg: '<=', desc: 'Compare n <= 1', stackEffect: -1, pushVal: 'True/False' },
      { offset: 6, name: 'POP_JUMP_IF_FALSE', arg: 'to 12', desc: 'Pop cond; if False jump to 12', stackEffect: -1 },
      { offset: 8, name: 'LOAD_CONST', arg: '1', desc: 'Push constant 1 (return value)', stackEffect: 1, pushVal: '1' },
      { offset: 10, name: 'RETURN_VALUE', arg: '', desc: 'Return 1', stackEffect: -1 },
      { offset: 12, name: 'LOAD_FAST', arg: 'n (0)', desc: 'Push n', stackEffect: 1, pushVal: 'n' },
      { offset: 14, name: 'LOAD_GLOBAL', arg: 'factorial', desc: 'Push global factorial', stackEffect: 1, pushVal: 'factorial' },
      { offset: 16, name: 'LOAD_FAST', arg: 'n (0)', desc: 'Push n', stackEffect: 1, pushVal: 'n' },
      { offset: 18, name: 'LOAD_CONST', arg: '1', desc: 'Push 1', stackEffect: 1, pushVal: '1' },
      { offset: 20, name: 'BINARY_SUBTRACT', arg: '', desc: 'n - 1', stackEffect: -1, pushVal: 'n - 1' },
      { offset: 22, name: 'CALL_FUNCTION', arg: '1 arg', desc: 'Call factorial(n - 1)', stackEffect: 0, pushVal: 'result' },
      { offset: 24, name: 'BINARY_MULTIPLY', arg: '', desc: 'n * result', stackEffect: -1, pushVal: 'n * result' },
      { offset: 26, name: 'RETURN_VALUE', arg: '', desc: 'Return result', stackEffect: -1 },
    ],
  },
]

let exId = 0
function getNextExId() { return ++exId }

export default function PythonBytecodeDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [key, setKey] = useState(0)

  const example = examples[selectedIdx]

  const stackTrace = useMemo(() => {
    const st: { vals: string[]; effect: string }[] = []
    let currentStack: string[] = []
    const instrs = example.bytecodes
    for (let i = 0; i < instrs.length; i++) {
      const instr = instrs[i]
      let newStack: string[] = []
      if (instr.stackEffect > 0) {
        newStack = [...currentStack, instr.pushVal || '?']
      } else if (instr.stackEffect < 0) {
        const popCount = Math.abs(instr.stackEffect)
        newStack = currentStack.slice(0, currentStack.length - popCount)
        if (instr.pushVal) {
          newStack = [...newStack, instr.pushVal]
        }
      } else {
        newStack = instr.pushVal ? [...currentStack, instr.pushVal] : [...currentStack]
      }
      currentStack = newStack
      st.push({ vals: [...currentStack], effect: instr.desc })
    }
    return st
  }, [example])

  const selectExample = (idx: number) => {
    setSelectedIdx(idx)
    setStep(0)
    setKey(getNextExId())
  }

  const currentStack = step >= 0 && step < stackTrace.length
    ? stackTrace[step].vals
    : []

  const currentInstr = step >= 0 && step < example.bytecodes.length
    ? example.bytecodes[step]
    : null

  return (
    <DemoBoundary name="Bytecode Explorer">
    <div key={key} style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Python Bytecode VM</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {examples.map((ex, i) => (
          <button key={ex.name} onClick={() => selectExample(i)} style={{
            background: selectedIdx === i ? s.accent : s.bg3,
            border: `1px solid ${selectedIdx === i ? s.accent : s.border}`,
            borderRadius: 8, padding: '6px 14px',
            color: selectedIdx === i ? '#fff' : s.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>{ex.name}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Source</div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, fontFamily: s.mono, fontSize: 13, color: s.text, whiteSpace: 'pre', lineHeight: 1.5 }}>{example.source}</div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Bytecode Instructions</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Step {step + 1}/{example.bytecodes.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {example.bytecodes.map((instr, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '6px 10px', borderRadius: 6,
                  background: step === i ? `${s.accent}22` : 'transparent',
                  borderLeft: `3px solid ${step === i ? s.accent : 'transparent'}`,
                  transition: 'all 0.2s',
                }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, minWidth: 28 }}>{instr.offset}</span>
                  <span style={{
                    color: step === i ? s.accent : s.purple, fontFamily: s.mono, fontSize: 12, fontWeight: 600, minWidth: 120,
                  }}>{instr.name}</span>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, minWidth: 60 }}>{instr.arg}</span>
                  <span style={{ color: s.text2, fontSize: 11, flex: 1 }}>{instr.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: 240 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 16, minHeight: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Stack</div>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4 }}>
              {currentStack.length === 0 && (
                <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic', padding: 8 }}>Empty stack</div>
              )}
              {currentStack.map((val, i) => (
                <div key={i} style={{
                  background: s.bg3, borderRadius: 6, padding: '6px 10px',
                  fontFamily: s.mono, fontSize: 12, color: s.yellow, textAlign: 'center',
                  border: `1px solid ${s.border}`,
                  boxShadow: i === currentStack.length - 1 ? `0 0 8px ${s.yellow}33` : 'none',
                }}>
                  {i === currentStack.length - 1 ? 'TOS: ' : ''}{val}
                </div>
              ))}
            </div>
          </div>

          {currentInstr && (
            <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Current</div>
              <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{currentInstr.name}</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{currentInstr.desc}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step <= 0} style={{
          background: step <= 0 ? s.bg3 : s.bg3, border: `1px solid ${step <= 0 ? s.border : s.border2}`,
          borderRadius: 8, padding: '8px 20px',
          color: step <= 0 ? s.text3 : s.text2, cursor: step <= 0 ? 'default' : 'pointer', fontSize: 13,
        }}>Previous</button>
        <button onClick={() => setStep(Math.min(example.bytecodes.length - 1, step + 1))} disabled={step >= example.bytecodes.length - 1} style={{
          background: step >= example.bytecodes.length - 1 ? s.bg3 : s.accent,
          border: 'none', borderRadius: 8, padding: '8px 20px',
          color: step >= example.bytecodes.length - 1 ? s.text3 : '#fff',
          cursor: step >= example.bytecodes.length - 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
        }}>Next</button>
        <button onClick={() => setStep(0)} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
      </div>
    </div>
    </DemoBoundary>
  )
}
