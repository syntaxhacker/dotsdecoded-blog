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

const OPCCODES: { value: number; label: string }[] = [
  { value: 1, label: 'Text (1)' },
  { value: 2, label: 'Binary (2)' },
  { value: 8, label: 'Close (8)' },
  { value: 9, label: 'Ping (9)' },
  { value: 10, label: 'Pong (10)' },
]

function buildFrame(
  payload: string, opcode: number, masked: boolean, fin: boolean,
): number[] {
  const encoder = new TextEncoder()
  const payloadBytes = Array.from(encoder.encode(payload))
  const bytes: number[] = []

  bytes.push((fin ? 0x80 : 0x00) | (opcode & 0x0f))

  const len = payloadBytes.length
  if (len < 126) {
    bytes.push((masked ? 0x80 : 0x00) | len)
  } else if (len < 65536) {
    bytes.push((masked ? 0x80 : 0x00) | 126)
    bytes.push((len >> 8) & 0xff)
    bytes.push(len & 0xff)
  } else {
    bytes.push((masked ? 0x80 : 0x00) | 127)
    for (let i = 7; i >= 0; i--) {
      bytes.push((len >> (i * 8)) & 0xff)
    }
  }

  let maskKey: number[] = []
  if (masked) {
    maskKey = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    bytes.push(...maskKey)
  }

  const maskedPayload = masked
    ? payloadBytes.map((b, i) => b ^ maskKey[i % 4])
    : payloadBytes
  bytes.push(...maskedPayload)

  return bytes
}

function formatHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')
}

interface ByteInfo {
  bytes: number[]
  label: string
  color: string
}

function getByteInfo(
  payload: string, opcode: number, masked: boolean, fin: boolean,
): ByteInfo[] {
  const encoder = new TextEncoder()
  const payloadBytes = Array.from(encoder.encode(payload))
  const groups: ByteInfo[] = []

  const firstByte = (fin ? 0x80 : 0x00) | (opcode & 0x0f)
  groups.push({ bytes: [firstByte], label: 'Control (FIN+RSV+Opcode)', color: s.accent })

  const len = payloadBytes.length
  let maskKey: number[] = []
  let lengthBytes: number[] = []

  if (len < 126) {
    lengthBytes = [(masked ? 0x80 : 0x00) | len]
  } else if (len < 65536) {
    lengthBytes = [(masked ? 0x80 : 0x00) | 126, (len >> 8) & 0xff, len & 0xff]
  } else {
    const ext = []
    for (let i = 7; i >= 0; i--) ext.push((len >> (i * 8)) & 0xff)
    lengthBytes = [(masked ? 0x80 : 0x00) | 127, ...ext]
  }

  groups.push({ bytes: lengthBytes, label: 'Length (MASK+Len)', color: s.yellow })

  if (masked) {
    maskKey = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    groups.push({ bytes: maskKey, label: 'Masking Key (4 bytes)', color: s.purple })
  }

  const finalPayload = masked
    ? payloadBytes.map((b, i) => b ^ maskKey[i % 4])
    : payloadBytes

  if (finalPayload.length > 0) {
    groups.push({ bytes: finalPayload, label: `Payload (${payloadBytes.length} bytes)`, color: s.green })
  }

  return groups
}

