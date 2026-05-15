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

interface ConfigEntry {
  key: string
  value: string
  encoded?: string
}

const configMapData: ConfigEntry[] = [
  { key: 'APP_COLOR', value: 'blue' },
  { key: 'APP_MODE', value: 'production' },
  { key: 'log_level', value: 'info' },
]

const secretData: ConfigEntry[] = [
  { key: 'DB_PASSWORD', value: 's3cret!', encoded: 'czNjcmV0IQ==' },
  { key: 'API_KEY', value: 'sk-abc123xyz', encoded: 'c2stYWJjMTIzeHl6' },
  { key: 'DB_USERNAME', value: 'admin', encoded: 'YWRtaW4=' },
]

type MountMode = 'env' | 'file'

export default function K8sConfigDemo() {
  const [mountMode, setMountMode] = useState<MountMode>('env')

  return (
    <DemoBoundary name="ConfigMap and Secret">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>ConfigMap and Secret</div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: '1 1 240px', minWidth: 200 }}>
          <div style={{
            background: `${s.accent}08`, border: `1px solid ${s.accent}`, borderRadius: 10, padding: 16,
          }}>
            <div style={{ color: s.accent, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>ConfigMap</div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8 }}>
              Stores non-sensitive configuration as key-value pairs. Data is stored in plaintext.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {configMapData.map((st) => (
                <div key={st.key} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 10px',
                  fontFamily: s.mono, fontSize: 12,
                }}>
                  <div style={{ color: s.accent, marginBottom: 2 }}>{st.key}</div>
                  <div style={{ color: s.text }}>{st.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 240px', minWidth: 200 }}>
          <div style={{
            background: `${s.yellow}08`, border: `1px solid ${s.yellow}`, borderRadius: 10, padding: 16,
          }}>
            <div style={{ color: s.yellow, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Secret</div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8 }}>
              Stores sensitive data like passwords and API keys. Values are base64-encoded.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {secretData.map((st) => (
                <div key={st.key} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 10px',
                  fontFamily: s.mono, fontSize: 12,
                }}>
                  <div style={{ color: s.yellow, marginBottom: 2 }}>{st.key}</div>
                  <div style={{ color: s.text3 }}>{st.encoded}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Pod Consumption</span>
          <div style={{ display: 'flex', gap: 4, background: s.bg, borderRadius: 6, padding: 2 }}>
            <button onClick={() => setMountMode('env')} style={{
              background: mountMode === 'env' ? s.bg3 : 'transparent',
              border: 'none', borderRadius: 5, padding: '6px 12px',
              color: mountMode === 'env' ? s.text : s.text3,
              cursor: 'pointer', fontSize: 11, fontWeight: mountMode === 'env' ? 600 : 400,
              transition: 'all 0.15s',
            }}>Env Vars</button>
            <button onClick={() => setMountMode('file')} style={{
              background: mountMode === 'file' ? s.bg3 : 'transparent',
              border: 'none', borderRadius: 5, padding: '6px 12px',
              color: mountMode === 'file' ? s.text : s.text3,
              cursor: 'pointer', fontSize: 11, fontWeight: mountMode === 'file' ? 600 : 400,
              transition: 'all 0.15s',
            }}>File Mount</button>
          </div>
        </div>

        <div style={{
          border: `2px solid ${s.border2}`, borderRadius: 10, padding: 16,
          background: s.bg,
        }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Pod: my-app-pod</div>

          {mountMode === 'env' ? (
            <div>
              <div style={{ color: s.text2, fontSize: 11, marginBottom: 6 }}>Environment Variables:</div>
              {[...configMapData, ...secretData].map((st) => (
                <div key={st.key} style={{
                  display: 'flex', gap: 8, fontFamily: s.mono, fontSize: 12,
                  padding: '4px 8px', background: s.bg2, borderRadius: 4, marginBottom: 3,
                }}>
                  <span style={{ color: s.text }}>{st.key}</span>
                  <span style={{ color: s.text3 }}>=</span>
                  <span style={{ color: st.encoded ? s.yellow : s.accent }}>
                    {st.value}
                  </span>
                  <span style={{ color: s.text3, fontSize: 10 }}>from {st.encoded ? 'Secret' : 'ConfigMap'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ color: s.text2, fontSize: 11, marginBottom: 6 }}>Mounted Files:</div>
              <div style={{
                background: s.bg2, borderRadius: 6, padding: 10, fontFamily: s.mono, fontSize: 11,
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ color: s.accent }}>/etc/config/</div>
                {configMapData.map((st) => (
                  <div key={st.key} style={{ color: s.text2, paddingLeft: 16 }}>{st.key} {'\u2192'} {st.value}</div>
                ))}
              </div>
              <div style={{
                background: s.bg2, borderRadius: 6, padding: 10, marginTop: 6, fontFamily: s.mono, fontSize: 11,
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ color: s.yellow }}>/etc/secret/</div>
                {secretData.map((st) => (
                  <div key={st.key} style={{ color: s.text2, paddingLeft: 16 }}>{st.key} {'\u2192'} {st.value}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Differences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'ConfigMap', items: ['Plaintext values', 'Use for config, env vars, flags', '1 MB limit per ConfigMap'], color: s.accent },
            { label: 'Secret', items: ['Base64-encoded values', 'Use for passwords, tokens, keys', 'Encrypted at rest if configured', '1 MB limit per Secret'], color: s.yellow },
          ].map((st) => (
            <div key={st.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0, marginTop: 4 }} />
              <div>
                <span style={{ color: st.color, fontSize: 13, fontWeight: 600 }}>{st.label}</span>
                <ul style={{ margin: '2px 0 0 0', paddingLeft: 16, color: s.text2, fontSize: 12 }}>
                  {st.items.map((item, i) => <li key={i} style={{ marginBottom: 1 }}>{item}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
