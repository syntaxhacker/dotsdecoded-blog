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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const notificationTypes = [
  { id: 'comments', label: 'Comments', desc: 'Someone replies to your post or comment' },
  { id: 'likes', label: 'Likes', desc: 'Someone likes your content' },
  { id: 'follows', label: 'Follows', desc: 'Someone follows your account' },
  { id: 'messages', label: 'Messages', desc: 'Someone sends you a direct message' },
  { id: 'mentions', label: 'Mentions', desc: 'Someone mentions you in a post' },
  { id: 'system', label: 'System Updates', desc: 'Policy changes, maintenance notices' },
  { id: 'promotions', label: 'Promotions', desc: 'Special offers, new features' },
  { id: 'security', label: 'Security Alerts', desc: 'Login from new device, password changed' },
]

const channels = [
  { id: 'push', label: 'Push', icon: 'P', color: s.accent },
  { id: 'email', label: 'Email', icon: 'E', color: s.green },
  { id: 'sms', label: 'SMS', icon: 'S', color: s.yellow },
  { id: 'inapp', label: 'In-App', icon: 'I', color: s.purple },
]

export default function NotifPreferencesDemo() {
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('08:00')
  const [quietEnabled, setQuietEnabled] = useState(true)
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {}
    notificationTypes.forEach(nt => {
      initial[nt.id] = {}
      channels.forEach(ch => {
        initial[nt.id][ch.id] = ch.id === 'push' || ch.id === 'inapp'
      })
    })
    initial.security.email = true
    initial.security.sms = true
    initial.system.email = true
    initial.messages.push = true
    initial.messages.email = true
    initial.messages.inapp = true
    return initial
  })

  const [testNotifType, setTestNotifType] = useState('comments')
  const [testChannel, setTestChannel] = useState<'push' | 'email' | 'sms' | 'inapp'>('push')
  const [testResult, setTestResult] = useState<{ allowed: boolean; reason: string } | null>(null)

  const togglePref = (typeId: string, channelId: string) => {
    setPrefs(prev => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [channelId]: !prev[typeId][channelId],
      },
    }))
  }

  const runTest = () => {
    const channelPref = prefs[testNotifType]?.[testChannel]
    if (!channelPref) {
      setTestResult({ allowed: false, reason: 'Channel is disabled for this notification type in user preferences.' })
      return
    }
    if (quietEnabled) {
      const now = new Date()
      const startParts = quietStart.split(':').map(Number)
      const endParts = quietEnd.split(':').map(Number)
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const startMinutes = startParts[0] * 60 + startParts[1]
      const endMinutes = endParts[0] * 60 + endParts[1]

      let isQuietHours = false
      if (startMinutes <= endMinutes) {
        isQuietHours = nowMinutes >= startMinutes && nowMinutes < endMinutes
      } else {
        isQuietHours = nowMinutes >= startMinutes || nowMinutes < endMinutes
      }

      if (isQuietHours && testChannel === 'push') {
        setTestResult({ allowed: false, reason: 'Quiet hours are active (push notifications are suppressed).' })
        return
      }
      if (isQuietHours && testChannel === 'sms') {
        setTestResult({ allowed: false, reason: 'Quiet hours are active (SMS notifications are suppressed).' })
        return
      }
    }
    setTestResult({ allowed: true, reason: 'Notification allowed. Preference is enabled and not in quiet hours.' })
  }

  return (
    <DemoBoundary name="Notification Preferences">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>User Notification Preferences</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Configure which notification types go to which channel. Toggle quiet hours and test a notification to see how preferences filter delivery.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Notification Types</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
                <div style={{ flex: 1 }} />
                {channels.map(ch => (
                  <div key={ch.id} style={{ width: 44, textAlign: 'center', color: ch.color, fontSize: 10, fontWeight: 600 }}>{ch.label}</div>
                ))}
              </div>
              {notificationTypes.map(nt => (
                <div key={nt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                  borderRadius: 4, transition: 'background 0.15s',
                  background: testNotifType === nt.id ? `${s.accent}10` : 'transparent',
                }}>
                  <div style={{ flex: 1, fontSize: 12, color: s.text }}>{nt.label}</div>
                  {channels.map(ch => {
                    const isOn = prefs[nt.id]?.[ch.id]
                    return (
                      <button key={ch.id} onClick={() => togglePref(nt.id, ch.id)} style={{
                        width: 44, height: 28, borderRadius: 6, cursor: 'pointer',
                        background: isOn ? `${ch.color}20` : s.bg,
                        border: `1px solid ${isOn ? ch.color : s.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: 3,
                          background: isOn ? ch.color : 'transparent',
                          border: `2px solid ${isOn ? ch.color : s.text3}`,
                          transition: 'all 0.2s',
                        }} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 1, background: s.border, alignSelf: 'stretch' }} />

          <div style={{ width: 260 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Quiet Hours</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: quietEnabled ? s.accent : s.bg3,
                  border: `2px solid ${quietEnabled ? s.accent : s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {quietEnabled && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ color: s.text2, fontSize: 12 }}>Enable</span>
              </label>
            </div>
            {quietEnabled && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>From</div>
                  <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} style={{
                    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                    padding: '4px 8px', color: s.text, fontSize: 12, fontFamily: s.mono,
                  }} />
                </div>
                <div>
                  <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>To</div>
                  <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} style={{
                    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                    padding: '4px 8px', color: s.text, fontSize: 12, fontFamily: s.mono,
                  }} />
                </div>
              </div>
            )}

            <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 12, marginTop: 8 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Test Notification</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                <select value={testNotifType} onChange={e => setTestNotifType(e.target.value)} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '6px 8px', color: s.text, fontSize: 12,
                }}>
                  {notificationTypes.map(nt => (
                    <option key={nt.id} value={nt.id}>{nt.label}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 4 }}>
                  {channels.map(ch => (
                    <button key={ch.id} onClick={() => setTestChannel(ch.id)} style={{
                      flex: 1, padding: '6px 0', borderRadius: 6, cursor: 'pointer',
                      background: testChannel === ch.id ? `${ch.color}20` : s.bg,
                      border: `1px solid ${testChannel === ch.id ? ch.color : s.border}`,
                      color: testChannel === ch.id ? ch.color : s.text2, fontSize: 11, fontWeight: 600,
                    }}>{ch.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={runTest} style={{
                width: '100%', background: s.accent, border: 'none', borderRadius: 6,
                padding: '8px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Test Notification</button>
              {testResult && (
                <div style={{
                  marginTop: 8, padding: '8px 10px', borderRadius: 6,
                  background: testResult.allowed ? `${s.green}15` : `${s.red}15`,
                  border: `1px solid ${testResult.allowed ? s.green : s.red}`,
                }}>
                  <div style={{
                    color: testResult.allowed ? s.green : s.red,
                    fontSize: 12, fontWeight: 600, marginBottom: 2,
                  }}>{testResult.allowed ? 'ALLOWED' : 'BLOCKED'}</div>
                  <div style={{ color: s.text2, fontSize: 11 }}>{testResult.reason}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>How Preferences Filter</div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
            Before sending, the system checks: (1) is the notification type enabled for this channel? (2) are quiet hours active? (3) is the channel rate-limited? If any check fails, the notification is either queued or dropped.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
