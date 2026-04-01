import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Tab = 'default' | 'named' | 'mixed'

interface EventData {
  id: number
  text: string
  type: 'default' | 'named'
  eventName?: string
}

interface EventLine extends EventData {
  highlight?: boolean
}

const defaultEventsData: EventData[] = [
  { id: 1, text: 'data: Hello from server!', type: 'default' },
  { id: 2, text: 'data: Here is another update.', type: 'default' },
  { id: 3, text: 'data: Final message received.', type: 'default' },
]

const namedEventsData: EventData[] = [
  { id: 1, text: 'event: notification', type: 'named', eventName: 'notification' },
  { id: 2, text: 'data: You have 3 new messages', type: 'named', eventName: 'notification' },
  { id: 3, text: '', type: 'named' },
  { id: 4, text: 'event: alert', type: 'named', eventName: 'alert' },
  { id: 5, text: 'data: System maintenance in 5 minutes', type: 'named', eventName: 'alert' },
  { id: 6, text: '', type: 'named' },
  { id: 7, text: 'event: update', type: 'named', eventName: 'update' },
  { id: 8, text: 'data: {"progress": 75}', type: 'named', eventName: 'update' },
]

const mixedEventsData: EventData[] = [
  { id: 1, text: 'data: Server connected', type: 'default' },
  { id: 2, text: '', type: 'default' },
  { id: 3, text: 'event: notification', type: 'named', eventName: 'notification' },
  { id: 4, text: 'data: New user registered', type: 'named', eventName: 'notification' },
  { id: 5, text: '', type: 'named' },
  { id: 6, text: 'data: Heartbeat ping', type: 'default' },
  { id: 7, text: '', type: 'default' },
  { id: 8, text: 'event: alert', type: 'named', eventName: 'alert' },
  { id: 9, text: 'data: High CPU usage detected', type: 'named', eventName: 'alert' },
]

const listenerCode: Record<Tab, string> = {
  default: `const source = new EventSource('/api/events');

source.onmessage = (event) => {
  console.log('Default:', event.data);
};`,
  named: `const source = new EventSource('/api/events');

source.addEventListener('notification', (e) => {
  console.log('Notification:', e.data);
});

source.addEventListener('alert', (e) => {
  console.log('Alert:', e.data);
});

source.addEventListener('update', (e) => {
  console.log('Update:', e.data);
});`,
  mixed: `const source = new EventSource('/api/events');

source.onmessage = (event) => {
  console.log('Default:', event.data);
};

source.addEventListener('notification', (e) => {
  console.log('Notification:', e.data);
});

source.addEventListener('alert', (e) => {
  console.log('Alert:', e.data);
});`,
}

