import { useState, useEffect, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

async function sha1Hex(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-1', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function GitBlobDemo() {
  const [content, setContent] = useState('hello world')
  const [hash, setHash] = useState('')
  const [hash2, setHash2] = useState('')
  const [secondContent, setSecondContent] = useState('')

  useEffect(() => {
    let cancelled = false
    const raw = `blob ${new TextEncoder().encode(content).length}\0${content}`
    sha1Hex(raw).then(h => { if (!cancelled) setHash(h) })
    return () => { cancelled = true }
  }, [content])

  useEffect(() => {
    if (!secondContent) { setHash2(''); return }
    let cancelled = false
    const raw = `blob ${new TextEncoder().encode(secondContent).length}\0${secondContent}`
    sha1Hex(raw).then(h => { if (!cancelled) setHash2(h) })
    return () => { cancelled = true }
  }, [secondContent])

  const sameContent = secondContent && content === secondContent

  return (
    <DemoBoundary name="Git Blob Content-Addressable Storage">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '20px 24px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>
          Blob Storage: Same Content = Same Hash
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 6 }}>File A</div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{
                width: '100%', minHeight: 60, padding: 10,
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
                color: s.text, fontFamily: s.mono, fontSize: 12,
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 6 }}>File B</div>
            <textarea
              value={secondContent}
              onChange={e => setSecondContent(e.target.value)}
              style={{
                width: '100%', minHeight: 60, padding: 10,
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
                color: s.text, fontFamily: s.mono, fontSize: 12,
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
          padding: 12,
        }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: s.text3, fontSize: 11 }}>Raw object: </span>
            <span style={{ color: s.orange, fontFamily: s.mono, fontSize: 12 }}>blob</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}> </span>
            <span style={{ color: s.yellow, fontFamily: s.mono, fontSize: 12 }}>{new TextEncoder().encode(content).length}</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>\0</span>
            <span style={{ color: s.green, fontFamily: s.mono, fontSize: 12 }}>{content}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.text3, fontSize: 11, minWidth: 60 }}>File A hash:</span>
              <span style={{
                color: hash ? s.accent : s.text3, fontFamily: s.mono, fontSize: 13,
                fontWeight: 600, letterSpacing: 1,
              }}>
                {hash || 'calculating...'}
              </span>
            </div>
            {secondContent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: s.text3, fontSize: 11, minWidth: 60 }}>File B hash:</span>
                <span style={{
                  color: hash2 ? (sameContent ? s.green : s.red) : s.text3,
                  fontFamily: s.mono, fontSize: 13,
                  fontWeight: 600, letterSpacing: 1,
                }}>
                  {hash2 || 'calculating...'}
                </span>
              </div>
            )}
          </div>
          {secondContent && (
            <div style={{
              marginTop: 8, padding: '6px 10px', borderRadius: 6,
              background: sameContent ? `${s.green}12` : `${s.red}12`,
              border: `1px solid ${sameContent ? s.green : s.red}30`,
              fontSize: 11, color: sameContent ? s.green : s.red,
              fontFamily: s.mono,
            }}>
              {sameContent
                ? 'Same content = Same hash. Git stores it once.'
                : 'Different content = Different hash. Separate objects.'}
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '10px 16px', background: s.bg2, borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontSize: 11, color: s.text3, lineHeight: 1.6,
      }}>
        Blobs store file content only (no name, no permissions). Two files with identical content in different directories share the same blob.
      </div>
    </div>
    </DemoBoundary>
  )
}
