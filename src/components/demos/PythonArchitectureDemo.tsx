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

interface Stage {
  id: string
  label: string
  description: string
  color: string
  details: string
  cFile: string
}

const stages: Stage[] = [
  {
    id: 'source',
    label: 'Python Source (.py)',
    description: 'Your Python script saved as a .py file. The entry point for all Python execution.',
    color: s.text,
    details: 'CPython reads the source file as bytes, decodes it to Unicode (UTF-8 by default), and splits it into tokens. The file is loaded from disk or from stdin.',
    cFile: 'n/a',
  },
  {
    id: 'tokenizer',
    label: 'Tokenizer',
    description: 'Breaks source text into tokens: keywords, identifiers, operators, literals.',
    color: s.accent,
    details: 'Implemented in C (tokenize.c). Reads characters and produces tokens like NAME (identifiers), NUMBER, STRING, NEWLINE, INDENT, DEDENT. Handles indentation tracking via a stack.',
    cFile: 'tokenize.c',
  },
  {
    id: 'parser',
    label: 'Parser (AST)',
    description: 'Builds an Abstract Syntax Tree from the token stream.',
    color: s.green,
    details: 'Uses a PEG parser (Python 3.9+). Produces an AST where each node is a C struct (mod_ty stmt_ty expr_ty). The AST represents the syntactic structure of your program.',
    cFile: 'ast.c',
  },
  {
    id: 'compiler',
    label: 'Compiler',
    description: 'Walks the AST and emits bytecode instructions.',
    color: s.orange,
    details: 'The compiler (compile.c) transforms the AST into a code object. It computes scope information (local vs global variables), optimizes constant folding, and emits bytecode instructions. The code object contains the bytecode array, constants table, and variable names.',
    cFile: 'compile.c',
  },
  {
    id: 'bytecode',
    label: 'Bytecode (.pyc)',
    description: 'Cached bytecode in __pycache__/. Loaded instead of re-parsing if source is unchanged.',
    color: s.yellow,
    details: 'Serialized code objects stored in .pyc files. The marshal module handles serialization. On import, if a .pyc exists and its timestamp matches the .py file, CPython skips parsing and compiling entirely.',
    cFile: 'marshal.c',
  },
  {
    id: 'ceval',
    label: 'CEval Loop',
    description: 'The main interpreter loop -- a big switch statement that executes each bytecode.',
    color: s.purple,
    details: 'The heart of CPython. `_PyEval_EvalFrameDefault` in ceval.c. A for(;;) loop with a switch(opcode) that handles all 200+ bytecodes. Maintains the value stack, block stack (for try/except/with), and instruction pointer. This is where your code actually runs.',
    cFile: 'ceval.c',
  },
  {
    id: 'runtime',
    label: 'Runtime Services',
    description: 'Memory allocator, GC, GIL, threading, asyncio, import system, C API.',
    color: s.red,
    details: 'Surrounding the CEval loop are CPython\'s runtime components: obmalloc for object memory, the generational GC (gcmodule.c), the GIL (Python/pystate.c), threading, the import system (import.c), and the C extension API (Python/importdl.c). All written in C and accessible from Python via built-in modules.',
    cFile: 'various',
  },
]

const arrowStyle: React.CSSProperties = {
  color: s.text3, fontSize: 11, margin: '4px 0', textAlign: 'center', fontFamily: s.mono,
}

export default function PythonArchitectureDemo() {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <DemoBoundary name="Architecture Overview">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>CPython Architecture</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
        {stages.map((stage, i) => (
          <div key={stage.id}>
            <div
              onClick={() => setSelectedStage(stage)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: selectedStage?.id === stage.id
                  ? `${stage.color}18`
                  : hoveredIdx === i ? s.bg3 : s.bg2,
                border: `1px solid ${selectedStage?.id === stage.id ? stage.color : s.border}`,
                borderRadius: 10,
                padding: '12px 18px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: stage.color,
                  flexShrink: 0,
                  boxShadow: selectedStage?.id === stage.id ? `0 0 8px ${stage.color}66` : 'none',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: stage.color, fontSize: 13, fontWeight: 700, fontFamily: s.mono }}>
                    {stage.label}
                  </div>
                  <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>{stage.description}</div>
                </div>
                <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 9, textAlign: 'right' }}>
                  {stage.cFile}
                </div>
              </div>
            </div>
            {i < stages.length - 1 && (
              <div style={arrowStyle}>|</div>
            )}
          </div>
        ))}
      </div>

      {selectedStage && (
        <div style={{
          background: s.bg2, borderRadius: 12, padding: 20,
          border: `1px solid ${selectedStage.color}44`,
          animation: 'fadeIn 0.2s',
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedStage.color }} />
            <span style={{ color: selectedStage.color, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>
              {selectedStage.label}
            </span>
          </div>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
            {selectedStage.details}
          </div>
          <div style={{
            background: s.bg, borderRadius: 8, padding: '8px 14px', display: 'inline-block',
            color: s.text3, fontFamily: s.mono, fontSize: 11,
          }}>
            Source: <span style={{ color: s.accent }}>{selectedStage.cFile}</span>
          </div>
        </div>
      )}

      {!selectedStage && (
        <div style={{ color: s.text3, fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 12 }}>
          Click any component in the pipeline above to see its role in CPython
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
