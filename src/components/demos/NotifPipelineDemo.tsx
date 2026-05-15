import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

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

const pipelineSteps = [
  {
    id: 'request', label: 'Notification Request', icon: 'IN',
    desc: 'API receives create-notification payload with channel, recipient, template, and variables.',
    detail: 'POST /api/v1/notifications with channel, recipient_id, template_id, variables dict.',
    color: s.accent,
  },
  {
    id: 'validate', label: 'Validate', icon: 'V',
    desc: 'Check recipient exists, channel is valid, template exists, and payload shape is correct.',
    detail: 'Validate JSON schema, check recipient opt-in status, verify template_id references a published template.',
    color: s.green,
  },
  {
    id: 'enrich', label: 'Enrich', icon: 'E',
    desc: 'Augment payload with user data: timezone, locale, preferred channels, device tokens.',
    detail: 'Join against user-service to get locale, timezone, device tokens, and quiet-hours configuration.',
    color: s.purple,
  },
  {
    id: 'render', label: 'Template Render', icon: 'T',
    desc: 'Render the notification body using the template engine with user variables.',
    detail: 'Liquid/Jinja template substitution: {{username}} -> "Alice", {{action}} -> "commented".',
    color: s.orange,
  },
  {
    id: 'route', label: 'Channel Routing', icon: 'R',
    desc: 'Route to correct channel handler based on type and user preferences.',
    detail: 'Check user prefs: push enabled? SMS enabled? Quiet hours active? Selected channel matches type?',
    color: s.yellow,
  },
  {
    id: 'ratelimit', label: 'Rate Limit', icon: 'L',
    desc: 'Check per-channel rate limiter. Reject or queue if over limit.',
    detail: 'Token bucket per user per channel: 5 push/min, 3 SMS/min, 10 email/min. 429 if exceeded.',
    color: s.red,
  },
  {
    id: 'send', label: 'Send', icon: 'S',
    desc: 'Dispatch via channel provider (APNS, SendGrid, Twilio). Track delivery ID.',
    detail: 'Call external provider API. Record provider_message_id, timestamp, and initial status (pending).',
    color: s.green,
  },
  {
    id: 'track', label: 'Track Delivery', icon: 'D',
    desc: 'Log delivery status. If webhook/callback arrives, update status to delivered/failed.',
    detail: 'Store delivery status in DB with provider_message_id. Watch for provider callbacks or poll status.',
    color: s.accent,
  },
  {
    id: 'retry', label: 'Retry on Failure', icon: 'X',
    desc: 'If delivery fails, retry with exponential backoff: 1min, 5min, 15min, 1hr. Max 4 retries.',
    detail: 'Move to retry queue. Backoff: 60s, 300s, 900s, 3600s. After 4 failures, move to DLQ.',
    color: s.orange,
  },
]

export default function NotifPipelineDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const stop = useCallback(() => {
    setIsPlaying(false)
    setActiveStep(-1)
  }, [])

  const play = useCallback(() => {
    if (isPlaying) { stop(); return }
    setActiveStep(0)
    setIsPlaying(true)
  }, [isPlaying, stop])

  useEffect(() => {
    if (!isPlaying) return
    if (activeStep >= pipelineSteps.length - 1) {
      setIsPlaying(false)
      return
    }
    const timer = setTimeout(() => {
      setActiveStep(prev => prev + 1)
    }, getStepDelay(1000, speed))
    return () => clearTimeout(timer)
  }, [isPlaying, activeStep, speed])

  const stepForward = () => {
    if (isPlaying) return
    setActiveStep(prev => Math.min(prev + 1, pipelineSteps.length - 1))
  }

  const stepBack = () => {
    if (isPlaying) return
    setActiveStep(prev => Math.max(prev - 1, -1))
  }

  const currentStep = activeStep >= 0 ? pipelineSteps[activeStep] : null

  return (
    <DemoBoundary name="Notification Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={H}>Notification Pipeline</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click Play to watch a notification flow through the pipeline step by step. Use the speed controller and manual step controls.
        </p>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20,
          justifyContent: 'center',
        }}>
          {pipelineSteps.map((st, i) => (
            <div key={st.id} onClick={() => { if (!isPlaying) setActiveStep(i) }} style={{
              background: activeStep === i ? `${st.color}25` : activeStep > i ? `${st.color}15` : s.bg,
              border: `1px solid ${activeStep === i ? st.color : activeStep > i ? `${st.color}50` : s.border}`,
              borderRadius: 8, padding: '6px 12px', cursor: isPlaying ? 'default' : 'pointer',
              textAlign: 'center', transition: 'all 0.3s', minWidth: 70,
              opacity: activeStep >= i ? 1 : 0.5,
            }}>
              <div style={{
                color: activeStep === i ? st.color : activeStep > i ? st.color : s.text3,
                fontSize: 16, fontWeight: 700, fontFamily: s.mono,
              }}>{st.icon}</div>
              <div style={{
                color: activeStep === i ? s.text : activeStep > i ? s.text2 : s.text3,
                fontSize: 10, marginTop: 2, whiteSpace: 'nowrap',
              }}>{st.label}</div>
            </div>
          ))}
        </div>

        {currentStep && (
          <div style={{
            background: s.bg, border: `1px solid ${currentStep.color}`,
            borderRadius: 10, padding: 16, marginBottom: 20,
            borderLeft: `3px solid ${currentStep.color}`,
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                background: currentStep.color, borderRadius: 6, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: s.mono,
              }}>{currentStep.icon}</div>
              <div style={{ color: currentStep.color, fontSize: 15, fontWeight: 700 }}>
                Step {activeStep + 1}: {currentStep.label}
              </div>
            </div>
            <p style={{ color: s.text2, fontSize: 13, margin: '0 0 8px 0', lineHeight: 1.5 }}>
              {currentStep.desc}
            </p>
            <div style={{
              background: s.bg2, borderRadius: 6, padding: '8px 12px',
              fontFamily: s.mono, fontSize: 11, color: s.text3,
              lineHeight: 1.5,
            }}>
              {currentStep.detail}
            </div>
          </div>
        )}

        {!currentStep && (
          <div style={{
            background: s.bg, border: `1px dashed ${s.border}`,
            borderRadius: 10, padding: 24, marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ color: s.text3, fontSize: 13 }}>
              Click a step or press Play to start walking through the pipeline.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={stepBack} disabled={isPlaying} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: isPlaying ? s.text3 : s.text2, cursor: isPlaying ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: isPlaying ? 0.5 : 1,
          }}>Previous</button>
          <button onClick={play} style={{
            background: isPlaying ? s.red : s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>{isPlaying ? 'Stop' : 'Play'}</button>
          <button onClick={stepForward} disabled={isPlaying} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: isPlaying ? s.text3 : s.text2, cursor: isPlaying ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: isPlaying ? 0.5 : 1,
          }}>Next</button>
        </div>

        {activeStep >= 0 && (
          <div style={{
            marginTop: 8, borderTop: `1px solid ${s.border}`, paddingTop: 12,
            textAlign: 'center',
          }}>
            <span style={{ color: s.text3, fontSize: 11 }}>
              Step {activeStep + 1} of {pipelineSteps.length}
            </span>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