export default function SseEventTypesDemo() {
  const [activeTab, setActiveTab] = useState<Tab>('default')
  const [lines, setLines] = useState<EventLine[]>([])
  const [firingLineId, setFiringLineId] = useState<number | null>(null)
  const [firingListener, setFiringListener] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const wireRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const highlightedCode = useMemo(() => {
    return Prism.highlight(listenerCode[activeTab], Prism.languages.javascript, 'javascript')
  }, [activeTab])

  const getEventsData = useCallback((tab: Tab) => {
    switch (tab) {
      case 'default': return defaultEventsData
      case 'named': return namedEventsData
      case 'mixed': return mixedEventsData
    }
  }, [])

  const getEventListeners = useCallback((tab: Tab): string[] => {
    switch (tab) {
      case 'default': return ['onmessage']
      case 'named': return ['notification', 'alert', 'update']
      case 'mixed': return ['onmessage', 'notification', 'alert']
    }
  }, [])

  const fireListener = useCallback((tab: Tab, eventName: string | undefined) => {
    if (tab === 'default') return 'onmessage'
    if (tab === 'named' || tab === 'mixed') return eventName || 'onmessage'
    return null
  }, [])

  const handleSend = useCallback(async () => {
    if (isPlaying) return
    setIsPlaying(true)
    setLines([])
    
    const data = getEventsData(activeTab)
    const listeners = getEventListeners(activeTab)
    
    for (const item of data) {
      const delay = getStepDelay(400, speed)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      if (item.text) {
        const newLine: EventLine = { ...item }
        setLines(prev => [...prev, newLine])
        
        const listenerToFire = fireListener(activeTab, item.eventName)
        if (listenerToFire) {
          setFiringLineId(item.id)
          setFiringListener(listenerToFire)
          
          await new Promise(resolve => setTimeout(resolve, getStepDelay(200, speed)))
          setFiringLineId(null)
          setFiringListener(null)
        }
      } else {
        const blankLine: EventLine = { id: item.id, text: '', type: item.type, eventName: item.eventName || undefined }
        setLines(prev => [...prev, blankLine])
      }
      
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }
    
    setIsPlaying(false)
  }, [isPlaying, activeTab, speed, getEventsData, getEventListeners, fireListener])

  const handleReset = useCallback(() => {
    setLines([])
    setFiringLineId(null)
    setFiringListener(null)
    setIsPlaying(false)
  }, [])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setLines([])
    setFiringLineId(null)
    setFiringListener(null)
    setIsPlaying(false)
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'default', label: 'Default Events' },
    { key: 'named', label: 'Named Events' },
    { key: 'mixed', label: 'Mixed Events' },
  ]

  const listeners = getEventListeners(activeTab)

  return (
    <DemoBoundary name="Event Types">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: s.bg,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        overflow: 'hidden',
      }}>
        <style>{`
          code .token.keyword { color: #f92672; }
          code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
          code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
          code .token.selector, code .token.attr-name { color: #f92672; }
          code .token.attr-value, code .token.atrule { color: #e6db74; }
          code .token.function, code .token.class-name { color: #a6e22e; }
          code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
          code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
          code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
        `}</style>
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${s.border}`,
          backgroundColor: s.bg2,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.key ? s.bg3 : 'transparent',
                color: activeTab === tab.key ? s.text : s.text3,
                border: 'none',
                borderBottom: activeTab === tab.key ? `2px solid ${s.accent}` : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: s.text2,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                SSE Wire Format
              </div>
              <div
                ref={containerRef}
                style={{
                  backgroundColor: s.bg2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  padding: 16,
                  height: 280,
                  overflowY: 'auto',
                  fontFamily: s.mono,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    style={{
                      color: line.text.startsWith('event:') ? s.purple :
                             line.text.startsWith('data:') ? s.green : s.text3,
                      opacity: firingLineId === line.id ? 1 : 0.7,
                      transform: firingLineId === line.id ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      backgroundColor: firingLineId === line.id ? `${s.accent}15` : 'transparent',
                      padding: firingLineId === line.id ? '4px 8px' : '4px 0',
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  >
                    {line.text || '\u00A0'}
                  </div>
                ))}
                {lines.length === 0 && (
                  <div style={{ color: s.text3, fontStyle: 'italic' }}>
                    Click "Send Events" to see SSE wire format
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: s.text2,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                EventSource Listeners
              </div>
              <div style={{
                backgroundColor: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: 16,
                height: 280,
                overflowY: 'auto',
                fontFamily: s.mono,
                fontSize: 12,
                lineHeight: 1.5,
              }}>
                <div style={{
                  margin: 0,
                  color: s.text,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${s.border}`,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={handleSend}
                disabled={isPlaying}
                style={{
                  padding: '10px 24px',
                  backgroundColor: isPlaying ? s.bg3 : s.accent,
                  color: s.text,
                  border: 'none',
                  borderRadius: 6,
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  opacity: isPlaying ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {isPlaying ? 'Sending...' : 'Send Events'}
              </button>
              <button
                onClick={handleReset}
                disabled={isPlaying}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  color: s.text2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  opacity: isPlaying ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                Reset
              </button>
            </div>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{
            display: 'flex',
            gap: 16,
            marginTop: 16,
            flexWrap: 'wrap',
          }}>
            {listeners.map(listener => (
              <div
                key={listener}
                style={{
                  padding: '8px 16px',
                  backgroundColor: firingListener === listener ? s.accent : s.bg3,
                  color: firingListener === listener ? s.bg : s.text,
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: s.mono,
                  transition: 'all 0.15s ease',
                  transform: firingListener === listener ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: firingListener === listener ? `0 0 20px ${s.accent}50` : 'none',
                }}
              >
                {listener === 'onmessage' ? 'onmessage' : `addEventListener('${listener}')`}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
