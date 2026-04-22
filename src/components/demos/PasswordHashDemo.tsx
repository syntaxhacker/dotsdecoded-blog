import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

function hashString(str: string, salt: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  for (let i = 0; i < salt.length; i++) {
    h ^= salt.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= str.length
  h = Math.imul(h, 0x5bd1e995)
  h ^= h >>> 15
  h = Math.imul(h, 0x27d4eb2d)
  h ^= h >>> 15
  return (h >>> 0).toString(16).padStart(8, '0')
}

function generateBcryptLike(password: string, cost: number): { full: string; algo: string; costStr: string; salt: string; hash: string } {
  const saltHex = hashString('salt' + password.slice(0, 2) + Date.now().toString(36), 'bcrypt').padEnd(22, '0').slice(0, 22)
  let h = hashString(password + saltHex, 'bcrypt-round1')
  for (let i = 1; i < cost; i++) {
    h = hashString(h + saltHex, 'round' + i)
  }
  const hashHex = h.padEnd(31, '0').slice(0, 31)
  const full = `$2b$${String(cost).padStart(2, '0')}$${saltHex}${hashHex}`
  return {
    full,
    algo: '$2b$',
    costStr: String(cost).padStart(2, '0'),
    salt: saltHex,
    hash: hashHex,
  }
}

function AvalancheDemo({ password }: { password: string }) {
  const altPassword = password.length > 0 ? password.slice(0, -1) + String.fromCharCode(password.charCodeAt(password.length - 1) + 1) : 'a'

  const hash1 = useMemo(() => password.length > 0 ? generateBcryptLike(password, 10) : null, [password])
  const hash2 = useMemo(() => altPassword.length > 0 ? generateBcryptLike(altPassword, 10) : null, [altPassword])

  if (!hash1 || !hash2 || password.length === 0) return null

  const hex1 = hash1.hash
  const hex2 = hash2.hash
  let diffCount = 0
  for (let i = 0; i < Math.min(hex1.length, hex2.length); i++) {
    if (hex1[i] !== hex2[i]) diffCount++
  }
  const maxDiff = Math.max(hex1.length, hex2.length)
  const diffPct = Math.round((diffCount / maxDiff) * 100)

  return (
    <div style={{
      marginTop: 16, background: s.bg, borderRadius: 10, padding: '16px',
      border: `1px solid ${s.border}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.yellow, marginBottom: 12 }}>Avalanche Effect</div>
      <div style={{ fontSize: 12, color: s.text2, marginBottom: 10, lineHeight: 1.5 }}>
        Changed one character: <span style={{ ...M, color: s.red }}>{password}</span> {'->'} <span style={{ ...M, color: s.green }}>{altPassword}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ ...M, fontSize: 10, color: s.text3, width: 50 }}>Original</div>
        <div style={{ ...M, fontSize: 10, color: s.accent, wordBreak: 'break-all' }}>{hash1.full}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ ...M, fontSize: 10, color: s.text3, width: 50 }}>Changed</div>
        <div style={{ ...M, fontSize: 10, color: s.accent, wordBreak: 'break-all' }}>{hash2.full}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1, height: 8, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${diffPct}%`, height: '100%', background: s.yellow,
            borderRadius: 4, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ ...M, fontSize: 11, color: s.yellow, fontWeight: 700 }}>{diffPct}% different</div>
      </div>
      <div style={{ fontSize: 11, color: s.text3, marginTop: 8, lineHeight: 1.5 }}>
        Even a tiny change produces a completely different hash. This is the avalanche effect — a core property of cryptographic hash functions.
      </div>
    </div>
  )
}

function VerificationDemo({ password }: { password: string }) {
  const [verifyInput, setVerifyInput] = useState('')
  const [result, setResult] = useState<'none' | 'match' | 'no-match'>('none')

  const storedHash = useMemo(() => password.length > 0 ? generateBcryptLike(password, 10).full : null, [password])
  const verifyHash = useMemo(() => verifyInput.length > 0 ? generateBcryptLike(verifyInput, 10) : null, [verifyInput])

  const check = () => {
    if (!password || !verifyInput) return
    setResult(verifyInput === password ? 'match' : 'no-match')
  }

  if (!storedHash) return null

  return (
    <div style={{
      marginTop: 16, background: s.bg, borderRadius: 10, padding: '16px',
      border: `1px solid ${s.border}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginBottom: 12 }}>Password Verification</div>
      <div style={{ fontSize: 12, color: s.text2, marginBottom: 10, lineHeight: 1.5 }}>
        bcrypt verifies by hashing the input with the same salt and comparing. It never reverses the hash.
      </div>
      <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 4 }}>STORED HASH</div>
      <div style={{ ...M, fontSize: 10, color: s.accent, background: s.bg2, padding: '8px 12px', borderRadius: 6, marginBottom: 10, wordBreak: 'break-all' }}>
        {storedHash}
      </div>
      <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 4 }}>ENTER PASSWORD TO VERIFY</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={verifyInput}
          onChange={e => { setVerifyInput(e.target.value); setResult('none') }}
          placeholder="Type a password to verify..."
          style={{
            flex: 1, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 14px', color: s.text, ...M, fontSize: 12, outline: 'none',
          }}
        />
        <button onClick={check} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '10px 16px',
          color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, ...M,
        }}>
          Verify
        </button>
      </div>
      {verifyHash && (
        <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 4 }}>HASH OF INPUT</div>
      )}
      {verifyHash && (
        <div style={{ ...M, fontSize: 10, color: s.orange, background: s.bg2, padding: '8px 12px', borderRadius: 6, marginBottom: 10, wordBreak: 'break-all' }}>
          {verifyHash.full}
        </div>
      )}
      {result === 'match' && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, background: s.green + '15',
          border: `1px solid ${s.green}33`, ...M, fontSize: 11, color: s.green, fontWeight: 700,
        }}>
          MATCH — Password is correct. User authenticated.
        </div>
      )}
      {result === 'no-match' && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, background: s.red + '15',
          border: `1px solid ${s.red}33`, ...M, fontSize: 11, color: s.red, fontWeight: 700,
        }}>
          NO MATCH — Password is incorrect. Authentication denied.
        </div>
      )}
    </div>
  )
}

function VerificationDemoWrapped(props: { password: string }) {
  return <VerificationDemo password={props.password} />
}

export default function PasswordHashDemo() {
  const [password, setPassword] = useState('')
  const [cost, setCost] = useState(10)

  const bcryptResult = useMemo(
    () => password.length > 0 ? generateBcryptLike(password, cost) : null,
    [password, cost]
  )

  return (
    <DemoBoundary name="Password Hash Demo">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Password Hashing with bcrypt</div>

        <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 6 }}>PASSWORD</div>
        <input
          type="text"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Type a password to hash..."
          style={{
            width: '100%', background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '12px 16px', color: s.text, ...M, fontSize: 13, outline: 'none', marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 6 }}>COST FACTOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min={4}
                max={14}
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
                style={{ width: 160, accentColor: s.accent }}
              />
              <div style={{ ...M, fontSize: 16, fontWeight: 700, color: s.accent, width: 28, textAlign: 'center' }}>{cost}</div>
            </div>
            <div style={{ fontSize: 10, color: s.text3, marginTop: 4 }}>
              Higher cost = slower hashing = more secure. Default is 10 (about 100ms).
            </div>
          </div>
        </div>

        {bcryptResult && (
          <div>
            <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 6 }}>GENERATED BCRYPT HASH</div>
            <div style={{
              background: s.bg2, borderRadius: 8, padding: '14px 16px',
              border: `1px solid ${s.border}`, ...M, fontSize: 11, color: s.accent,
              wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 16,
            }}>
              <span style={{ color: s.purple }}>{bcryptResult.algo}</span>
              <span style={{ color: s.yellow }}>{bcryptResult.costStr}</span>
              <span style={{ color: s.orange }}>$</span>
              <span style={{ color: s.orange }}>{bcryptResult.salt}</span>
              <span style={{ color: s.green }}>{bcryptResult.hash}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: s.purple }} />
                <span style={{ ...M, fontSize: 10, color: s.text2 }}>Algorithm ($2b$)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: s.yellow }} />
                <span style={{ ...M, fontSize: 10, color: s.text2 }}>Cost factor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: s.orange }} />
                <span style={{ ...M, fontSize: 10, color: s.text2 }}>Salt (22 chars)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: s.green }} />
                <span style={{ ...M, fontSize: 10, color: s.text2 }}>Hash (31 chars)</span>
              </div>
            </div>
          </div>
        )}

        <AvalancheDemo password={password} />
        <VerificationDemoWrapped password={password} />
      </div>
    </div>
    </DemoBoundary>
  )
}
