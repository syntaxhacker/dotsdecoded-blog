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

interface Cell {
  label: string
  color: string
  detail?: string
}

interface Row {
  label: string
  cells: Cell[]
  detail: string
}

const headers = ['Factor', 'WebAuthn', 'Passkeys', 'TOTP', 'SMS OTP', 'Passwords']

const rows: Row[] = [
  {
    label: 'Phishing Resistance',
    detail: 'Prevents fake login page attacks',
    cells: [
      { label: 'High', color: s.green, detail: 'Challenge-response, bound to origin' },
      { label: 'High', color: s.green, detail: 'Same as WebAuthn + sync' },
      { label: 'Low', color: s.red, detail: 'Codes can be phished via fake sites' },
      { label: 'Low', color: s.red, detail: 'SMS interception, SIM swap' },
      { label: 'None', color: s.red, detail: 'Trivially phished' },
    ],
  },
  {
    label: 'Usability',
    detail: 'Ease of daily use',
    cells: [
      { label: 'Medium', color: s.yellow, detail: 'Requires authenticator per device' },
      { label: 'High', color: s.green, detail: 'Biometric + sync, seamless' },
      { label: 'Medium', color: s.yellow, detail: 'Type 6-digit code' },
      { label: 'Low', color: s.red, detail: 'Wait for SMS, type code' },
      { label: 'High', color: s.green, detail: 'Type password (if remembered)' },
    ],
  },
  {
    label: 'Setup Cost',
    detail: 'Effort to enable',
    cells: [
      { label: 'Low', color: s.green, detail: 'Built into browsers and devices' },
      { label: 'Low', color: s.green, detail: 'Auto-synced after creation' },
      { label: 'Medium', color: s.yellow, detail: 'Install app, scan QR, enter seed' },
      { label: 'Low', color: s.green, detail: 'Phone number required' },
      { label: 'None', color: s.green, detail: 'No extra setup needed' },
    ],
  },
  {
    label: 'Recovery',
    detail: 'Restoring access after loss',
    cells: [
      { label: 'Complex', color: s.red, detail: 'Need backup authenticator or codes' },
      { label: 'Simple', color: s.green, detail: 'Cloud account recovery (iCloud/Google)' },
      { label: 'Complex', color: s.red, detail: 'Must re-enroll all apps' },
      { label: 'Complex', color: s.red, detail: 'Carrier-dependent, slow' },
      { label: 'Simple', color: s.green, detail: 'Reset password via email' },
    ],
  },
  {
    label: 'Sync',
    detail: 'Available across devices',
    cells: [
      { label: 'No', color: s.red, detail: 'Tied to one device' },
      { label: 'Yes', color: s.green, detail: 'iCloud Keychain, Google PM' },
      { label: 'No', color: s.red, detail: 'Per-device TOTP seeds' },
      { label: 'No', color: s.red, detail: 'Tied to phone number' },
      { label: 'Manual', color: s.yellow, detail: 'Password manager or memory' },
    ],
  },
  {
    label: 'Security Level',
    detail: 'Overall protection',
    cells: [
      { label: 'Very High', color: s.green, detail: 'Public key crypto, no shared secrets' },
      { label: 'Very High', color: s.green, detail: 'Same crypto + cloud backup' },
      { label: 'Medium', color: s.yellow, detail: 'Shared secret, time-based' },
      { label: 'Low', color: s.red, detail: 'SS7 attacks, SIM swap' },
      { label: 'Varies', color: s.yellow, detail: 'Depends on strength & hygiene' },
    ],
  },
]

const ratingBars: Record<string, { label: string; color: string; pct: number }[]> = {
  'WebAuthn (Passwordless)': [
    { label: 'Security', color: s.green, pct: 95 },
    { label: 'Usability', color: s.yellow, pct: 65 },
    { label: 'Recovery', color: s.red, pct: 35 },
  ],
  'Passkeys': [
    { label: 'Security', color: s.green, pct: 95 },
    { label: 'Usability', color: s.green, pct: 90 },
    { label: 'Recovery', color: s.green, pct: 80 },
  ],
  'TOTP': [
    { label: 'Security', color: s.yellow, pct: 60 },
    { label: 'Usability', color: s.yellow, pct: 55 },
    { label: 'Recovery', color: s.red, pct: 30 },
  ],
  'SMS OTP': [
    { label: 'Security', color: s.red, pct: 25 },
    { label: 'Usability', color: s.yellow, pct: 50 },
    { label: 'Recovery', color: s.red, pct: 30 },
  ],
  'Passwords': [
    { label: 'Security', color: s.yellow, pct: 40 },
    { label: 'Usability', color: s.green, pct: 80 },
    { label: 'Recovery', color: s.green, pct: 75 },
  ],
}

const methodKeys = ['WebAuthn (Passwordless)', 'Passkeys', 'TOTP', 'SMS OTP', 'Passwords']

export default function WebauthnComparisonDemo() {
  const [selected, setSelected] = useState('Passkeys')
  const bars = ratingBars[selected] || ratingBars['Passkeys']

  return (
    <DemoBoundary name="Auth Method Comparison">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: 13,
        }}>
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '12px 10px',
                  color: h === 'Factor' ? s.text3 : s.accent,
                  fontWeight: h === 'Factor' ? 600 : 700,
                  borderBottom: `2px solid ${s.border}`,
                  fontSize: h === 'Factor' ? 12 : 13,
                  textTransform: h === 'Factor' ? 'uppercase' : 'none',
                  letterSpacing: h === 'Factor' ? 1 : 0,
                  whiteSpace: 'nowrap',
                }}>
                  {h === 'Factor' ? 'Factor' : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td style={{
                  padding: '12px 10px', borderBottom: `1px solid ${s.border2}`,
                  color: s.text2, fontSize: 12, fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  <div>{row.label}</div>
                  <div style={{ color: s.text3, fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                    {row.detail}
                  </div>
                </td>
                {row.cells.map((cell, i) => (
                  <td key={i} style={{
                    padding: '12px 10px', borderBottom: `1px solid ${s.border2}`,
                  }}>
                    <div style={{
                      display: 'inline-block',
                      background: `${cell.color}15`,
                      color: cell.color,
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: s.mono,
                    }}>
                      {cell.label}
                    </div>
                    {cell.detail && (
                      <div style={{ color: s.text3, fontSize: 10, marginTop: 4, lineHeight: 1.3 }}>
                        {cell.detail}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 28, borderTop: `1px solid ${s.border}`, paddingTop: 20 }}>
        <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          Score Breakdown
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {methodKeys.map(m => (
            <button key={m} onClick={() => setSelected(m)} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${selected === m ? s.accent : s.border}`,
              background: selected === m ? `${s.accent}15` : 'transparent',
              color: selected === m ? s.accent : s.text2, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bars.map(bar => (
            <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 70, color: s.text2, fontSize: 12, fontWeight: 500 }}>{bar.label}</div>
              <div style={{
                flex: 1, height: 24, background: s.bg2, borderRadius: 6,
                overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  width: `${bar.pct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`,
                  borderRadius: 6, transition: 'width 0.4s ease',
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                  color: '#000', fontSize: 11, fontWeight: 700,
                }}>
                  {bar.pct >= 30 ? bar.pct : ''}
                </div>
              </div>
              <div style={{ minWidth: 30, color: bar.color, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>
                {bar.pct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Strong</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.yellow }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Weak</span>
          </div>
        </div>
        <div style={{ color: s.text3, fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
          Passkeys provide the best balance of security and usability thanks to cryptographic authentication combined with cross-device sync.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
