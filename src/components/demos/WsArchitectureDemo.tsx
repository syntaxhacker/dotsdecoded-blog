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

const STEPS = [
  {
    label: 'HTTP Upgrade',
    detail: 'Client sends GET with Upgrade: websocket header. Server responds 101 Switching Protocols.',
    from: 'client',
    to: 'lb',
    color: s.yellow,
  },
  {
    label: 'Connection Established',
    detail: 'WebSocket connection is now open. The TCP socket stays alive for bidirectional messaging.',
    from: 'lb',
    to: 'server',
    color: s.green,
  },
  {
    label: 'Bidirectional Frames',
    detail: 'Both client and server can send data frames at any time. Full-duplex communication.',
    from: 'both',
    to: 'both',
    color: s.accent,
  },
  {
    label: 'Sticky Session',
    detail: 'Load balancer pins the client to one server using a cookie or IP hash to preserve session state.',
    from: 'lb',
    to: 'server',
    color: s.purple,
  },
  {
    label: 'Close Handshake',
    detail: 'Either side sends a close frame (opcode 8). The other echoes it, then the TCP connection closes.',
    from: 'client',
    to: 'lb',
    color: s.red,
  },
]

export default function WsArchitectureDemo() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <DemoBoundary name="WebSocket Architecture">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
            WebSocket Architecture
          </div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            A WebSocket connection flows through four phases: HTTP upgrade, connection open,
            bidirectional data transfer, and close handshake. Click a step to highlight it.
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
            padding: '24px 16px', background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`,
            overflowX: 'auto',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: activeStep !== null && [0, 4].includes(activeStep) ? `${STEPS[activeStep].color}25` : s.bg3,
                border: `2px solid ${activeStep !== null && [0, 4].includes(activeStep) ? STEPS[activeStep].color : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.text }}>C</div>
                <div style={{ fontSize: 8, color: s.text3, marginTop: -2 }}>Client</div>
              </div>
            </div>

            <div style={{
              flex: 1, height: 2, background: s.border, position: 'relative', minWidth: 40,
              display: 'flex', alignItems: 'center',
            }}>
              <div style={{
                position: 'absolute', right: -8,
                color: activeStep === 0 ? s.yellow : activeStep === 4 ? s.red : s.text3,
                fontSize: 14, transition: 'color 0.3s',
              }}>{'>'}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 14,
                background: activeStep !== null && [0, 1, 3].includes(activeStep) ? `${STEPS[activeStep].color}25` : s.bg3,
                border: `2px solid ${activeStep !== null && [0, 1, 3].includes(activeStep) ? STEPS[activeStep].color : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.text, textAlign: 'center', lineHeight: 1.2 }}>LB</div>
                <div style={{ fontSize: 8, color: s.text3, marginTop: 2, textAlign: 'center' }}>Load<br/>Balancer</div>
              </div>
              <div style={{
                fontSize: 9, color: s.text3, maxWidth: 80, textAlign: 'center', lineHeight: 1.3,
              }}>
                Sticky session (cookie / IP hash)
              </div>
            </div>

            <div style={{
              flex: 1, height: 2, background: s.border, position: 'relative', minWidth: 40,
              display: 'flex', alignItems: 'center',
            }}>
              <div style={{
                position: 'absolute', left: -8,
                color: activeStep === 2 ? s.accent : s.text3,
                fontSize: 14, transition: 'color 0.3s',
              }}>{'<'}</div>
              <div style={{
                position: 'absolute', right: -8,
                color: activeStep === 2 ? s.accent : s.text3,
                fontSize: 14, transition: 'color 0.3s',
              }}>{'>'}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: activeStep !== null && [1, 3].includes(activeStep) ? `${STEPS[activeStep].color}25` : s.bg3,
                border: `2px solid ${activeStep !== null && [1, 3].includes(activeStep) ? STEPS[activeStep].color : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.text }}>S</div>
                <div style={{ fontSize: 8, color: s.text3, marginTop: -2 }}>Server</div>
              </div>
              <div style={{ fontSize: 9, color: s.text3, textAlign: 'center' }}>WS Server</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Lifecycle Steps
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STEPS.map((st, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${activeStep === idx ? st.color : s.border}`,
                      background: activeStep === idx ? `${st.color}12` : s.bg,
                      textAlign: 'left', transition: 'all 0.2s',
                      fontFamily: 'inherit', fontSize: 13, width: '100%',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: activeStep === idx ? st.color : s.text3,
                      flexShrink: 0, transition: 'all 0.2s',
                    }} />
                    <span style={{ color: activeStep === idx ? st.color : s.text, fontWeight: activeStep === idx ? 600 : 400 }}>
                      {st.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{
              flex: '1 1 300px', background: s.bg, borderRadius: 10,
              border: `1px solid ${s.border}`, padding: 16, minHeight: 160,
            }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Details
              </div>
              {activeStep !== null ? (
                <>
                  <div style={{ color: STEPS[activeStep].color, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    {STEPS[activeStep].label}
                  </div>
                  <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
                    {STEPS[activeStep].detail}
                  </div>
                </>
              ) : (
                <div style={{ color: s.text3, fontSize: 13 }}>
                  Click a lifecycle step to see details about that phase of the WebSocket connection.
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Architecture Notes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: s.yellow, fontSize: 12, flexShrink: 0 }}>--</span>
                <span style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                  <strong style={{ color: s.text }}>Sticky sessions</strong> are required because WebSocket state lives in-memory on the server that accepted the upgrade.
                  Use a cookie (e.g., AWS ALB) or IP hash to pin the client to the same server.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: s.red, fontSize: 12, flexShrink: 0 }}>--</span>
                <span style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                  <strong style={{ color: s.text }}>Multiplexing challenge</strong>: Unlike HTTP/2, WebSocket frames on a single connection are serial.
                  To multiplex, you need multiple WebSocket connections, or a sub-protocol that handles multiplexing over a single connection.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: s.green, fontSize: 12, flexShrink: 0 }}>--</span>
                <span style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                  <strong style={{ color: s.text }}>Scaling</strong>: Use a pub/sub backend (Redis, Kafka) to broadcast messages across WebSocket server instances.
                  Each server subscribes to relevant channels and forwards messages to its connected clients.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
