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

const platformData = {
  name: 'Platform Authenticator',
  tagline: 'Built into your device (TPM, Secure Enclave, TEE)',
  examples: [
    { name: 'Touch ID', icon: 'fingerprint', detail: 'Apple MacBook / iPhone' },
    { name: 'Windows Hello', icon: 'face', detail: 'Windows PC with IR camera' },
    { name: 'Face ID', icon: 'lock', detail: 'iPhone / iPad' },
    { name: 'Android Biometric', icon: 'smartphone', detail: 'Android fingerprint / face' },
  ],
  sync: [
    { provider: 'iCloud Keychain', desc: 'Syncs across Apple devices (Mac, iPhone, iPad)' },
    { provider: 'Google Password Manager', desc: 'Syncs across Android and Chrome on any OS' },
    { provider: 'Windows Hello', desc: 'Tied to device, no cloud sync' },
  ],
  features: [
    { label: 'User Verification', ok: true },
    { label: 'Phishing Resistant', ok: true },
    { label: 'Portable Across Devices', ok: false },
    { label: 'No Extra Hardware', ok: true },
    { label: 'Requires Cloud Sync', ok: false },
  ],
}

const crossData = {
  name: 'Cross-Platform Authenticator',
  tagline: 'External hardware security keys or phones',
  examples: [
    { name: 'YubiKey USB/NFC', icon: 'usb', detail: 'FIDO2 / U2F security key' },
    { name: 'Phone as Passkey', icon: 'bluetooth', detail: 'Use phone via BLE / NFC' },
    { name: 'SoloKey', icon: 'usb', detail: 'Open-source FIDO2 key' },
    { name: 'Google Titan Key', icon: 'usb', detail: 'Google hardware security key' },
  ],
  sync: [
    { provider: 'Phone-linked', desc: 'Credential lives on phone, shared via QR / BLE' },
    { provider: 'USB key', desc: 'Plug into any device, no sync needed' },
    { provider: 'NFC', desc: 'Tap phone to computer, ephemeral connection' },
  ],
  features: [
    { label: 'User Verification', ok: true },
    { label: 'Phishing Resistant', ok: true },
    { label: 'Portable Across Devices', ok: true },
    { label: 'No Extra Hardware', ok: false },
    { label: 'Requires Cloud Sync', ok: true },
  ],
}

const buttons = [
  { id: 'platform', label: 'Platform' },
  { id: 'cross', label: 'Cross-Platform' },
]

export default function WebauthnTypesDemo() {
  const [active, setActive] = useState<'platform' | 'cross'>('platform')
  const data = active === 'platform' ? platformData : crossData

  return (
    <DemoBoundary name="Authenticator Types">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: `1px solid ${s.border}` }}>
        {buttons.map(btn => (
          <button key={btn.id} onClick={() => setActive(btn.id as 'platform' | 'cross')} style={{
            flex: 1, padding: '12px 16px', border: 'none',
            background: active === btn.id ? s.accent : 'transparent',
            color: active === btn.id ? '#fff' : s.text2, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {btn.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4 }}>{data.name}</div>
          <div style={{ color: s.text3, fontSize: 13 }}>{data.tagline}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {data.examples.map(ex => (
            <div key={ex.name} style={{
              background: s.bg2, borderRadius: 10, padding: 14,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${active === 'platform' ? s.accent : s.purple}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {ex.icon === 'fingerprint' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === 'platform' ? s.accent : s.purple} strokeWidth="2"><path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 3 4.58V17a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2.42A5 5 0 0 0 17 10V7a5 5 0 0 0-5-5z"/></svg>}
                  {ex.icon === 'face' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === 'platform' ? s.accent : s.purple} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
                  {ex.icon === 'lock' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === 'platform' ? s.accent : s.purple} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {ex.icon === 'smartphone' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === 'platform' ? s.accent : s.purple} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                  {ex.icon === 'usb' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === 'platform' ? s.accent : s.purple} strokeWidth="2"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="22"/><path d="M8 22h8"/></svg>}
                  {ex.icon === 'bluetooth' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === 'platform' ? s.accent : s.purple} strokeWidth="2"><polyline points="6 7 18 13 12 17 12 3 18 7 6 13"/></svg>}
                </div>
                <div>
                  <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
                  <div style={{ color: s.text3, fontSize: 11 }}>{ex.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: s.bg2, borderRadius: 10, padding: 16,
          border: `1px solid ${s.border}`,
        }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Sync Mechanism
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.sync.map(syncItem => (
              <div key={syncItem.provider} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: active === 'platform' ? s.accent : s.purple,
                  marginTop: 5, flexShrink: 0,
                }} />
                <div>
                  <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{syncItem.provider}</div>
                  <div style={{ color: s.text3, fontSize: 12 }}>{syncItem.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Feature Comparison
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.features.map(f => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: s.bg2, borderRadius: 8, padding: '10px 14px',
                border: `1px solid ${s.border}`,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: f.ok ? `${s.green}20` : `${s.red}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.ok ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.red} strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
                <span style={{ color: s.text, fontSize: 13 }}>{f.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontFamily: s.mono, color: f.ok ? s.green : s.red }}>
                  {f.ok ? 'YES' : 'NO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
