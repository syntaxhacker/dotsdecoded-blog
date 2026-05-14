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

const namespaceColors: Record<string, string> = {
  PID: s.orange,
  Network: s.accent,
  Mount: s.green,
  User: s.purple,
  UTS: s.yellow,
}

interface NamespaceInfo {
  key: string
  label: string
  host: string[]
  container: string[]
}

const namespaces: NamespaceInfo[] = [
  {
    key: 'PID',
    label: 'PID',
    host: ['PID 1: init', 'PID 42: nginx', 'PID 128: sshd', 'PID 256: bash', 'PID 512: cron'],
    container: ['PID 1: nginx', 'PID 12: bash', 'PID 23: sleep'],
  },
  {
    key: 'Network',
    label: 'Network',
    host: ['eth0: 192.168.1.5', 'docker0: 172.17.0.1', 'lo: 127.0.0.1', 'wlan0: 10.0.0.2'],
    container: ['eth0: 172.17.0.2', 'lo: 127.0.0.1'],
  },
  {
    key: 'Mount',
    label: 'Mount',
    host: ['/dev/sda1 on /', '/dev/sda2 on /home', 'tmpfs on /tmp'],
    container: ['overlay on /', 'tmpfs on /tmp'],
  },
  {
    key: 'User',
    label: 'User',
    host: ['root (UID 0)', 'alice (UID 1000)', 'bob (UID 1001)'],
    container: ['root (UID 0 -> 1000000)', 'nobody (UID 65534)'],
  },
  {
    key: 'UTS',
    label: 'UTS',
    host: ['hostname: my-server', 'domain: example.com'],
    container: ['hostname: abc123', 'domain: (none)'],
  },
]

interface ProcessBubbleProps {
  label: string
  color: string
  active: boolean
  onClick: () => void
}

function ProcessBubble({ label, color, active, onClick }: ProcessBubbleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: active ? `${color}22` : s.bg3,
        border: `2px solid ${active ? color : s.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        opacity: active ? 1 : 0.4,
        transform: active ? 'scale(1)' : 'scale(0.9)',
      }}
    >
      <div style={{ color: active ? color : s.text3, fontSize: 10, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>
        {label}
      </div>
    </button>
  )
}

export default function NamespaceDemo() {
  const [view, setView] = useState<'container' | 'host'>('container')
  const [active, setActive] = useState<Record<string, boolean>>({
    PID: true,
    Network: true,
    Mount: true,
    User: true,
    UTS: true,
  })

  const toggleNamespace = (key: string) => {
    setActive(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const allOn = Object.values(active).every(Boolean)
  const toggleAll = () => {
    const newVal = !allOn
    const updated: Record<string, boolean> = {}
    for (const ns of namespaces) {
      updated[ns.key] = newVal
    }
    setActive(updated)
  }

  const entries = view === 'container' ? 'container' : 'host'

  const H = 'Namespace Isolation'

  return (
    <DemoBoundary name="Linux Namespaces">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>{H}</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Namespaces restrict what a process can see. Toggle each namespace to isolate or expose resources.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: s.bg2, borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setView('container')}
            style={{
              background: view === 'container' ? s.accent : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 16px',
              color: view === 'container' ? '#fff' : s.text2,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Container View
          </button>
          <button
            onClick={() => setView('host')}
            style={{
              background: view === 'host' ? s.accent : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 16px',
              color: view === 'host' ? '#fff' : s.text2,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Host View
          </button>
        </div>
        <button
          onClick={toggleAll}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
            color: s.text2, fontSize: 12, cursor: 'pointer',
          }}
        >
          {allOn ? 'Isolate All (off)' : 'Open All'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'stretch' }}>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 16 }}>Namespaces</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {namespaces.map(ns => (
              <ProcessBubble
                key={ns.key}
                label={ns.label}
                color={namespaceColors[ns.key]}
                active={active[ns.key]}
                onClick={() => toggleNamespace(ns.key)}
              />
            ))}
          </div>
        </div>

        <div style={{ flex: 2, background: s.bg2, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text2 }}>Process Can See</div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 10px',
              fontSize: 11, fontFamily: s.mono, color: s.accent,
            }}>
              {view === 'container' ? 'CONTAINER' : 'HOST'}
            </div>
          </div>
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14,
            minHeight: 200,
          }}>
            {namespaces.map(ns => {
              const activeEntries = active[ns.key] ? namespaces.find(n => n.key === ns.key)![entries] : [`(${ns.label} namespace isolated - not visible)`]
              return (
                <div key={ns.key} style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 8,
                  background: active[ns.key] ? `${namespaceColors[ns.key]}08` : 'transparent',
                  borderLeft: `3px solid ${active[ns.key] ? namespaceColors[ns.key] : s.border}`,
                  transition: 'all 0.25s',
                  opacity: active[ns.key] ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: namespaceColors[ns.key], marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {ns.label}
                  </div>
                  {activeEntries.map((line, i) => (
                    <div key={i} style={{
                      color: active[ns.key] ? s.text : s.text3,
                      fontFamily: s.mono, fontSize: 12, padding: '2px 0',
                    }}>
                      {line}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 12 }}>Namespace Legend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { key: 'PID', desc: 'Process IDs isolated. PID 1 in container is not system init.' },
            { key: 'Network', desc: 'Own interfaces, routing, iptables. Container has its own IP.' },
            { key: 'Mount', desc: 'Own filesystem tree. Container sees different mounts than host.' },
            { key: 'User', desc: 'UID/GID mapping. Root in container maps to unprivileged UID on host.' },
            { key: 'UTS', desc: 'Own hostname and domain. Container can have a different hostname.' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: namespaceColors[item.key], marginTop: 4, flexShrink: 0 }} />
              <div>
                <div style={{ color: namespaceColors[item.key], fontSize: 12, fontWeight: 600 }}>{item.key}</div>
                <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
