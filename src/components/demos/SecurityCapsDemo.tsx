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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface CapEntry {
  name: string
  desc: string
  enabled: boolean
  breakMsg: string
}

const initialCaps: CapEntry[] = [
  { name: 'CAP_CHOWN', desc: 'Change file ownership', enabled: true, breakMsg: 'chown: changing ownership of file: Operation not permitted' },
  { name: 'CAP_NET_RAW', desc: 'Raw sockets (ping, traceroute)', enabled: true, breakMsg: 'ping: socket: Operation not permitted' },
  { name: 'CAP_NET_BIND_SERVICE', desc: 'Bind to ports < 1024', enabled: true, breakMsg: 'Error: listen tcp :80: bind: permission denied' },
  { name: 'CAP_SYS_ADMIN', desc: 'Mount, swapon, hostname', enabled: true, breakMsg: 'mount: /mnt: not permitted' },
  { name: 'CAP_DAC_OVERRIDE', desc: 'Bypass file permission checks', enabled: true, breakMsg: 'Permission denied reading /etc/shadow' },
  { name: 'CAP_KILL', desc: 'Send signals to processes', enabled: true, breakMsg: 'kill: sending signal to pid 123: Operation not permitted' },
  { name: 'CAP_SETUID', desc: 'Change UID arbitrarily', enabled: true, breakMsg: 'setuid: Operation not permitted' },
  { name: 'CAP_SYS_PTRACE', desc: 'Trace processes with ptrace', enabled: true, breakMsg: 'ptrace: Operation not permitted' },
]

interface OpEntry {
  operation: string
  needed: string[]
  result: 'allowed' | 'blocked' | null
}