export default function WsFrameDemo() {
  const [payload, setPayload] = useState('Hello')
  const [opcode, setOpcode] = useState(1)
  const [masked, setMasked] = useState(true)
  const [fin, setFin] = useState(true)

  const groups = useMemo(
    () => getByteInfo(payload, opcode, masked, fin),
    [payload, opcode, masked, fin],
  )

  const frameBytes = useMemo(
    () => buildFrame(payload, opcode, masked, fin),
    [payload, opcode, masked, fin],
  )

  const opcodeNames: Record<number, string> = {
    1: 'Text', 2: 'Binary', 8: 'Close', 9: 'Ping', 10: 'Pong',
  }

  const firstByte = frameBytes[0]
  const secondByte = frameBytes[1]
  const actualFin = (firstByte & 0x80) !== 0
  const actualRsv = (firstByte >> 4) & 0x07
  const actualOpcode = firstByte & 0x0f
  const actualMasked = (secondByte & 0x80) !== 0
  const actualLen7 = secondByte & 0x7f

  let actualLen = actualLen7
  let offset = 2
  if (actualLen7 === 126) {
    actualLen = (frameBytes[2] << 8) | frameBytes[3]
    offset = 4
  } else if (actualLen7 === 127) {
    let len = 0
    for (let i = 0; i < 8; i++) len = (len << 8) | frameBytes[2 + i]
    actualLen = len
    offset = 10
  }

  if (actualMasked) offset += 4

  const payloadHex = frameBytes.slice(offset)
  const decodedPayload = actualMasked && frameBytes.length > offset
    ? new TextDecoder().decode(new Uint8Array(
      payloadHex.map((b, i) => b ^ (frameBytes[offset - 4 + (i % 4)])),
    ))
    : new TextDecoder().decode(new Uint8Array(payloadHex))

  return (
    <DemoBoundary name="WebSocket Frame">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
            WebSocket Frame Structure
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ color: s.text3, fontSize: 12, display: 'block', marginBottom: 4 }}>
                Payload
              </label>
              <input
                value={payload}
                onChange={e => setPayload(e.target.value)}
                style={{
                  width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ minWidth: 140 }}>
              <label style={{ color: s.text3, fontSize: 12, display: 'block', marginBottom: 4 }}>
                Opcode
              </label>
              <select
                value={opcode}
                onChange={e => setOpcode(Number(e.target.value))}
                style={{
                  width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13,
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {OPCCODES.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={masked} onChange={e => setMasked(e.target.checked)} style={{ accentColor: s.accent }} />
                <span style={{ color: s.text2, fontSize: 13 }}>Masked</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={fin} onChange={e => setFin(e.target.checked)} style={{ accentColor: s.accent }} />
                <span style={{ color: s.text2, fontSize: 13 }}>FIN</span>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Hex Bytes ({frameBytes.length} total)
            </div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '12px 16px', fontFamily: s.mono, fontSize: 13, lineHeight: 1.8,
              display: 'flex', flexWrap: 'wrap', gap: 4,
            }}>
              {groups.flatMap((g, gi) => {
                const parts = g.bytes.map((b, bi) => (
                  <span
                    key={`${gi}-${bi}`}
                    style={{
                      background: `${g.color}22`,
                      border: `1px solid ${g.color}44`,
                      borderRadius: 4, padding: '1px 5px',
                      color: g.color,
                    }}
                  >
                    {b.toString(16).padStart(2, '0')}
                  </span>
                ))
                if (gi < groups.length - 1) {
                  parts.push(
                    <span key={`sep-${gi}`} style={{ color: s.text3, padding: '0 2px' }} />
                  )
                }
                return parts
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontFamily: s.mono, fontSize: 12, marginBottom: 16 }}>
            <span style={{ color: s.accent }}>FIN</span>
            <span style={{ color: s.text }}>{actualFin ? '1 (Final fragment)' : '0 (More fragments)'}</span>
            <span style={{ color: s.accent }}>RSV</span>
            <span style={{ color: s.text }}>{actualRsv.toString(2).padStart(3, '0')} (must be 000)</span>
            <span style={{ color: s.accent }}>Opcode</span>
            <span style={{ color: s.text }}>{actualOpcode.toString(2).padStart(4, '0')} = {actualOpcode} ({opcodeNames[actualOpcode] || 'Unknown'})</span>
            <span style={{ color: s.yellow }}>MASK</span>
            <span style={{ color: s.text }}>{actualMasked ? '1 (Masked)' : '0 (Unmasked)'}</span>
            <span style={{ color: s.yellow }}>Length</span>
            <span style={{ color: s.text }}>{actualLen7 < 126 ? `${actualLen7} (7-bit)` : actualLen7 === 126 ? `${actualLen} (16-bit extended)` : `${actualLen} (64-bit extended)`}</span>
            {actualMasked && (
              <>
                <span style={{ color: s.purple }}>Mask Key</span>
                <span style={{ color: s.text }}>
                  {frameBytes.slice(actualLen7 < 126 ? 2 : actualLen7 === 126 ? 4 : 10, actualLen7 < 126 ? 6 : actualLen7 === 126 ? 8 : 14)
                    .map(b => b.toString(16).padStart(2, '0')).join(' ')}
                </span>
              </>
            )}
            <span style={{ color: s.green }}>Payload</span>
            <span style={{ color: s.text }}>{actualLen} bytes: "{decodedPayload}"</span>
          </div>

          <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Legend
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Control Byte', color: s.accent },
                { label: 'Length Info', color: s.yellow },
                { label: 'Masking Key', color: s.purple },
                { label: 'Payload', color: s.green },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: `${item.color}44`, border: `1px solid ${item.color}` }} />
                  <span style={{ color: s.text2, fontSize: 12 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
