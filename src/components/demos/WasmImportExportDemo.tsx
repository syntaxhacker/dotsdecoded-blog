import { useState, useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface FlowStep {
  label: string
  arrowFrom: 'js' | 'wasm'
  arrowTo: 'js' | 'wasm'
  arrowLabel: string
  detail: string
}

const flows: FlowStep[][] = [
  [
    { label: 'JS calls WASM export', arrowFrom: 'js', arrowTo: 'wasm', arrowLabel: 'wasm.add(3, 4)', detail: 'JavaScript invokes the exported WASM function add() with arguments 3 and 4.' },
    { label: 'WASM executes add', arrowFrom: 'wasm', arrowTo: 'wasm', arrowLabel: 'i32.add', detail: 'WASM executes local.get 0, local.get 1, i32.add. Result: 7 sits on the value stack.' },
    { label: 'WASM returns result', arrowFrom: 'wasm', arrowTo: 'js', arrowLabel: 'return 7', detail: 'WASM returns the top of the stack (7) back to JavaScript.' },
  ],
  [
    { label: 'JS instantiates with imports', arrowFrom: 'js', arrowTo: 'wasm', arrowLabel: 'importObject', detail: 'JS creates an import object with console.log and passes it to WebAssembly.instantiate().' },
    { label: 'WASM calls JS import', arrowFrom: 'wasm', arrowTo: 'js', arrowLabel: 'console.log("hi")', detail: 'WASM calls the imported function. WASM pushes arguments, invokes call_indirect, and JS executes console.log.' },
    { label: 'JS returns control', arrowFrom: 'js', arrowTo: 'wasm', arrowLabel: 'return void', detail: 'JS finishes console.log and returns. Control goes back to WASM with any return value.' },
  ],
  [
    { label: 'JS calls add(3, 4)', arrowFrom: 'js', arrowTo: 'wasm', arrowLabel: 'wasm.add(3, 4)', detail: 'JS calls the exported add function with 3 and 4.' },
    { label: 'WASM computes sum', arrowFrom: 'wasm', arrowTo: 'wasm', arrowLabel: '7 on stack', detail: 'WASM pushes locals onto the stack and executes i32.add. Result 7 sits on the value stack.' },
    { label: 'WASM calls console.log', arrowFrom: 'wasm', arrowTo: 'js', arrowLabel: 'console.log(7)', detail: 'WASM calls the imported console.log function, passing 7 as the argument.' },
    { label: 'JS logs the result', arrowFrom: 'js', arrowTo: 'wasm', arrowLabel: 'return', detail: 'JS executes console.log("Result: 7") and returns control to WASM.' },
    { label: 'WASM returns to JS', arrowFrom: 'wasm', arrowTo: 'js', arrowLabel: 'return 7', detail: 'WASM function returns, and JS receives the result 7.' },
  ],
]

const jsExportCode = `const importObject = {
  console: {
    log: (x) => console.log("Result:", x),
  },
};

const result = await WebAssembly.instantiate(bytes, importObject);
const { add } = result.instance.exports;

console.log(add(3, 4)); // 7`

const jsImportCode = `const importObject = {
  console: {
    log: (x) => console.log("WASM says:", x),
  },
};

const wasm = (await WebAssembly.instantiate(bytes, importObject)).instance;
wasm.exports.run(); // calls console.log internally`

const highlightedExportCode = Prism.highlight(jsExportCode, Prism.languages.javascript, 'javascript')
const highlightedImportCode = Prism.highlight(jsImportCode, Prism.languages.javascript, 'javascript')

function FlowArrow({ from, to }: { from: 'js' | 'wasm'; to: 'js' | 'wasm' }) {
  const isSame = from === to
  const color = from === 'js' ? s.accent : s.green
  if (isSame) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 32 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: color, opacity: 0.6,
        }} />
      </div>
    )
  }
  const arrow = from === 'js' ? '\u2192' : '\u2190'
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 32 }}>
      <div style={{
        color, fontSize: 18, fontWeight: 700,
        animation: 'arrowPulse 0.6s ease-in-out infinite alternate',
      }}>
        {arrow}
      </div>
    </div>
  )
}

