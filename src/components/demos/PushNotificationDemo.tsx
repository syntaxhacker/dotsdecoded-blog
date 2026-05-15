import { useState, useEffect, useCallback, useRef } from 'react'
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

type Step = 'register' | 'send' | 'deliver' | 'receive' | null

const phases: { id: Step; label: string; desc: string; origin: string; dest: string }[] = [
  { id: 'register', label: 'Register Token', desc: 'App requests device token from APNS/FCM and sends it to your server.', origin: 'Mobile App', dest: 'App Server' },
  { id: 'send', label: 'Send Push', desc: 'App server calls FCM/APNS HTTP API with target token and payload.', origin: 'App Server', dest: 'Push Gateway' },
  { id: 'deliver', label: 'Deliver', desc: 'Push gateway routes the notification to the device via persistent connection.', origin: 'Push Gateway', dest: 'Mobile Device' },
  { id: 'receive', label: 'Receive', desc: 'Device receives the push payload and displays it in the notification tray.', origin: 'Mobile Device', dest: 'OS Notification Tray' },
]

export default function PushNotificationDemo() {
  const [step, setStep] = useState<Step>(null)
  const [animating, setAnimating] = useState(false)
  const [token, setToken] = useState('')
  const [stepIdx, setStepIdx] = useState(-1)
  const [dots, setDots] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const runStepSequence = useCallback(() => {
    if (animating) return
    setAnimating(true)
    setStepIdx(0)
    setToken('')
    setDots('')

    const steps: Step[] = ['register', 'send', 'deliver', 'receive']
    let i = 0
    setStep(steps[0])

    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    intervalRef.current = dotInterval

    const advance = () => {
      i++
      if (i < steps.length) {
        setStep(steps[i])
        setStepIdx(i)
        if (steps[i] === 'send') setToken('dGhpcyBpcyBhIHRva2Vu')
        setTimeout(advance, 1200)
      } else {
        clearInterval(dotInterval)
        intervalRef.current = null
        setDots('')
        setAnimating(false)
      }
    }
    setTimeout(advance, 1200)
  }, [animating])

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setStep(null)
    setAnimating(false)
    setToken('')
    setStepIdx(-1)
    setDots('')
  }

  const posX = (idx: number) => {
    const start = 0
    const end = 100
    if (stepIdx < 0) return start
    if (idx <= stepIdx) return end
    const ratio = (idx - stepIdx) / (phases.length - stepIdx)
    return start + (end - start) * (1 - ratio)
  }

  return (
    <DemoBoundary name="Push Notification Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Push Notification Delivery</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Watch how a push notification travels from your app server through FCM/APNS to the device.
        </p>

        <div style={{ position: 'relative', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 16px', marginBottom: 20, minHeight: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
            {['App Server', 'Push Gateway', 'Mobile Device', 'Notification Tray'].map((label, i) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: stepIdx >= i ? 1 : 0.4,
                transition: 'opacity 0.5s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: stepIdx >= i ? `${s.accent}25` : s.bg3,
                  border: `2px solid ${stepIdx >= i ? s.accent : s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.3s',
                }}>
                  {i === 0 && 'S'}
                  {i === 1 && 'G'}
                  {i === 2 && 'D'}
                  {i === 3 && 'N'}
                </div>
                <div style={{ color: stepIdx >= i ? s.text : s.text3, fontSize: 10, textAlign: 'center', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', height: 4, background: s.bg3, borderRadius: 2, marginBottom: 16 }}>
            {(stepIdx >= 0) && (
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${(stepIdx + 1) * 25}%`,
                background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                borderRadius: 2, transition: 'width 0.8s ease',
              }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {phases.map((ph, i) => (
              <div key={ph.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                borderRadius: 6,
                background: stepIdx === i ? `${ph.id === 'register' ? s.accent : ph.id === 'send' ? s.green : ph.id === 'deliver' ? s.orange : s.purple}15` : 'transparent',
                border: `1px solid ${stepIdx === i ? (ph.id === 'register' ? s.accent : ph.id === 'send' ? s.green : ph.id === 'deliver' ? s.orange : s.purple) : 'transparent'}`,
                transition: 'all 0.4s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: stepIdx >= i ? (ph.id === 'register' ? s.accent : ph.id === 'send' ? s.green : ph.id === 'deliver' ? s.orange : s.purple) : s.bg3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 700,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: stepIdx >= i ? s.text : s.text3, fontSize: 13, fontWeight: 600 }}>{ph.label}</div>
                  <div style={{ color: s.text3, fontSize: 11 }}>{ph.desc}</div>
                </div>
                {stepIdx === i && (
                  <div style={{
                    background: s.bg3, borderRadius: 4, padding: '2px 8px',
                    fontFamily: s.mono, fontSize: 10, color: s.text3,
                  }}>{dots}</div>
                )}
              </div>
            ))}
          </div>

          {token && (
            <div style={{
              marginTop: 12, background: s.bg3, borderRadius: 6, padding: '6px 10px',
              fontFamily: s.mono, fontSize: 10, color: s.text3, wordBreak: 'break-all',
            }}>
              Token: {token}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} disabled={!animating && step === null} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: (!animating && step === null) ? s.text3 : s.text2,
            cursor: (!animating && step === null) ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: (!animating && step === null) ? 0.5 : 1,
          }}>Reset</button>
          <button onClick={runStepSequence} disabled={animating} style={{
            background: animating ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: animating ? s.text3 : '#fff', cursor: animating ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>{animating ? 'Animating...' : 'Animate Push Delivery'}</button>
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Components</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'FCM', desc: 'Firebase Cloud Messaging (Android)', color: s.green },
              { label: 'APNS', desc: 'Apple Push Notification Service (iOS)', color: s.accent },
              { label: 'Device Token', desc: 'Unique per device, used as routing address', color: s.yellow },
              { label: 'Push Payload', desc: 'JSON with alert, badge, sound, data fields', color: s.orange },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 12, fontWeight: 600, minWidth: 60 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 11 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
