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

const requirements = [
  {
    id: 'toggle',
    label: 'Toggle On/Off',
    desc: 'Switch any feature on or off without redeploying. The most basic flag operation — instantaneous kill switch for a broken feature.',
    icon: <>&#x2B1C;</>,
  },
  {
    id: 'rollout',
    label: 'Gradual Rollout',
    desc: 'Release a feature to 10%, then 50%, then 100% of users. If error rates spike at 25%, pause the rollout instantly.',
    icon: <>&#x25D0;</>,
  },
  {
    id: 'targeting',
    label: 'Targeting Rules',
    desc: 'Target specific users by ID, plan tier, region, or custom attributes. Internal beta: show only to employees and beta customers.',
    icon: <>&#x2699;</>,
  },
  {
    id: 'abtest',
    label: 'A/B Test Integration',
    desc: 'Split traffic into control and treatment groups. Feed exposure events into the analytics pipeline for statistical analysis.',
    icon: <>&#x21C4;</>,
  },
  {
    id: 'realtime',
    label: 'Real-Time Updates',
    desc: 'Flag changes propagate to SDK clients within seconds via SSE or WebSocket. No polling delay — toggle propagates immediately.',
    icon: <>&#x21BB;</>,
  },
  {
    id: 'audit',
    label: 'Audit Log',
    desc: 'Every flag change is logged: who changed it, what changed, when. Compliance requirements met, and rollback is one click away.',
    icon: <>&#x1F4CB;</>,
  },
]

export default function FlagRequirementsDemo() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    toggle: true,
    rollout: true,
    targeting: true,
    abtest: false,
    realtime: true,
    audit: true,
  })
  const [activeReq, setActiveReq] = useState<string | null>(null)

  const toggle = (id: string) => {
    setFlags(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <DemoBoundary name="Feature Flag Requirements">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          background: s.bg2, borderRadius: 12, padding: '20px 24px',
          border: `1px solid ${s.border}`,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4,
            letterSpacing: -0.3,
          }}>
            Feature Flag Requirements
          </div>
          <div style={{
            fontSize: 13, color: s.text3, marginBottom: 20, lineHeight: 1.5,
          }}>
            Toggle each requirement to explore the feature set of a production-grade flag system.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requirements.map(req => {
              const isActive = flags[req.id]
              const isSelected = activeReq === req.id
              return (
                <div
                  key={req.id}
                  onClick={() => setActiveReq(isSelected ? null : req.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px',
                    background: isSelected ? s.bg3 : 'transparent',
                    border: `1px solid ${isSelected ? s.accent : isActive ? s.border : s.border}`,
                    borderRadius: 10, cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  <div style={{
                    fontSize: 18, width: 28, textAlign: 'center',
                    color: isActive ? s.accent : s.text3,
                  }}>
                    {req.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: isActive ? s.text : s.text2,
                      marginBottom: 2,
                    }}>
                      {req.label}
                    </div>
                    {isSelected && (
                      <div style={{
                        fontSize: 12, color: s.text2, lineHeight: 1.5,
                        marginTop: 6,
                      }}>
                        {req.desc}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={e => { e.stopPropagation(); toggle(req.id) }}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: isActive ? s.accent : s.bg,
                      border: `1px solid ${isActive ? s.accent : s.border}`,
                      position: 'relative', cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: isActive ? '#fff' : s.text3,
                      position: 'absolute', top: 2,
                      left: isActive ? 21 : 2,
                      transition: 'all 0.2s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: s.bg, borderRadius: 8,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                Active Requirements
              </div>
              <div style={{
                color: s.text, fontFamily: s.mono, fontSize: 13, fontWeight: 600,
              }}>
                {Object.values(flags).filter(Boolean).length} / {requirements.length}
              </div>
            </div>
            <div style={{
              marginTop: 8, height: 6, background: s.bg3, borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: s.accent, borderRadius: 3,
                width: `${(Object.values(flags).filter(Boolean).length / requirements.length) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
