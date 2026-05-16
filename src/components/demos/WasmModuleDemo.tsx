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

const sections = [
  {
    id: 'header',
    name: 'Header',
    num: '1-8',
    bytes: '00 61 73 6D 01 00 00 00',
    desc: 'Every .wasm file starts with 8 bytes: the magic number \\x00asm (00 61 73 6D) followed by the version in little-endian (01 00 00 00 = version 1). The magic string spells "\\0asm" in ASCII.',
    wat: '(module',
    color: s.accent,
    offset: 0,
  },
  {
    id: 'type',
    name: 'Type Section',
    num: '9-15',
    bytes: '01 07 01 60 02 7F 7F 01 7F',
    desc: 'Section ID 1. Declares function signatures used in the module. Here: 1 type (01), functype tag (60), 2 i32 params (02 7F 7F), 1 i32 result (01 7F).',
    wat: '  (type (func (param i32 i32) (result i32)))',
    color: s.green,
    offset: 8,
  },
  {
    id: 'function',
    name: 'Function Section',
    num: '16-19',
    bytes: '03 02 01 00',
    desc: 'Section ID 3. Maps function indices to type indices. Content: 1 function (01) using type index 0 (00). The actual function body lives in the Code section.',
    wat: '  (func $add (type 0))',
    color: s.yellow,
    offset: 15,
  },
  {
    id: 'export',
    name: 'Export Section',
    num: '20-27',
    bytes: '07 07 01 03 61 64 64 00 00',
    desc: 'Section ID 7. Makes module items visible to the host. Content: 1 export (01), name length 3 (03), name "add" (61 64 64), kind function (00), index 0 (00).',
    wat: '  (export "add" (func $add))',
    color: s.orange,
    offset: 19,
  },
  {
    id: 'code',
    name: 'Code Section',
    num: '28-38',
    bytes: '0A 09 01 07 00 20 00 20 01 6A 0B',
    desc: 'Section ID 10 (0x0A). Contains function bodies. Content: 1 body (01), body size 7 (07), 0 locals (00), then bytecode: local.get 0 (20 00), local.get 1 (20 01), i32.add (6A), end (0B).',
    wat: `  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)`,
    color: s.purple,
    offset: 27,
  },
]

const fullBytes = sections.map(s => s.bytes).join(' ')
const totalBytes = sections.reduce((sum, s) => sum + s.bytes.split(' ').filter(Boolean).length, 0)

export default function WasmModuleDemo() {
  const [active, setActive] = useState('type')

  const activeSection = sections.find(s => s.id === active)!

  return (
    <DemoBoundary name="WASM Module Structure">
    <div style={{
      background: s.bg, padding: '24px 20px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        WASM Binary Module Structure
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 20,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ display: 'flex', gap: 2, marginBottom: 12, flexWrap: 'wrap' }}>
          {sections.map(sec => (
            <div key={sec.id} style={{
              flex: 1, minWidth: 80,
              background: active === sec.id ? `${sec.color}25` : s.bg3,
              border: `1px solid ${active === sec.id ? sec.color : 'transparent'}`,
              borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.15s',
            }} onClick={() => setActive(sec.id)}>
              <div style={{ color: active === sec.id ? sec.color : s.text3, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {sec.name}
              </div>
              <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono, marginTop: 2 }}>
                bytes {sec.num}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, padding: 14,
          fontFamily: s.mono, fontSize: 12, lineHeight: 1.8,
          overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          {sections.map(sec => {
            const isActive = sec.id === active
            return (
              <span key={sec.id} style={{
                color: isActive ? sec.color : s.text3,
                background: isActive ? `${sec.color}15` : 'transparent',
                borderRadius: 3, padding: '1px 2px',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }} onClick={() => setActive(sec.id)}>
                {sec.bytes}{' '}
              </span>
            )
          })}
        </div>
        <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginTop: 8, textAlign: 'right' }}>
          Total: {totalBytes} bytes
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: 20,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: activeSection.color, flexShrink: 0,
          }} />
          <div style={{ color: s.text, fontSize: 15, fontWeight: 600 }}>
            {activeSection.name}
          </div>
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            bytes {activeSection.num} (offset {activeSection.offset})
          </div>
        </div>

        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          {activeSection.desc}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Binary
          </div>
          <div style={{
            background: s.bg, borderRadius: 8, padding: '10px 14px',
            fontFamily: s.mono, fontSize: 13, color: s.text, lineHeight: 1.8,
            overflowX: 'auto', whiteSpace: 'nowrap',
          }}>
            {activeSection.bytes.split(' ').map((byte, i) => (
              <span key={i} style={{
                color: byte === '00' ? s.text3 : s.text,
              }}>{byte} </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            WAT Equivalent
          </div>
          <div style={{
            background: s.bg, borderRadius: 8, padding: '10px 14px',
            fontFamily: s.mono, fontSize: 12, color: s.text, lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {activeSection.wat}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