export default function SecurityCapsDemo() {
  const [caps, setCaps] = useState<CapEntry[]>(initialCaps.map(c => ({ ...c })))
  const [privileged, setPrivileged] = useState(false)
  const [ops, setOps] = useState<OpEntry[]>([])
  const [showUserNs, setShowUserNs] = useState(false)
  const [runningCmd, setRunningCmd] = useState<string | null>(null)

  const toggleCap = (idx: number) => {
    setCaps(prev => prev.map((c, i) => i === idx ? { ...c, enabled: !c.enabled } : c))
  }

  const runOp = (op: string, needed: string[]) => {
    if (privileged) {
      setOps(prev => [{ operation: op, needed, result: 'allowed' }, ...prev].slice(0, 15))
      return
    }
    const hasAll = needed.every(n => caps.find(c => c.name === n)?.enabled)
    setOps(prev => [{ operation: op, needed, result: hasAll ? 'allowed' : 'blocked' }, ...prev].slice(0, 15))
    const blockedCap = needed.find(n => !caps.find(c => c.name === n)?.enabled)
    if (!hasAll && blockedCap) {
      const entry = caps.find(c => c.name === blockedCap)
      setRunningCmd(entry ? entry.breakMsg : 'Operation not permitted')
      setTimeout(() => setRunningCmd(null), 2500)
    }
  }

  const totalCaps = caps.length
  const enabledCaps = caps.filter(c => c.enabled).length
  const pct = Math.round((enabledCaps / totalCaps) * 100)

  const blockedCount = ops.filter(o => o.result === 'blocked').length
  const allowedCount = ops.filter(o => o.result === 'allowed').length

  return (
    <DemoBoundary name="Security Capabilities">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={H}>Linux Capabilities in Containers</div>
          <div style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 11, fontFamily: s.mono,
            background: privileged ? `${s.red}22` : `${s.green}22`,
            color: privileged ? s.red : s.green, fontWeight: 600, border: `1px solid ${privileged ? s.red : s.green}`,
          }}>
            {privileged ? 'Privileged' : 'Unprivileged'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities ({enabledCaps}/{totalCaps})</div>
            <div style={{ height: 8, background: s.bg, borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 50 ? s.green : pct > 25 ? s.yellow : s.red, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
            {caps.map((c, i) => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                borderRadius: 6, marginBottom: 3,
                background: c.enabled ? `${s.green}08` : `${s.red}08`,
                transition: 'all 0.2s',
              }}>
                <button onClick={() => toggleCap(i)} style={{
                  width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${c.enabled ? s.green : s.red}`,
                  background: c.enabled ? s.green : 'transparent', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: c.enabled ? '#000' : 'transparent', fontWeight: 700,
                  transition: 'all 0.15s',
                }}>
                  {c.enabled ? 'V' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.enabled ? s.text : s.text3, fontFamily: s.mono }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: c.enabled ? s.text2 : s.text3 }}>{c.desc}</div>
                </div>
                {!c.enabled && (
                  <div style={{ fontSize: 9, color: s.red, fontFamily: s.mono, textAlign: 'right', maxWidth: 140 }}>{c.breakMsg}</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 220, maxWidth: 340 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Try Operations</div>
              <button onClick={() => setPrivileged(!privileged)} style={{
                background: privileged ? s.red : s.green, border: 'none', borderRadius: 6,
                padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 600,
              }}>
                {privileged ? 'Unprivileged Mode' : 'Toggle Privileged'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <button onClick={() => runOp('ping google.com', ['CAP_NET_RAW'])} style={opBtn(privileged)}>ping google.com</button>
              <button onClick={() => runOp('mount /dev/sda1 /mnt', ['CAP_SYS_ADMIN'])} style={opBtn(privileged)}>mount /dev/sda1 /mnt</button>
              <button onClick={() => runOp('chown root:root file', ['CAP_CHOWN'])} style={opBtn(privileged)}>chown root:root file</button>
              <button onClick={() => runOp('bind to port 80', ['CAP_NET_BIND_SERVICE'])} style={opBtn(privileged)}>bind to port 80</button>
              <button onClick={() => runOp('read /etc/shadow', ['CAP_DAC_OVERRIDE'])} style={opBtn(privileged)}>read /etc/shadow</button>
              <button onClick={() => runOp('ptrace process 123', ['CAP_SYS_PTRACE'])} style={opBtn(privileged)}>ptrace process 123</button>
            </div>

            {runningCmd && (
              <div style={{
                background: `${s.red}15`, border: `1px solid ${s.red}`, borderRadius: 6, padding: '8px 12px',
                fontFamily: s.mono, fontSize: 10, color: s.red, marginBottom: 12,
              }}>
                {runningCmd}
              </div>
            )}

            {ops.length > 0 && (
              <div>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>History</div>
                <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                  {ops.map((op, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                      borderBottom: `1px solid ${s.bg}`,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: op.result === 'allowed' ? s.green : s.red,
                      }} />
                      <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text2 }}>{op.operation}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 600,
                        color: op.result === 'allowed' ? s.green : s.red,
                        marginLeft: 'auto',
                      }}>
                        {op.result === 'allowed' ? 'ALLOWED' : 'BLOCKED'}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, fontFamily: s.mono }}>
                  <span style={{ color: s.green }}>{allowedCount} allowed</span>
                  <span style={{ color: s.red }}>{blockedCount} blocked</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16,
          marginBottom: 12,
        }}>
          <button onClick={() => setShowUserNs(!showUserNs)} style={{
            background: 'transparent', border: 'none', color: s.accent, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, padding: 0,
          }}>
            {showUserNs ? 'Hide' : 'Show'} User Namespace Mapping
          </button>
          {showUserNs && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: s.text2, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                Inside the container, processes run as root (UID 0). But thanks to user namespaces,
                this UID maps to an unprivileged high-numbered UID on the host. Root in the container
                is NOT root on the host.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: s.yellow, fontSize: 20, fontWeight: 700, fontFamily: s.mono }}>UID 0</div>
                  <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>Container (root)</div>
                  <div style={{ color: s.text3, fontSize: 9 }}>appears as root</div>
                </div>
                <div style={{ color: s.text3, fontSize: 18, padding: '0 8px' }}>{'\u2192'}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: s.accent, fontSize: 20, fontWeight: 700, fontFamily: s.mono }}>UID 165536</div>
                  <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>Host (nobody)</div>
                  <div style={{ color: s.text3, fontSize: 9 }}>mapped to unprivileged user</div>
                </div>
                <div style={{ color: s.text3, fontSize: 18, padding: '0 8px' }}>{'\u2192'}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: s.text3, fontSize: 20, fontWeight: 700, fontFamily: s.mono }}>Kernel</div>
                  <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>checks capabilities</div>
                  <div style={{ color: s.text3, fontSize: 9 }}>against effective set</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: s.text3 }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', flex: 1 }}>
            <div style={{ fontWeight: 600, color: s.text, marginBottom: 4, fontSize: 12 }}>Principle of Least Privilege</div>
            <div>Drop all capabilities except those the app explicitly needs. Never run containers in privileged mode in production.</div>
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', flex: 1 }}>
            <div style={{ fontWeight: 600, color: s.text, marginBottom: 4, fontSize: 12 }}>Docker Defaults</div>
            <div>By default, Docker drops all capabilities and adds back a safe subset. Privileged mode gives ALL capabilities.</div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function opBtn(privileged: boolean): React.CSSProperties {
  return {
    display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
    color: s.text2, cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
    transition: 'all 0.15s',
  }
}
