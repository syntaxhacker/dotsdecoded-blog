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

const channels = [
  { id: 'push', label: 'Push Notification', desc: 'APNS (iOS) / FCM (Android)', color: s.accent },
  { id: 'email', label: 'Email', desc: 'SMTP / SendGrid / SES', color: s.green },
  { id: 'sms', label: 'SMS', desc: 'Twilio / Vonage / AWS SNS', color: s.yellow },
  { id: 'inapp', label: 'In-App', desc: 'WebSocket / SSE / Polling', color: s.purple },
]

const notifTypes = [
  { id: 'transactional', label: 'Transactional', examples: 'Password reset, order confirmation, payment receipt' },
  { id: 'promotional', label: 'Promotional', examples: 'Flash sale, new feature, weekly digest' },
  { id: 'alert', label: 'Alert', examples: 'Service outage, fraud detection, threshold breach' },
]

const requirements = [
  { label: 'Multi-channel delivery', cat: 'functional' },
  { label: 'Template rendering', cat: 'functional' },
  { label: 'User preferences / opt-in/out', cat: 'functional' },
  { label: 'Rate limiting per channel', cat: 'functional' },
  { label: 'Delivery tracking', cat: 'functional' },
  { label: 'High availability', cat: 'non-func' },
  { label: 'Low latency delivery', cat: 'non-func' },
  { label: 'At-least-once delivery', cat: 'non-func' },
  { label: 'Handle 10M+ notifications/day', cat: 'non-func' },
  { label: 'Deduplication', cat: 'non-func' },
]

export default function NotifRequirementsDemo() {
  const [selectedChannel, setSelectedChannel] = useState('push')
  const [selectedType, setSelectedType] = useState('transactional')
  const [checkedReqs, setCheckedReqs] = useState<Record<string, boolean>>({})

  const toggleReq = (label: string) => {
    setCheckedReqs(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const chan = channels.find(c => c.id === selectedChannel)!
  const ntype = notifTypes.find(t => t.id === selectedType)!

  return (
    <DemoBoundary name="Notification Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Notification System Requirements</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click through the checklist to track which requirements are covered. Select channels and notification types.
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Delivery Channels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {channels.map(ch => (
                <button key={ch.id} onClick={() => setSelectedChannel(ch.id)} style={{
                  background: selectedChannel === ch.id ? `${ch.color}20` : s.bg,
                  border: `1px solid ${selectedChannel === ch.id ? ch.color : s.border}`,
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s',
                }}>
                  <div style={{ color: selectedChannel === ch.id ? ch.color : s.text, fontSize: 13, fontWeight: 600 }}>{ch.label}</div>
                  <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>{ch.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Notification Types</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {notifTypes.map(nt => (
                <button key={nt.id} onClick={() => setSelectedType(nt.id)} style={{
                  background: selectedType === nt.id ? `${s.accent}20` : s.bg,
                  border: `1px solid ${selectedType === nt.id ? s.accent : s.border}`,
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s',
                }}>
                  <div style={{ color: selectedType === nt.id ? s.accent : s.text, fontSize: 13, fontWeight: 600 }}>{nt.label}</div>
                  <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>{nt.examples}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Selected Details</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: s.bg2, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 140 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase' }}>Channel</div>
              <div style={{ color: chan.color, fontSize: 14, fontWeight: 600, fontFamily: s.mono }}>{chan.label}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>{chan.desc}</div>
            </div>
            <div style={{ background: s.bg2, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 140 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase' }}>Type</div>
              <div style={{ color: s.accent, fontSize: 14, fontWeight: 600, fontFamily: s.mono }}>{ntype.label}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>{ntype.examples}</div>
            </div>
          </div>
        </div>

        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Requirements Checklist</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {requirements.map(req => (
            <label key={req.label} onClick={() => toggleReq(req.label)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
              borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
              background: checkedReqs[req.label] ? `${s.green}08` : 'transparent',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: checkedReqs[req.label] ? s.green : s.bg3,
                border: `2px solid ${checkedReqs[req.label] ? s.green : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {checkedReqs[req.label] && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: checkedReqs[req.label] ? s.text : s.text2, fontSize: 13 }}>{req.label}</span>
                <span style={{
                  color: s.text3, fontSize: 10, marginLeft: 8, textTransform: 'uppercase',
                  background: req.cat === 'functional' ? `${s.accent}20` : `${s.purple}20`,
                  padding: '1px 6px', borderRadius: 4,
                }}>{req.cat === 'functional' ? 'F' : 'NF'}</span>
              </div>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>
            Covered: {Object.values(checkedReqs).filter(Boolean).length}/{requirements.length}
          </div>
          <div style={{ background: s.bg, borderRadius: 6, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${(Object.values(checkedReqs).filter(Boolean).length / requirements.length) * 100}%`,
              height: '100%', background: s.green, borderRadius: 6, transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
