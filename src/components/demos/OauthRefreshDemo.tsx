import { useState, useEffect, useRef, useCallback } from 'react'
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
const MONO: React.CSSProperties = { background: s.bg, borderRadius: 6, padding: '8px 10px', fontFamily: s.mono, fontSize: 10, lineHeight: 1.5, overflow: 'auto', whiteSpace: 'pre-wrap' }

interface TokenState {
  accessToken: string
  refreshToken: string
  expiresAt: number
  rotationCount: number
}

function generateToken(prefix: string) {
  const rand = Math.random().toString(36).substring(2, 10)
  return `${prefix}_${rand}_${Date.now().toString(36)}`
}

const REFRESH_DELAY_MS = 5000

export default function OauthRefreshDemo() {
  const [tokens, setTokens] = useState<TokenState | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokensRef = useRef<TokenState | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const issueTokens = useCallback((prevRefresh?: string) => {
    const newTokens: TokenState = {
      accessToken: generateToken('at'),
      refreshToken: generateToken('rt'),
      expiresAt: Date.now() + REFRESH_DELAY_MS + 1000,
      rotationCount: tokens?.rotationCount ?? 0 + (prevRefresh ? 1 : 0),
    }
    setTokens(newTokens)
    tokensRef.current = newTokens
    setTimeLeft(REFRESH_DELAY_MS / 1000)
    setHistory(prev => {
      const msg = prevRefresh
        ? `Access token expired. Refresh token rotated: old="${prevRefresh.substring(0, 20)}...", new="${newTokens.refreshToken.substring(0, 20)}..."`
        : `Initial tokens issued: at=${newTokens.accessToken.substring(0, 20)}..., rt=${newTokens.refreshToken.substring(0, 20)}...`
      return [msg, ...prev].slice(0, 8)
    })
    return newTokens
  }, [tokens])

  const startCountdown = useCallback(() => {
    clearTimers()
    intervalRef.current = setInterval(() => {
      const current = tokensRef.current
      if (!current) return
      const remaining = Math.max(0, Math.round((current.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0 && autoRefresh && !isRefreshing) {
        setTokens(null)
        tokensRef.current = null
        clearTimers()
        doRefresh(current.refreshToken)
      }
    }, 200)
  }, [autoRefresh, isRefreshing])

  const doRefresh = useCallback(async (oldRefresh: string) => {
    if (isRefreshing) return
    setIsRefreshing(true)
    setHistory(prev => [`Refreshing tokens using refresh token: ${oldRefresh.substring(0, 20)}...`, ...prev].slice(0, 8))
    await new Promise(r => setTimeout(r, 800))
    const newTokens: TokenState = {
      accessToken: generateToken('at'),
      refreshToken: generateToken('rt'),
      expiresAt: Date.now() + REFRESH_DELAY_MS + 1000,
      rotationCount: (tokens?.rotationCount ?? 0) + 1,
    }
    setTokens(newTokens)
    tokensRef.current = newTokens
    setTimeLeft(REFRESH_DELAY_MS / 1000)
    setHistory(prev => {
      const msg = `Refresh complete. Old refresh token invalidated. New access_token issued (expires in ${REFRESH_DELAY_MS / 1000}s).`
      return [msg, ...prev].slice(0, 8)
    })
    setIsRefreshing(false)
  }, [isRefreshing, tokens])

  useEffect(() => {
    if (tokens) {
      startCountdown()
    }
    return clearTimers
  }, [tokens, startCountdown, clearTimers])

  const handleStart = () => {
    issueTokens()
  }

  const handleManualRefresh = () => {
    if (tokens) {
      clearTimers()
      setTokens(null)
      tokensRef.current = null
      doRefresh(tokens.refreshToken)
    }
  }

  const handleReset = () => {
    clearTimers()
    setTokens(null)
    tokensRef.current = null
    setTimeLeft(null)
    setIsRefreshing(false)
    setHistory([])
  }

  const expiryPct = tokens ? (timeLeft ?? 0) / (REFRESH_DELAY_MS / 1000) * 100 : 0

  return (
    <DemoBoundary name="OAuth Token Refresh with Rotation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Token Refresh with Rotation</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Access tokens have a short lifetime. When they expire, the client uses the refresh token to get a new access token without requiring the user to log in again. Refresh token rotation invalidates the old refresh token and issues a new one.
        </p>

        {!tokens && !isRefreshing ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <button onClick={handleStart} style={{
              background: s.accent, border: 'none', borderRadius: 10,
              padding: '12px 30px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
              Start Token Lifecycle
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1, background: s.bg3, borderRadius: 8, padding: 14 }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Access Token</div>
                <div style={{ ...MONO, color: s.accent, fontSize: 9, border: `1px solid ${s.border}` }}>
                  {tokens?.accessToken ?? '---'}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: s.text3, fontSize: 10 }}>TTL</span>
                    <span style={{ color: timeLeft !== null && timeLeft <= 0 ? s.red : s.green, fontFamily: s.mono, fontSize: 11, fontWeight: 700 }}>
                      {timeLeft !== null ? `${timeLeft}s` : '---'}
                    </span>
                  </div>
                  <div style={{ background: s.bg, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: expiryPct > 30 ? s.accent : s.red,
                      width: `${expiryPct}%`, transition: 'width 0.3s, background 0.3s',
                    }} />
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, background: s.bg3, borderRadius: 8, padding: 14 }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Refresh Token</div>
                <div style={{ ...MONO, color: s.purple, fontSize: 9, border: `1px solid ${s.border}` }}>
                  {tokens?.refreshToken ?? '---'}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>Rotation</div>
                  <div style={{ color: s.purple, fontFamily: s.mono, fontSize: 13, fontWeight: 700 }}>
                    {tokens?.rotationCount ?? 0} rotations
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.text2, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ accentColor: s.accent }} />
                Auto-refresh on expiry
              </label>
              {isRefreshing && (
                <div style={{ color: s.yellow, fontSize: 12, fontFamily: s.mono }}>
                  Refreshing...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleManualRefresh} disabled={isRefreshing} style={{
                background: isRefreshing ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
                padding: '8px 18px', color: isRefreshing ? s.text3 : '#fff',
                cursor: isRefreshing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
              }}>
                Refresh Now
              </button>
              <button onClick={handleReset} style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
                padding: '8px 18px', color: s.text2, cursor: 'pointer', fontSize: 13,
              }}>
                Reset
              </button>
            </div>
          </>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Event Log</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.map((msg, i) => (
                <div key={i} style={{
                  padding: '6px 10px', background: s.bg, borderRadius: 4,
                  color: i === 0 ? s.green : s.text2, fontSize: 11, fontFamily: s.mono, lineHeight: 1.5,
                }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
