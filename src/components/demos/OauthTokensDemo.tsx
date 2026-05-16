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
const MONO_BOX: React.CSSProperties = { background: s.bg, borderRadius: 8, padding: '12px 14px', fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap' }

const header = { alg: 'RS256', typ: 'JWT', kid: 'key-1a2b3c' }
const validPayload = {
  sub: 'user_abc123',
  iss: 'https://auth.dotsdecoded.com',
  aud: 'dotsdecoded-api',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
}

const tamperedPayload = { ...validPayload, role: 'superadmin' }

function b64Url(str: string) {
  try {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

const realSignature = 'R3g7kL9mN2pQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC2dE4fG'

function formatJson(obj: Record<string, unknown>) {
  return JSON.stringify(obj, null, 2)
}

export default function OauthTokensDemo() {
  const [mode, setMode] = useState<'valid' | 'tampered' | 'expired'>('valid')
  const [showDecoded, setShowDecoded] = useState<'none' | 'header' | 'payload' | 'signature'>('none')

  const currentPayload = mode === 'tampered' ? tamperedPayload : validPayload
  const now = Math.floor(Date.now() / 1000)
  const isExpired = mode === 'expired' || (mode === 'tampered' ? false : false)

  const headerB64 = useMemo(() => b64Url(formatJson(header)), [])
  const payloadB64 = useMemo(() => b64Url(formatJson(currentPayload)), [currentPayload])
  const signatureB64 = mode === 'tampered' ? 'INVALID_TAMPERED_SIGNATURE' : realSignature

  const encodedToken = `${headerB64}.${payloadB64}.${signatureB64}`

  const headerDecoded = formatJson(header)
  const payloadDecoded = formatJson(currentPayload)
  const signatureDecoded = mode === 'tampered'
    ? 'VERIFICATION FAILED: Signature does not match payload.\nThe JWT was tampered with (role changed from "admin" to "superadmin").\nThe auth server rejects this token with 401.'
    : 'VERIFIED: RS256 signature matches payload.\nPublic key from JWKS (kid: key-1a2b3c) confirms integrity.\nToken has not been modified.'

  const checkExpiry = () => {
    if (mode === 'expired') {
      const expiredTime = validPayload.exp - 3600
      return `Token expired at ${new Date(expiredTime * 1000).toLocaleString()}. Current time is ${new Date(now * 1000).toLocaleString()}. The "exp" claim is in the past.`
    }
    const remaining = validPayload.exp - now
    if (remaining <= 0) return 'Token has expired.'
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    return `Token is valid. Expires in ${mins}m ${secs}s. The "exp" claim is in the future.`
  }

  const tokenStatus = () => {
    if (mode === 'tampered') return { color: s.red, text: '401 Unauthorized - Invalid Signature' }
    if (mode === 'expired') return { color: s.yellow, text: '401 Unauthorized - Token Expired' }
    return { color: s.green, text: '200 OK - Token Valid' }
  }

  const status = tokenStatus()

  return (
    <DemoBoundary name="JWT Token Dissection and Verification">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>JWT Token Dissection</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A JSON Web Token (JWT) has three base64url-encoded parts separated by dots: header.payload.signature. Click each part to decode it.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          <div onClick={() => setShowDecoded(showDecoded === 'header' ? 'none' : 'header')} style={{
            background: s.bg3, borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
            border: `1px solid ${showDecoded === 'header' ? s.red : s.border}`,
            transition: 'all 0.2s', flex: 1, minWidth: 100,
          }}>
            <div style={{ color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Header</div>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 10, wordBreak: 'break-all' }}>{headerB64.substring(0, 40)}...</div>
          </div>
          <div onClick={() => setShowDecoded(showDecoded === 'payload' ? 'none' : 'payload')} style={{
            background: s.bg3, borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
            border: `1px solid ${showDecoded === 'payload' ? s.purple : s.border}`,
            transition: 'all 0.2s', flex: 1, minWidth: 100,
          }}>
            <div style={{ color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Payload</div>
            <div style={{ color: s.purple, fontFamily: s.mono, fontSize: 10, wordBreak: 'break-all' }}>{payloadB64.substring(0, 40)}...</div>
          </div>
          <div onClick={() => setShowDecoded(showDecoded === 'signature' ? 'none' : 'signature')} style={{
            background: s.bg3, borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
            border: `1px solid ${showDecoded === 'signature' ? s.green : s.border}`,
            transition: 'all 0.2s', flex: 1, minWidth: 100,
          }}>
            <div style={{ color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Signature</div>
            <div style={{ color: mode === 'tampered' ? s.red : s.green, fontFamily: s.mono, fontSize: 10, wordBreak: 'break-all' }}>{signatureB64.substring(0, 30)}...</div>
          </div>
        </div>

        <div style={{ ...MONO_BOX, border: `1px solid ${mode === 'tampered' ? s.red : s.border}`, color: mode === 'tampered' ? s.red : s.yellow, fontSize: 10, marginBottom: 20 }}>
          {encodedToken}
        </div>

        {showDecoded === 'header' && (
          <div style={{ background: `${s.red}08`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Header (Decoded)</div>
            <div style={{ ...MONO_BOX, fontSize: 10, color: s.text2, border: `1px solid ${s.border}` }}>{headerDecoded}</div>
            <div style={{ color: s.text2, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              <strong style={{ color: s.text }}>alg</strong>: RS256 (RSA with SHA-256, asymmetric signing). <strong style={{ color: s.text }}>typ</strong>: JWT. <strong style={{ color: s.text }}>kid</strong>: key identifier tells the verifier which JWKS key to use.
            </div>
          </div>
        )}

        {showDecoded === 'payload' && (
          <div style={{ background: `${s.purple}08`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Payload (Decoded)</div>
            <div style={{ ...MONO_BOX, fontSize: 10, color: s.text2, border: `1px solid ${s.border}` }}>{payloadDecoded}</div>
            <div style={{ color: s.text2, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              <strong style={{ color: s.text }}>sub</strong>: Subject (user ID). <strong style={{ color: s.text }}>iss</strong>: Issuer (who created the token). <strong style={{ color: s.text }}>aud</strong>: Audience (which API this is for). <strong style={{ color: s.text }}>exp</strong>: Expiration time (Unix timestamp). <strong style={{ color: s.text }}>iat</strong>: Issued at time.
            </div>
          </div>
        )}

        {showDecoded === 'signature' && (
          <div style={{ background: `${mode === 'tampered' ? s.red : s.green}08`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Signature Verification</div>
            <div style={{ ...MONO_BOX, fontSize: 10, color: mode === 'tampered' ? s.red : s.green, border: `1px solid ${mode === 'tampered' ? s.red : s.green}` }}>{signatureDecoded}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['valid', 'tampered', 'expired'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setShowDecoded('none') }} style={{
              background: mode === m ? (m === 'valid' ? s.green : m === 'tampered' ? s.red : s.yellow) : `${s.bg3}`,
              border: `1px solid ${m === 'valid' ? s.green : m === 'tampered' ? s.red : s.yellow}`,
              borderRadius: 6, padding: '7px 14px', color: mode === m ? '#fff' : (m === 'valid' ? s.green : m === 'tampered' ? s.red : s.yellow),
              cursor: 'pointer', fontSize: 12, fontWeight: 600, flex: 1,
            }}>
              {m === 'valid' ? 'Valid Token' : m === 'tampered' ? 'Tampered Payload' : 'Expired Token'}
            </button>
          ))}
        </div>

        <div style={{ background: `${status.color}10`, border: `1px solid ${status.color}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: status.color, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{status.text}</div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{checkExpiry()}</div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
