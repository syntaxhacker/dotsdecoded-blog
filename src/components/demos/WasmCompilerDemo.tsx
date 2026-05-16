import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-c'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Stage {
  id: string
  name: string
  desc: string
  detail: string
  code?: string
  codeLang?: string
  size?: string
}

const stages: Stage[] = [
  {
    id: 'source',
    name: 'C Source',
    desc: 'Write code in a high-level language like C or Rust.',
    detail: 'The compiler (Clang, rustc) takes source code and parses it into an AST. Language-specific features are validated and type-checked before lowering to LLVM IR.',
    code: `int add(int a, int b) {
  return a + b;
}

int factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`,
    codeLang: 'c',
  },
  {
    id: 'llvm',
    name: 'LLVM IR',
    desc: 'Compiler generates LLVM Intermediate Representation.',
    detail: 'LLVM IR is a low-level, target-independent representation. It uses SSA (Static Single Assignment) form with infinite virtual registers. The IR is optimized by LLVM passes before code generation.',
    size: '~200 bytes',
    code: `define i32 @add(i32 %a, i32 %b) {
  %sum = add i32 %a, %b
  ret i32 %sum
}

define i32 @factorial(i32 %n) {
  %cmp = icmp sle i32 %n, 1
  br i1 %cmp, label %base, label %recur

base:
  ret i32 1

recur:
  %sub = sub i32 %n, 1
  %rec = call i32 @factorial(i32 %sub)
  %mul = mul i32 %n, %rec
  ret i32 %mul
}`,
  },
  {
    id: 'wasm',
    name: 'WASM Binary',
    desc: 'LLVM backend emits a .wasm file.',
    detail: 'The LLVM WebAssembly backend generates a WASM binary with proper sections. The wasm-opt tool from Binaryen can further optimize the binary -- dead code elimination, constant folding, and instruction selection.',
    size: '~120 bytes',
    code: `00 61 73 6D 01 00 00 00
01 07 01 60 02 7F 7F 01 7F
03 02 01 00
07 07 01 03 61 64 64 00 00
0A 0D 01 0B 00 20 00 20 01 6A 0B`,
  },
  {
    id: 'runtime',
    name: 'Runtime',
    desc: 'Execute in WASM runtime (browser, wasmtime, wasmer).',
    detail: 'WASM binaries run in a sandboxed environment. Browsers compile WASM to native code via the engine (V8, SpiderMonkey, JavaScriptCore). Standalone runtimes like wasmtime provide system access via WASI. wasm-pack packages WASM for npm distribution.',
    size: '38 bytes (add) + runtime',
    code: `// Browser
const wasm = await WebAssembly.instantiate(bytes);
const { add } = wasm.instance.exports;
console.log(add(3, 4)); // 7

// wasmtime CLI
$ wasmtime add.wasm --invoke add 3 4

// wasm-pack (Rust)
$ wasm-pack build --target web`,
    codeLang: 'c',
  },
]

const sizeComparison = [
  { name: 'C binary (x86-64)', size: '16 KB', color: s.red },
  { name: 'WASM binary', size: '120 B', color: s.green },
  { name: 'WASM gzipped', size: '72 B', color: s.accent },
  { name: 'JavaScript (min)', size: '256 B', color: s.yellow },
]

export default function WasmCompilerDemo() {
  const [activeStage, setActiveStage] = useState(0)

  const stage = stages[activeStage]

  const codeHighlight = useMemo(() => {
    if (stage.code && stage.codeLang === 'c') {
      return Prism.highlight(stage.code, Prism.languages.c, 'c')
    }
    return null
  }, [stage.code, stage.codeLang])

  return (
    <DemoBoundary name="WASM Compiler Pipeline">
    <div style={{
      background: s.bg, padding: '24px 20px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>
        Compilation Pipeline: C to WASM
      </div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.5 }}>
        High-level languages compile to WASM through a toolchain. The most common path is Clang + LLVM with the WebAssembly backend. Rust uses the same LLVM backend via rustc.
      </p>

      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: s.bg2, borderRadius: 12, padding: 6,
        border: `1px solid ${s.border}`,
      }}>
        {stages.map((st, i) => (
          <button key={st.id} onClick={() => setActiveStage(i)} style={{
            flex: 1, textAlign: 'center',
            background: activeStage === i ? s.bg3 : 'transparent',
            border: 'none', borderRadius: 8, padding: '10px 8px',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <div style={{
              color: activeStage === i ? s.accent : s.text3,
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {st.name}
            </div>
            {st.size && (
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 9, marginTop: 2 }}>
                {st.size}
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: 20,
        border: `1px solid ${s.border}`, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: s.accent,
          }} />
          <div style={{ color: s.text, fontSize: 15, fontWeight: 600 }}>
            {stage.name}
          </div>
        </div>

        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          {stage.detail}
        </div>

        {stage.code && (
          <div>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {stage.id === 'wasm' ? 'Binary Representation' : stage.id === 'runtime' ? 'Usage' : 'Source Code'}
            </div>
            <div style={{
              background: s.bg, borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${s.border}`,
              overflowX: 'auto',
            }}>
              {codeHighlight ? (
                <>
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
                  <code dangerouslySetInnerHTML={{ __html: codeHighlight }} />
                </div>
                </>
              ) : (
                <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.5, color: s.text, whiteSpace: 'pre-wrap' }}>
                  {stage.code}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: 20,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Binary Size Comparison
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sizeComparison.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: s.text, fontSize: 13, minWidth: 160 }}>{item.name}</div>
              <div style={{
                flex: 1, height: 20, background: s.bg, borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: item.name === 'WASM binary' ? '30%' : item.name === 'WASM gzipped' ? '18%' : item.name === 'JavaScript (min)' ? '64%' : '100%',
                  background: item.color, borderRadius: 4, opacity: 0.7,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 12, minWidth: 60, textAlign: 'right' }}>
                {item.size}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 16, padding: 12, background: s.bg, borderRadius: 8,
          border: `1px solid ${s.border}`,
        }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Key Toolchain Commands
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text, lineHeight: 1.7 }}>
            <div style={{ color: s.green }}>$ clang --target=wasm32 -O3 -c add.c -o add.o</div>
            <div style={{ color: s.green }}>$ wasm-ld --no-entry --export-all add.o -o add.wasm</div>
            <div style={{ color: s.green }}>$ wasm-opt -O3 add.wasm -o add-opt.wasm</div>
            <div style={{ color: s.green }}>$ wasmtime add.wasm --invoke add 3 4</div>
            <div style={{ color: s.text3, marginTop: 4 }}># For Rust:</div>
            <div style={{ color: s.accent }}>$ rustup target add wasm32-unknown-unknown</div>
            <div style={{ color: s.accent }}>$ rustc --target wasm32-unknown-unknown -O add.rs</div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