export default function WasmImportExportDemo() {
  const [flowIdx, setFlowIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  const flow = flows[flowIdx]
  const step = flow[stepIdx]
  const isLast = stepIdx === flow.length - 1
  const isFirst = stepIdx === 0

  useEffect(() => {
    if (!playing) return
    if (isLast) { setPlaying(false); return }
    const timer = setTimeout(() => {
      setStepIdx(i => Math.min(i + 1, flow.length - 1))
    }, 1800)
    return () => clearTimeout(timer)
  }, [playing, stepIdx, isLast, flow.length])

  const selectFlow = (idx: number) => {
    setFlowIdx(idx)
    setStepIdx(0)
    setPlaying(false)
  }

  const codeDisplay = flowIdx === 0 ? highlightedExportCode : flowIdx === 1 ? highlightedImportCode : highlightedExportCode
  const codeTitle = flowIdx === 0 ? 'Calling WASM from JS' : flowIdx === 1 ? 'Importing JS into WASM' : 'Full Round-Trip'

  const wasmCode = flowIdx === 0
    ? '(module\n  (type (func (param i32 i32) (result i32)))\n  (func $add ...)\n  (export "add" (func $add)))'
    : flowIdx === 1
    ? '(module\n  (import "console" "log" (func $log (param i32)))\n  (func $run ... call $log)\n  (export "run" (func $run)))'
    : '(module\n  (import "console" "log" ...)\n  (func $add ... call $log)\n  (export "add" (func $add)))'

  return (
    <DemoBoundary name="WASM Import/Export">
    <div style={{
      background: s.bg, padding: '24px 20px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>
        WASM Imports and Exports
      </div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.5 }}>
        WASM modules can export functions and memories to the host (JS) and import functions from the host. This two-way bridge is what makes WASM useful in real applications.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['JS->WASM Export', 'WASM->JS Import', 'Round-Trip'].map((label, i) => (
          <button key={i} onClick={() => selectFlow(i)} style={{
            background: flowIdx === i ? s.accent : s.bg3,
            border: `1px solid ${flowIdx === i ? s.accent : s.border}`,
            borderRadius: 6, padding: '6px 14px',
            color: flowIdx === i ? '#fff' : s.text2,
            fontSize: 12, cursor: 'pointer', fontWeight: flowIdx === i ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: 20,
        border: `1px solid ${s.border}`, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              background: s.bg3, borderRadius: 8, padding: '12px 16px',
              border: `2px solid ${step.arrowFrom === 'js' ? s.accent : s.border}`,
              transition: 'border-color 0.3s',
            }}>
              <div style={{ color: s.accent, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>JavaScript</div>
              <div style={{ fontSize: 28 }}>&#x1F40D;</div>
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, marginTop: 4 }}>Host Environment</div>
            </div>
          </div>
          <div style={{ width: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <FlowArrow from={step.arrowFrom} to={step.arrowTo} />
            <div style={{
              color: step.arrowFrom !== step.arrowTo ? s.accent : s.text3,
              fontFamily: s.mono, fontSize: 10, textAlign: 'center',
              marginTop: 4, background: s.bg, borderRadius: 4, padding: '2px 6px',
              transition: 'all 0.3s',
            }}>
              {step.arrowLabel}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              background: s.bg3, borderRadius: 8, padding: '12px 16px',
              border: `2px solid ${step.arrowFrom === 'wasm' ? s.green : s.border}`,
              transition: 'border-color 0.3s',
            }}>
              <div style={{ color: s.green, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>WASM Module</div>
              <div style={{ fontSize: 28 }}>&#x2699;</div>
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, marginTop: 4 }}>Sandboxed Runtime</div>
            </div>
          </div>
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, padding: 12,
          textAlign: 'center',
          borderLeft: `3px solid ${s.accent}`,
        }}>
          <div style={{ color: s.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {step.label}
          </div>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>
            {step.detail}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
          {flow.map((st, i) => (
            <div key={i} onClick={() => { setStepIdx(i); setPlaying(false) }} style={{
              width: 24, height: 6, borderRadius: 3,
              background: i === stepIdx ? s.accent : i < stepIdx ? s.accent + '60' : s.bg3,
              cursor: 'pointer', transition: 'all 0.15s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => { setStepIdx(Math.max(0, stepIdx - 1)); setPlaying(false) }} disabled={isFirst} style={{
          background: s.bg3, border: `1px solid ${s.border}`,
          borderRadius: 8, padding: '8px 16px',
          color: isFirst ? s.text3 : s.text2, cursor: isFirst ? 'default' : 'pointer',
          fontSize: 13, opacity: isFirst ? 0.5 : 1,
        }}>
          Prev
        </button>
        <button onClick={() => { setStepIdx(0); setPlaying(false) }} style={{
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
        <button onClick={() => { setStepIdx(Math.min(flow.length - 1, stepIdx + 1)); setPlaying(false) }} disabled={isLast} style={{
          background: s.accent, border: 'none',
          borderRadius: 8, padding: '8px 16px',
          color: '#fff', cursor: isLast ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 600, opacity: isLast ? 0.5 : 1,
        }}>
          Next
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{codeTitle}</div>
          <div style={{
            background: s.bg2, borderRadius: 8, padding: '10px 14px',
            border: `1px solid ${s.border}`,
          }}>
            <style>{`
              code .token.keyword { color: #f92672; }
              code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
              code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
              code .token.selector, code .token.attr-name { color: #f92672; }
              code .token.attr-value, code .token.atrule { color: #e6db74; }
              code .token.function, code .token.class-name { color: #a6e22e; }
              code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
              code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
              code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
            `}</style>
            <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.5 }}>
              <code dangerouslySetInnerHTML={{ __html: codeDisplay }} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>WASM Module (WAT)</div>
          <div style={{
            background: s.bg2, borderRadius: 8, padding: '10px 14px',
            border: `1px solid ${s.border}`,
            fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, color: s.text,
            whiteSpace: 'pre-wrap',
          }}>
            {wasmCode}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes arrowPulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
    </DemoBoundary>
  )
}
