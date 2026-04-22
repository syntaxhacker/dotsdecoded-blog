import { useState, useEffect, useCallback, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Message {
  id: number
  user: string
  text: string
  color: string
}

interface Panel {
  id: number
  user: string
  color: string
  connected: boolean
}

const panels: Panel[] = [
  { id: 0, user: 'Alice', color: s.accent, connected: true },
  { id: 1, user: 'Bob', color: s.green, connected: true },
  { id: 2, user: 'Carol', color: s.purple, connected: true },
]

const channels = ['ChatChannel', 'NotificationsChannel', 'PresenceChannel']

export default function ActionCableDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [senderIdx, setSenderIdx] = useState(0)
  const [selectedChannel, setSelectedChannel] = useState(0)
  const [broadcasting, setBroadcasting] = useState(false)
  const [step, setStep] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [connectionStatus, setConnectionStatus] = useState<Record<number, string>>({
    0: 'connected',
    1: 'connected',
    2: 'connected',
  })

  const sender = panels[senderIdx]
  const channel = channels[selectedChannel]

  const channelHtml = useMemo(() => {
    const code = `class ${channel} < ApplicationCable::Channel
  subscribed
    stream_from "${channel.toLowerCase()}"
  end

  def receive(data)
    ${channel}.broadcast(
      message: data['message'],
      user: data['user']
    )
  end
end`
    return Prism.highlight(code, Prism.languages.ruby, 'ruby')
  }, [channel])

  const sendMessage = useCallback(() => {
    if (!input.trim()) return
    const newMsg: Message = {
      id: Date.now(),
      user: sender.user,
      text: input.trim(),
      color: sender.color,
    }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
    setBroadcasting(true)
    setStep(0)
  }, [input, sender])

  useEffect(() => {
    if (!broadcasting) return
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), getStepDelay(400, speed))
      return () => clearTimeout(timer)
    }
    if (step === 1) {
      const timer = setTimeout(() => setStep(2), getStepDelay(600, speed))
      return () => clearTimeout(timer)
    }
    if (step === 2) {
      const timer = setTimeout(() => {
        setBroadcasting(false)
        setStep(0)
      }, getStepDelay(400, speed))
      return () => clearTimeout(timer)
    }
  }, [broadcasting, step, speed])

  const toggleConnection = (id: number) => {
    setConnectionStatus((prev) => ({
      ...prev,
      [id]: prev[id] === 'connected' ? 'disconnected' : 'connected',
    }))
  }

  const statusColor = (status: string) => {
    if (status === 'connected') return s.green
    if (status === 'disconnected') return s.red
    return s.yellow
  }

  return (
    <DemoBoundary name="ActionCable Demo">
      <div className="acc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
.acc code .token.keyword { color: #f92672; }
.acc code .token.string, .acc code .token.char, .acc code .token.builtin, .acc code .token.inserted { color: #e6db74; }
.acc code .token.number, .acc code .token.constant, .acc code .token.symbol, .acc code .token.property, .acc code .token.tag, .acc code .token.boolean, .acc code .token.deleted { color: #ae81ff; }
.acc code .token.selector, .acc code .token.attr-name { color: #f92672; }
.acc code .token.attr-value, .acc code .token.atrule { color: #e6db74; }
.acc code .token.function, .acc code .token.class-name { color: #a6e22e; }
.acc code .token.operator, .acc code .token.entity, .acc code .token.url, .acc code .token.punctuation { color: #f8f8f2; }
.acc code .token.comment, .acc code .token.prolog, .acc code .token.doctype, .acc code .token.cdata { color: #75715e; font-style: italic; }
.acc code .token.parameter, .acc code .token.variable, .acc code .token.regex, .acc code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>SENDER:</span>
          {panels.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSenderIdx(idx)}
              style={{
                background: senderIdx === idx ? p.color : s.bg2,
                border: `1px solid ${senderIdx === idx ? p.color : s.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: senderIdx === idx ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.user}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>CHANNEL:</span>
          {channels.map((ch, idx) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(idx)}
              style={{
                background: selectedChannel === idx ? s.accent : s.bg2,
                border: `1px solid ${selectedChannel === idx ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: selectedChannel === idx ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {ch}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {panels.map((panel) => (
              <div
                key={panel.id}
                style={{
                  background: s.bg2,
                  border: `1px solid ${senderIdx === panel.id && broadcasting ? panel.color : s.border}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '8px 12px',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(connectionStatus[panel.id]) }} />
                    <span style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>{panel.user}</span>
                    <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>#{channel}</span>
                  </div>
                  <button
                    onClick={() => toggleConnection(panel.id)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${s.border}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      color: s.text3,
                      fontFamily: s.mono,
                      fontSize: 9,
                      cursor: 'pointer',
                    }}
                  >
                    {connectionStatus[panel.id] === 'connected' ? 'disconnect' : 'connect'}
                  </button>
                </div>
                <div style={{ padding: 10, minHeight: 100, maxHeight: 140, overflowY: 'auto' }}>
                  {messages.length === 0 ? (
                    <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, textAlign: 'center', padding: '20px 0' }}>
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isFromSender = msg.user === panel.user
                      const shouldShow = connectionStatus[panel.id] === 'connected'
                      if (!shouldShow && !isFromSender) return null
                      const isBroadcast = !isFromSender && broadcasting && step >= 2 && messages.indexOf(msg) === messages.length - 1
                      return (
                        <div
                          key={msg.id}
                          style={{
                            marginBottom: 6,
                            opacity: isBroadcast ? 1 : isFromSender ? 1 : 0.9,
                            transition: 'opacity 0.3s',
                          }}
                        >
                          <span style={{ color: msg.color, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>
                            {msg.user}
                          </span>
                          <span style={{ color: s.text3, fontSize: 11 }}>: </span>
                          <span style={{ color: s.text, fontSize: 12 }}>{msg.text}</span>
                          {isBroadcast && (
                            <span style={{ color: s.yellow, fontSize: 9, fontFamily: s.mono, marginLeft: 6 }}>
                              [received]
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Broadcast Flow
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
              {broadcasting ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: sender.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 700,
                    }}>
                      {sender.user[0]}
                    </div>
                    <span style={{ color: s.text, fontSize: 12, fontFamily: s.mono }}>{sender.user} sends message</span>
                  </div>
                  <div style={{ width: 1, height: 20, background: step >= 1 ? s.accent : s.border, marginLeft: 9 }} />
                  <div style={{
                    padding: '6px 10px',
                    background: step >= 1 ? s.bg3 : 'transparent',
                    borderRadius: 6,
                    border: `1px solid ${step >= 1 ? s.accent : s.border}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{ color: step >= 1 ? s.text : s.text3, fontSize: 11, fontFamily: s.mono }}>
                      ActionCable.server.broadcast("{channel}", {'{'}message:{'}'})
                    </div>
                  </div>
                  <div style={{ width: 1, height: 20, background: step >= 2 ? s.green : s.border, marginLeft: 9 }} />
                  <div style={{
                    padding: '6px 10px',
                    background: step >= 2 ? s.bg3 : 'transparent',
                    borderRadius: 6,
                    border: `1px solid ${step >= 2 ? s.green : s.border}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{ color: step >= 2 ? s.text : s.text3, fontSize: 11, fontFamily: s.mono }}>
                      {step >= 2
                        ? `Delivered to ${panels.filter((p) => connectionStatus[p.id] === 'connected' && p.id !== senderIdx).map((p) => p.user).join(', ')}`
                        : 'Streaming to all subscribers...'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, textAlign: 'center', padding: '20px 0' }}>
                  Send a message to see the broadcast flow
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Channel Code
              </div>
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.6, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: channelHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`${sender.user}: Type a message...`}
            style={{
              flex: 1,
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              color: s.text,
              fontFamily: s.mono,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            style={{
              background: input.trim() ? sender.color : s.bg3,
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              color: input.trim() ? '#fff' : s.text3,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            Broadcast
          </button>
        </div>
      </div>
    </DemoBoundary>
  )
}
