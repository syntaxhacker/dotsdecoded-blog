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

const originalContent = `const config = {
  theme: "dark",
  fontSize: 14,
  showSidebar: true,
}`

const device1Edit = `const config = {
  theme: "dark",
  fontSize: 16,
  showSidebar: true,
}`

const device2Edit = `const config = {
  theme: "light",
  fontSize: 14,
  showSidebar: true,
}`

const device1Overlap = `const config = {
  theme: "dark",
  fontSize: 16,
  showSidebar: false,
}`

const device2Overlap = `const config = {
  theme: "light",
  fontSize: 14,
  showSidebar: true,
}`

const mergedNonOverlap = `const config = {
  theme: "light",
  fontSize: 16,
  showSidebar: true,
}`

export default function ConflictResolutionDemo() {
  const [mode, setMode] = useState<'non-overlapping' | 'overlapping'>('non-overlapping')
  const [step, setStep] = useState(0)

  const d1 = mode === 'non-overlapping' ? device1Edit : device1Overlap
  const d2 = mode === 'non-overlapping' ? device2Edit : device2Overlap

  const steps = [
    { label: 'Original file on server', show: [originalContent, ''] },
    { label: 'Device 1 edits (offline)', show: [d1, ''] },
    { label: 'Device 2 edits (offline)', show: [d1, d2] },
    { label: mode === 'non-overlapping' ? 'Auto-merge: combined changes' : 'Conflict: overlapping edits', show: [d1, d2, mode === 'non-overlapping' ? mergedNonOverlap : 'conflict copy created'] },
  ]

  const stepLabels = ['Step 1', 'Step 2', 'Step 3', 'Step 4']

  return (
    <DemoBoundary name="Conflict Resolution">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Conflict Resolution
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        When two devices edit the same file while offline, the server must reconcile their changes.
        Non-overlapping edits can be auto-merged. Overlapping edits create a conflict copy.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => { setMode('non-overlapping'); setStep(0) }}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: mode === 'non-overlapping' ? `${s.accent}20` : s.bg2,
            border: `1px solid ${mode === 'non-overlapping' ? s.accent : s.border}`,
            color: mode === 'non-overlapping' ? s.accent : s.text2,
          }}
        >
          Non-Overlapping (auto-merge)
        </button>
        <button
          onClick={() => { setMode('overlapping'); setStep(0) }}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: mode === 'overlapping' ? `${s.red}20` : s.bg2,
            border: `1px solid ${mode === 'overlapping' ? s.red : s.border}`,
            color: mode === 'overlapping' ? s.red : s.text2,
          }}
        >
          Overlapping (conflict copy)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {steps.map((st, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
              fontSize: 10, fontWeight: 600,
              background: step === i ? `${s.accent}20` : s.bg2,
              border: `1px solid ${step === i ? s.accent : s.border}`,
              color: step === i ? s.accent : s.text3,
            }}
          >
            {stepLabels[i]}
          </button>
        ))}
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 16, marginBottom: 16,
      }}>
        <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          {steps[step].label}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {step >= 0 && (
            <div style={{ flex: step >= 2 ? 1 : 'none', minWidth: step >= 2 ? 0 : '100%' }}>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>Server Version</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                padding: 10, fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, color: s.text, whiteSpace: 'pre',
              }}>
                {mode === 'non-overlapping'
                  ? (step === 0 ? originalContent : step === 3 ? mergedNonOverlap : originalContent)
                  : (step === 0 ? originalContent : step === 3 ? 'Two conflict copies created' : originalContent)
                }
              </div>
            </div>
          )}
          {step >= 1 && (
            <div style={{ flex: 1 }}>
              <div style={{ color: s.accent, fontSize: 10, marginBottom: 4 }}>Device 1 Edit</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.accent}`, borderRadius: 6,
                padding: 10, fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, color: s.text, whiteSpace: 'pre',
              }}>
                {d1}
              </div>
              {step >= 1 && step <= 2 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  <span style={{ color: s.green, fontSize: 10, fontFamily: s.mono }}>+ fontSize: 16</span>
                  {mode === 'overlapping' && <span style={{ color: s.red, fontSize: 10, fontFamily: s.mono }}>~ showSidebar: false</span>}
                </div>
              )}
            </div>
          )}
          {step >= 2 && (
            <div style={{ flex: 1 }}>
              <div style={{ color: s.yellow, fontSize: 10, marginBottom: 4 }}>Device 2 Edit</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.yellow}`, borderRadius: 6,
                padding: 10, fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, color: s.text, whiteSpace: 'pre',
              }}>
                {d2}
              </div>
              {step >= 1 && step <= 2 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  <span style={{ color: s.green, fontSize: 10, fontFamily: s.mono }}>+ theme: "light"</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 16, marginBottom: 16,
      }}>
        <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Resolution
        </div>
        {step === 3 ? (
          <div>
            {mode === 'non-overlapping' ? (
              <div style={{ color: s.green, fontSize: 13 }}>
                Auto-merge successful. Both changes applied: theme and fontSize updated.
              </div>
            ) : (
              <div>
                <div style={{ color: s.red, fontSize: 13, marginBottom: 8 }}>
                  Conflict detected! Both devices modified <span style={{ fontFamily: s.mono }}>showSidebar</span>.
                </div>
                <div style={{
                  background: s.bg, border: `1px solid ${s.red}`, borderRadius: 6,
                  padding: 10, fontFamily: s.mono, fontSize: 11, color: s.text,
                }}>
                  {`config (Device A's conflicted copy 2026-05-15).js`}
                  <br />
                  {`config (Device B's conflicted copy 2026-05-15).js`}
                </div>
                <div style={{ color: s.text2, fontSize: 12, marginTop: 8 }}>
                  Both versions are saved. User manually resolves and keeps the desired one.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: s.text3, fontSize: 12 }}>Continue stepping through to see the resolution.</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: step === 0 ? s.text3 : s.text2, cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
          }}
        >
          Back
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}
        >
          Next Step
        </button>
      </div>
    </div>
    </DemoBoundary>
  )
}
