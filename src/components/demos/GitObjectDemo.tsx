import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type ObjectType = 'blob' | 'tree' | 'commit' | 'tag'

const OBJECT_TYPES: { type: ObjectType; header: string; example: string }[] = [
  { type: 'blob', header: 'blob', example: 'hello world' },
  { type: 'tree', header: 'tree', example: '100644 blob a1b2c3d\tindex.html' },
  { type: 'commit', header: 'commit', example: 'tree a1b2c3d\nauthor Alice <alice@x.com> 1700000000 +0000\n\nInitial commit' },
  { type: 'tag', header: 'tag', example: 'object a1b2c3d\ntype commit\ntag v1.0' },
]

async function sha1Hex(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-1', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function GitObjectDemo() {
  const [objType, setObjType] = useState<ObjectType>('blob')
  const [content, setContent] = useState('hello world')
  const [hash, setHash] = useState('')

  const objHeader = OBJECT_TYPES.find(t => t.type === objType)!

  useEffect(() => {
    let cancelled = false
    const raw = `${objHeader.header} ${new TextEncoder().encode(content).length}\0${content}`
    sha1Hex(raw).then(h => { if (!cancelled) setHash(h) })
    return () => { cancelled = true }
  }, [objType, content])

  return (
    <DemoBoundary name="Git Object Hashing">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '20px 24px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>
          Git Object Content-Addressable Hash
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {OBJECT_TYPES.map(ot => (
            <button key={ot.type} onClick={() => setObjType(ot.type)} style={{
              background: objType === ot.type ? s.accent : s.bg3,
              border: 'none', borderRadius: 6, padding: '6px 14px',
              color: objType === ot.type ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: s.mono,
              transition: 'all 0.15s',
            }}>
              {ot.type}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: s.text3, marginBottom: 6 }}>
            Content (<span style={{ color: s.accent }}>{objType}</span> object)
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={objHeader.example}
            style={{
              width: '100%', minHeight: 70, padding: 10,
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              color: s.text, fontFamily: s.mono, fontSize: 12,
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
          padding: 12, fontFamily: s.mono, fontSize: 12,
        }}>
          <div style={{ color: s.text3, marginBottom: 6 }}>
            Raw object: <span style={{ color: s.text2 }}>{objType}</span>
            <span style={{ color: s.text3 }}> </span>
            <span style={{ color: s.orange }}>{new TextEncoder().encode(content).length}</span>
            <span style={{ color: s.text3 }}>\0</span>
            <span style={{ color: s.green }}>{content || '(empty)'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ color: s.text3 }}>SHA-1:</span>
            <span style={{ color: hash ? s.accent : s.text3, fontWeight: 600, fontSize: 14, letterSpacing: 1 }}>
              {hash || 'calculating...'}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        padding: '10px 16px', background: s.bg2, borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontSize: 11, color: s.text3, lineHeight: 1.6,
      }}>
        The hash is <code style={{ color: s.accent, fontFamily: s.mono }}>SHA-1( &quot;{objType} {new TextEncoder().encode(content).length}\\0{content || '(empty)'}&quot; )</code>.
        Change the type or content to see the hash update.
      </div>
    </div>
    </DemoBoundary>
  )
}
