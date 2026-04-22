import { useState, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Account {
  name: string
  balance: number
}

interface TransferLog {
  id: string
  idempotencyKey: string
  from: string
  to: string
  amount: number
  status: 'processing' | 'completed' | 'duplicate' | 'failed'
  timestamp: number
}

let keyCounter = 0

export default function IdempotencyDemo() {
  const [accounts, setAccounts] = useState<Account[]>([
    { name: 'Alice', balance: 5000 },
    { name: 'Bob', balance: 3000 },
  ])
  const [logs, setLogs] = useState<TransferLog[]>([])
  const [useIdempotency, setUseIdempotency] = useState(true)
  const [amount, setAmount] = useState(500)
  const [processedKeys, setProcessedKeys] = useState<Set<string>>(new Set())
  const [currentKey, setCurrentKey] = useState('')
  const [networkFails, setNetworkFails] = useState(false)
  const keyRef = useRef('')
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generateKey = () => {
    keyCounter++
    const k = `idem_${Date.now().toString(36)}_${keyCounter}`
    setCurrentKey(k)
    keyRef.current = k
    return k
  }

  const reset = () => {
    setAccounts([{ name: 'Alice', balance: 5000 }, { name: 'Bob', balance: 3000 }])
    setLogs([])
    setProcessedKeys(new Set())
    setCurrentKey('')
    keyRef.current = ''
    if (animRef.current) clearTimeout(animRef.current)
  }

  const simulateTransfer = () => {
    const key = keyRef.current || generateKey()
    const from = 'Alice'
    const to = 'Bob'

    if (useIdempotency && processedKeys.has(key)) {
      const entry: TransferLog = {
        id: `log_${Date.now()}`,
        idempotencyKey: key,
        from, to, amount,
        status: 'duplicate',
        timestamp: Date.now(),
      }
      setLogs(prev => [...prev, entry])
      return
    }

    const entry: TransferLog = {
      id: `log_${Date.now()}`,
      idempotencyKey: key,
      from, to, amount,
      status: 'processing',
      timestamp: Date.now(),
    }
    setLogs(prev => [...prev, entry])

    if (networkFails && Math.random() < 0.6) {
      animRef.current = setTimeout(() => {
        setLogs(prev => prev.map(l => l.id === entry.id ? { ...l, status: 'failed' } : l))
      }, 400)
      return
    }

    animRef.current = setTimeout(() => {
      setAccounts(prev => prev.map(a => {
        if (a.name === from && !useIdempotency) return { ...a, balance: a.balance - amount }
        if (a.name === from && useIdempotency && !processedKeys.has(key)) return { ...a, balance: a.balance - amount }
        return a
      }).map(a => {
        if (a.name === to && !useIdempotency) return { ...a, balance: a.balance + amount }
        if (a.name === to && useIdempotency && !processedKeys.has(key)) return { ...a, balance: a.balance + amount }
        return a
      }))

      setLogs(prev => prev.map(l => l.id === entry.id ? { ...l, status: 'completed' } : l))

      if (useIdempotency) {
        setProcessedKeys(prev => new Set(prev).add(key))
      }
    }, 600)
  }

  const statusIcon = (st: string) => {
    switch (st) {
      case 'processing': return { color: s.yellow, label: 'PROCESSING' }
      case 'completed': return { color: s.green, label: 'COMPLETED' }
      case 'duplicate': return { color: s.purple, label: 'DUPLICATE (ignored)' }
      case 'failed': return { color: s.red, label: 'NETWORK FAIL' }
      default: return { color: s.text3, label: st }
    }
  }

  return (
    <DemoBoundary name="Idempotency">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setUseIdempotency(!useIdempotency)} style={{
          padding: '6px 14px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
          border: `1px solid ${useIdempotency ? s.green : s.red}`, borderRadius: 6,
          background: useIdempotency ? 'rgba(61,214,140,0.12)' : 'rgba(232,93,93,0.12)',
          color: useIdempotency ? s.green : s.red, fontWeight: 600,
        }}>
          {useIdempotency ? 'Idempotency: ON' : 'Idempotency: OFF'}
        </button>
        <button onClick={() => setNetworkFails(!networkFails)} style={{
          padding: '6px 14px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
          border: `1px solid ${networkFails ? s.yellow : s.border}`, borderRadius: 6,
          background: networkFails ? 'rgba(224,176,64,0.12)' : 'transparent',
          color: networkFails ? s.yellow : s.text3,
        }}>
          Network Fails: {networkFails ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        {accounts.map((acc, idx) => (
          <div key={acc.name} style={{
            background: s.bg2, borderRadius: 10, padding: 20, textAlign: 'center',
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.text, marginBottom: 8 }}>{acc.name}</div>
            <div style={{
              fontSize: 28, fontWeight: 700, fontFamily: s.mono,
              color: acc.balance < 0 ? s.red : s.green,
            }}>
              ${acc.balance.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 4, fontFamily: s.mono }}>balance</div>
          </div>
        ))}
        {accounts.length > 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${s.accent}18`, border: `1px solid ${s.accent}`,
              color: s.accent, fontSize: 18, fontWeight: 700,
            }}>
              {amount}
            </div>
            <div style={{ fontSize: 10, color: s.text3, marginTop: 4, fontFamily: s.mono }}>USD</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>Amount:</span>
          <input type="range" min={100} max={2000} step={100} value={amount}
            onChange={e => setAmount(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ fontSize: 12, fontFamily: s.mono, color: s.accent }}>${amount}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={reset} style={{
            padding: '6px 12px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
            border: `1px solid ${s.border}`, borderRadius: 6, background: s.bg3, color: s.text3,
          }}>Reset</button>
          <button onClick={simulateTransfer} style={{
            padding: '6px 16px', fontSize: 13, fontFamily: s.mono, cursor: 'pointer',
            border: `1px solid ${s.accent}`, borderRadius: 6, background: 'rgba(91,141,239,0.15)',
            color: s.accent, fontWeight: 600,
          }}>
            Transfer
          </button>
        </div>
      </div>

      {useIdempotency && (
        <div style={{ background: s.bg3, borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 2 }}>IDEMPOTENCY KEY</div>
          <div style={{ fontSize: 12, fontFamily: s.mono, color: s.purple }}>{currentKey || 'click Transfer to generate'}</div>
        </div>
      )}

      {!useIdempotency && (
        <div style={{ background: 'rgba(232,93,93,0.08)', border: `1px solid ${s.red}`, borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: s.red }}>
            Without idempotency: clicking Transfer multiple times executes the transfer each time. Try it -- watch the balance change.
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            TRANSFER LOG ({logs.length})
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {logs.slice().reverse().map((log) => {
              const si = statusIcon(log.status)
              return (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px',
                  borderBottom: `1px solid ${s.bg3}`, fontSize: 12, fontFamily: s.mono,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: si.color, flexShrink: 0 }} />
                  <span style={{ color: s.text2, minWidth: 40 }}>${log.amount}</span>
                  <span style={{ color: s.text3 }}>{log.from} → {log.to}</span>
                  <span style={{ color: si.color, marginLeft: 'auto', fontSize: 11 }}>{si.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${s.green}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.green, marginBottom: 4 }}>WITH IDEMPOTENCY KEY</div>
          <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
            Client sends a unique key with each request. Server checks: seen this key before? If yes, return the cached result. No double charges, no duplicate orders.
          </div>
        </div>
        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${s.red}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.red, marginBottom: 4 }}>WITHOUT IDEMPOTENCY KEY</div>
          <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
            User clicks "Pay", network drops, they click again. Two payments processed. $1000 becomes $2000. This is why payment APIs require idempotency keys.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
