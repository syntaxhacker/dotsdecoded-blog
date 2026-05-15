import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const USERS = [
  'alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi',
  'ivan', 'judy', 'karl', 'luna', 'mike', 'nina', 'oscar', 'paul',
  'quinn', 'rose', 'sam', 'tina', 'uma', 'victor', 'wendy', 'xander',
]

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getVariant(userId: string, split: number): 'control' | 'treatment' {
  return simpleHash(userId) % 100 < split ? 'treatment' : 'control'
}

export default function TrafficSplitDemo() {
  const [split, setSplit] = useState(50)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const assignments = useMemo(() => {
    return USERS.map(u => ({ user: u, variant: getVariant(u, split) }))
  }, [split])

  const controlCount = assignments.filter(a => a.variant === 'control').length
  const treatmentCount = assignments.filter(a => a.variant === 'treatment').length
  const total = USERS.length

  return (
    <DemoBoundary name="Traffic Split">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
          Traffic Splitting
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Each user is consistently assigned to a variant via <code style={{ color: s.accent, fontFamily: s.mono, fontSize: 13 }}>hash(user_id) % 100</code>. Same user, same variant, every time.
        </p>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Treatment Traffic Split</label>
            <input
              type="range" min={0} max={100} value={split}
              onChange={e => setSplit(Number(e.target.value))}
              style={{ width: '100%', accentColor: s.accent }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Control: {100 - split}%</span>
              <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>{split}% Treatment</span>
            </div>
          </div>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: `conic-gradient(${s.accent} 0% ${split}%, ${s.green} ${split}% 100%)`,
            flexShrink: 0,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: s.text, fontFamily: s.mono, fontWeight: 600,
            }}>
              {split}/{100 - split}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: '10px 14px', background: s.bg2, borderRadius: 8, border: `1px solid ${s.green}44` }}>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{controlCount}</div>
            <div style={{ color: s.text3, fontSize: 11 }}>Control ({Math.round((controlCount / total) * 100)}%)</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', background: s.bg2, borderRadius: 8, border: `1px solid ${s.accent}44` }}>
            <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{treatmentCount}</div>
            <div style={{ color: s.text3, fontSize: 11 }}>Treatment ({Math.round((treatmentCount / total) * 100)}%)</div>
          </div>
        </div>

        <div style={{
          background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
          padding: 12, maxHeight: 240, overflowY: 'auto',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
            {assignments.map(a => {
              const isSelected = selectedUser === a.user
              const isControl = a.variant === 'control'
              return (
                <button
                  key={a.user}
                  onClick={() => setSelectedUser(a.user)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${isSelected ? (isControl ? s.green : s.accent) : s.border}`,
                    background: isSelected
                      ? (isControl ? `${s.green}15` : `${s.accent}15`)
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isControl ? s.green : s.accent,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    color: isSelected ? s.text : s.text2,
                    fontFamily: s.mono,
                    fontSize: 12,
                  }}>
                    {a.user}
                  </span>
                  {isSelected && (
                    <span style={{
                      marginLeft: 'auto',
                      color: isControl ? s.green : s.accent,
                      fontSize: 10,
                      fontWeight: 600,
                    }}>
                      {isControl ? 'C' : 'T'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{
          marginTop: 16,
          padding: 14,
          background: s.bg3,
          borderRadius: 10,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Deterministic Bucketing
          </div>
          <code style={{ color: s.text2, fontFamily: s.mono, fontSize: 12, lineHeight: 1.8, display: 'block' }}>
{`hash("alice") % 100 = ${simpleHash('alice') % 100}  -> always "control"
hash("bob") % 100   = ${simpleHash('bob') % 100}  -> always "treatment"`}
          </code>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
