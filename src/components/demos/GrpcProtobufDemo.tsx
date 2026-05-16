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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const protoLines = [
  ['keyword', 'message Person {'],
  ['field',  '  int32 id = 1;'],
  ['field',  '  string name = 2;'],
  ['field',  '  string email = 3;'],
  ['plain',  '}'],
]

const protoColors: Record<string, string> = {
  keyword: '#f92672',
  field: '#a6e22e',
  plain: '#acb0b9',
}

function varintBytes(val: number): number[] {
  const bytes: number[] = []
  let n = val >>> 0
  while (n >= 0x80) {
    bytes.push((n & 0x7f) | 0x80)
    n >>>= 7
  }
  bytes.push(n)
  return bytes
}

function hex(arr: number[]): string {
  return arr.map(b => b.toString(16).padStart(2, '0')).join(' ')
}

function encodeMessage(id: number, name: string, email: string): number[] {
  const bytes: number[] = []
  const idTag = (1 << 3) | 0
  bytes.push(idTag, ...varintBytes(id))
  const nameEnc = new TextEncoder().encode(name)
  const nameTag = (2 << 3) | 2
  bytes.push(nameTag, ...varintBytes(nameEnc.length), ...Array.from(nameEnc))
  const emailEnc = new TextEncoder().encode(email)
  const emailTag = (3 << 3) | 2
  bytes.push(emailTag, ...varintBytes(emailEnc.length), ...Array.from(emailEnc))
  return bytes
}

function fieldDetails(id: number, name: string, email: string) {
  const idVarint = varintBytes(id)
  const nameEnc = new TextEncoder().encode(name)
  const emailEnc = new TextEncoder().encode(email)
  return [
    {
      label: 'Field 1 (int32 id)',
      tagHex: '0x' + ((1 << 3) | 0).toString(16).padStart(2, '0'),
      wt: 'varint (0)',
      valHex: idVarint.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
      valRaw: String(id),
      size: 1 + idVarint.length,
    },
    {
      label: 'Field 2 (string name)',
      tagHex: '0x' + ((2 << 3) | 2).toString(16).padStart(2, '0'),
      wt: 'length-delimited (2)',
      valHex: 'len=' + nameEnc.length + ' [' + Array.from(nameEnc).map(b => b.toString(16).padStart(2, '0')).join(' ') + ']',
      valRaw: '"' + name + '"',
      size: 1 + varintBytes(nameEnc.length).length + nameEnc.length,
    },
    {
      label: 'Field 3 (string email)',
      tagHex: '0x' + ((3 << 3) | 2).toString(16).padStart(2, '0'),
      wt: 'length-delimited (2)',
      valHex: 'len=' + emailEnc.length + ' [' + Array.from(emailEnc).map(b => b.toString(16).padStart(2, '0')).join(' ') + ']',
      valRaw: '"' + email + '"',
      size: 1 + varintBytes(emailEnc.length).length + emailEnc.length,
    },
  ]
}

export default function GrpcProtobufDemo() {
  const [id, setId] = useState(42)
  const [name, setName] = useState('Alice')
  const [email, setEmail] = useState('alice@example.com')

  const wireBytes = useMemo(() => encodeMessage(id, name, email), [id, name, email])
  const totalBytes = wireBytes.length
  const fields = useMemo(() => fieldDetails(id, name, email), [id, name, email])

  const jsonSize = new TextEncoder().encode(JSON.stringify({ id, name, email })).length

  const hexChunks: { bytes: number[]; color: string; label: string }[] = []
  const idEnc = [((1 << 3) | 0), ...varintBytes(id)]
  hexChunks.push({ bytes: idEnc, color: s.accent, label: 'id' })
  const nameEnc = new TextEncoder().encode(name)
  const nameWire = [((2 << 3) | 2), ...varintBytes(nameEnc.length), ...Array.from(nameEnc)]
  hexChunks.push({ bytes: nameWire, color: s.green, label: 'name' })
  const emailEnc = new TextEncoder().encode(email)
  const emailWire = [((3 << 3) | 2), ...varintBytes(emailEnc.length), ...Array.from(emailEnc)]
  hexChunks.push({ bytes: emailWire, color: s.purple, label: 'email' })

  return (
    <DemoBoundary name="Protocol Buffer Serialization">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Protocol Buffer Wire Format</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Edit the fields below and watch the binary wire format update in real time.
          Each field is encoded as a tag (field_number &lt;&lt; 3 | wire_type) followed by its value.
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: '0 0 36%' }}>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 14, overflow: 'auto' }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>person.proto</div>
              <code style={{ fontFamily: s.mono, fontSize: 12, color: s.text2, whiteSpace: 'pre', lineHeight: 1.7 }}>
                {protoLines.map((ln, i) => (
                  <span key={i} style={{ display: 'block', color: protoColors[ln[0]] }}>{ln[1]}</span>
                ))}
              </code>
            </div>
          </div>

          <div style={{ flex: '0 0 34%' }}>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 14, minHeight: 100 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Wire Format ({totalBytes} bytes)
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.8, wordBreak: 'break-all' }}>
                {hexChunks.map((chunk, ci) => (
                  <span key={ci} style={{ color: chunk.color }}>
                    {chunk.bytes.map((b, bi) => (
                      <span key={bi} style={{
                        display: 'inline-block',
                        background: `${chunk.color}15`,
                        borderRadius: 3,
                        padding: '0 2px',
                        marginRight: 2,
                        borderBottom: `2px solid ${chunk.color}40`,
                        cursor: 'default',
                      }} title={chunk.label}>
                        {b.toString(16).padStart(2, '0')}
                      </span>
                    ))}
                    <span style={{ color: s.text3, margin: '0 4px' }}>|</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                {hexChunks.map((chunk, ci) => (
                  <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: chunk.color }} />
                    <span style={{ color: s.text3, fontSize: 10 }}>{chunk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: '0 0 26%' }}>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 14, minHeight: 100 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                JSON ({jsonSize} bytes)
              </div>
              <code style={{ fontFamily: s.mono, fontSize: 12, color: s.text2, whiteSpace: 'pre', lineHeight: 1.7 }}>
{`{ "id": ${id},
  "name": "${name}",
  "email": "${email}" }`}
              </code>
              <div style={{ marginTop: 8, color: s.orange, fontSize: 11, fontFamily: s.mono }}>
                {(jsonSize / Math.max(totalBytes, 1)).toFixed(1)}x larger than protobuf
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>id (int32, field 1)</label>
            <input type="number" value={id} onChange={e => setId(Math.max(0, Math.min(999999, Number(e.target.value) || 0)))}
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>name (string, field 2)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value.slice(0, 50))}
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>email (string, field 3)</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value.slice(0, 80))}
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Field Encoding Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map((f, fi) => (
              <div key={fi} style={{ background: s.bg, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{f.size} bytes</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>
                    tag: <span style={{ color: s.accent }}>{f.tagHex}</span> (wire_type={f.wt})
                  </span>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>
                    value: <span style={{ color: s.green }}>{f.valHex}</span>
                  </span>
                </div>
                <div style={{ marginTop: 2, color: s.text3, fontSize: 11 }}>
                  Raw: {f.valRaw}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent }} />
            <span style={{ color: s.text3, fontSize: 11 }}>id field — tag (0x08) + varint value</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
            <span style={{ color: s.text3, fontSize: 11 }}>name field — tag (0x12) + length + UTF-8 bytes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.purple }} />
            <span style={{ color: s.text3, fontSize: 11 }}>email field — tag (0x1a) + length + UTF-8 bytes</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
