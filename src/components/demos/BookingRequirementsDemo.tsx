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

interface Req {
  id: string
  label: string
  desc: string
  services: string[]
  storage: string
}

const ALL_REQS: Req[] = [
  { id: 'browse', label: 'Browse/Search Events', desc: 'Users discover events by category, date, venue, or keyword', services: ['Event Catalog'], storage: '10 GB' },
  { id: 'select', label: 'Select Seats', desc: 'Interactive seat map with real-time availability per section', services: ['Seat Inventory'], storage: '2 GB' },
  { id: 'hold', label: 'Hold Seats', desc: 'Temporary 5-minute hold while user completes checkout', services: ['Booking', 'Redis'], storage: '0.5 GB' },
  { id: 'book', label: 'Book', desc: 'Reserve seats and create a pending order in the database', services: ['Booking'], storage: '5 GB' },
  { id: 'pay', label: 'Pay', desc: 'Process payment via credit card, digital wallet, or buy-now-pay-later', services: ['Payment'], storage: '3 GB' },
  { id: 'tickets', label: 'Receive Tickets', desc: 'Digital ticket delivery via email, SMS, and in-app wallet', services: ['Notification'], storage: '1 GB' },
  { id: 'waitlist', label: 'Waitlist', desc: 'Queue for sold-out events with auto-notify on seat release', services: ['Waiting Room'], storage: '0.5 GB' },
]

const ALL_SERVICES = ['Event Catalog', 'Seat Inventory', 'Booking', 'Payment', 'Notification', 'Waiting Room', 'Redis']

const TOTAL_STORAGE = 22

export default function BookingRequirementsDemo() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_REQS.map(r => [r.id, true]))
  )

  const toggle = (id: string) => setEnabled(prev => ({ ...prev, [id]: !prev[id] }))

  const activeReqs = ALL_REQS.filter(r => enabled[r.id])
  const activeServices = new Set(activeReqs.flatMap(r => r.services))
  const activeStorage = activeReqs.reduce((sum, r) => {
    const gb = parseInt(r.storage)
    return sum + (isNaN(gb) ? 0 : gb)
  }, 0)
  const complexity = Math.round((activeReqs.length / ALL_REQS.length) * 100)

  return (
    <DemoBoundary name="Booking System Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>System Requirements</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Toggle each requirement to see how it impacts the system architecture. Disabling a requirement removes its supporting services and storage.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 24 }}>
          {ALL_REQS.map(r => {
            const on = enabled[r.id]
            return (
              <div key={r.id} onClick={() => toggle(r.id)} style={{
                background: on ? s.bg3 : s.bg,
                border: `1px solid ${on ? s.accent : s.border}`,
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: on ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                  <div style={{
                    width: 36, height: 20, borderRadius: 10,
                    background: on ? s.accent : s.border,
                    position: 'relative', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute', top: 2,
                      left: on ? 18 : 2,
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
                <div style={{ color: on ? s.text2 : s.text3, fontSize: 11, lineHeight: 1.4 }}>
                  {r.desc}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 16, letterSpacing: -0.2 }}>System Impact</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>REQUIREMENTS</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{activeReqs.length}/{ALL_REQS.length}</div>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>SERVICES</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{activeServices.size}</div>
              <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>{Array.from(activeServices).join(', ')}</div>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>STORAGE</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{activeStorage} GB</div>
            </div>
          </div>

          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: s.text3, fontSize: 11 }}>ARCHITECTURE COMPLEXITY</div>
              <div style={{
                color: complexity < 40 ? s.green : complexity < 70 ? s.yellow : s.red,
                fontFamily: s.mono, fontSize: 12, fontWeight: 600,
              }}>
                {complexity < 40 ? 'Simple' : complexity < 70 ? 'Moderate' : 'Complex'}
              </div>
            </div>
            <div style={{ height: 8, background: s.bg2, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${complexity}%`,
                background: `linear-gradient(90deg, ${s.green}, ${complexity < 50 ? s.yellow : s.red})`,
                borderRadius: 4, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
