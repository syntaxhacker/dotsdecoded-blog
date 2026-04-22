import { useState, useRef, useEffect, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-sql'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const txnCodeHtml = Prism.highlight(
  `ActiveRecord::Base.transaction do\n  alice.debit(amount)\n  bob.credit(amount)\n  # if error here -> ROLLBACK\nend`,
  Prism.languages.ruby, 'ruby'
)

const rawCodeHtml = Prism.highlight(
  `alice.debit(amount)\n# error happens here!\nbob.credit(amount) # never runs`,
  Prism.languages.ruby, 'ruby'
)

export default function TransactionDemo() {
  const [aliceBal, setAliceBal] = useState(1000)
  const [bobBal, setBobBal] = useState(500)
  const [amount, setAmount] = useState('200')
  const [simulateError, setSimulateError] = useState(false)
  const [mode, setMode] = useState<'transaction' | 'no-transaction'>('transaction')
  const [logs, setLogs] = useState<{ text: string; color: string }[]>([])
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'debit' | 'credit' | 'error' | 'done'>('idle')

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const snapRef = useRef({ alice: 1000, bob: 500 })

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout) }
  }, [])

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setAliceBal(1000)
    setBobBal(500)
    snapRef.current = { alice: 1000, bob: 500 }
    setLogs([])
    setPhase('idle')
    setRunning(false)
  }

  const sched = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }

  const runTransfer = () => {
    reset()
    setRunning(true)
    const amt = Math.min(1000, Math.max(1, parseInt(amount) || 200))
    const hasError = simulateError

    if (mode === 'transaction') {
      sched(() => {
        setLogs([{ text: 'BEGIN TRANSACTION', color: s.yellow }])
      }, 300)

      sched(() => {
        setPhase('debit')
        setLogs(prev => [...prev, { text: `UPDATE accounts SET balance = ${1000 - amt} WHERE name = 'Alice'`, color: s.accent }])
        setAliceBal(1000 - amt)
      }, 800)

      sched(() => {
        if (hasError) {
          setPhase('error')
          setLogs(prev => [...prev, { text: 'ERROR: Network timeout!', color: s.red }])
        } else {
          setPhase('credit')
          setLogs(prev => [...prev, { text: `UPDATE accounts SET balance = ${500 + amt} WHERE name = 'Bob'`, color: s.accent }])
          setBobBal(500 + amt)
        }
      }, 1400)

      sched(() => {
        if (hasError) {
          setLogs(prev => [...prev, { text: 'ROLLBACK -- reverting all changes', color: s.red }])
          setAliceBal(1000)
          setBobBal(500)
          setPhase('idle')
        } else {
          setLogs(prev => [...prev, { text: 'COMMIT', color: s.green }])
          setPhase('done')
        }
        setRunning(false)
      }, 2000)
    } else {
      sched(() => {
        setPhase('debit')
        setLogs([{ text: `UPDATE accounts SET balance = ${1000 - amt} WHERE name = 'Alice'`, color: s.accent }])
        setAliceBal(1000 - amt)
      }, 300)

      sched(() => {
        if (hasError) {
          setPhase('error')
          setLogs(prev => [...prev, { text: 'ERROR: Network timeout!', color: s.red }])
        } else {
          setPhase('credit')
          setLogs(prev => [...prev, { text: `UPDATE accounts SET balance = ${500 + amt} WHERE name = 'Bob'`, color: s.accent }])
          setBobBal(500 + amt)
        }
      }, 900)

      sched(() => {
        if (hasError) {
          setLogs(prev => [...prev, { text: 'Alice lost $' + amt + ' and Bob received nothing!', color: s.red }])
          setLogs(prev => [...prev, { text: '(No transaction to rollback -- money is gone)', color: s.red }])
        } else {
          setLogs(prev => [...prev, { text: 'Transfer complete', color: s.green }])
          setPhase('done')
        }
        setRunning(false)
      }, 1400)
    }
  }

  const accountCard = (name: string, balance: number, color: string, highlight: boolean) => (
    <div style={{
      background: highlight ? `${color}10` : s.bg2,
      border: `1px solid ${highlight ? color : s.border}`,
      borderRadius: 10,
      padding: 16,
      textAlign: 'center' as const,
      transition: 'all 0.3s',
    }}>
      <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono, marginBottom: 4 }}>{name}</div>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: highlight ? color : s.text,
        fontFamily: s.mono,
        transition: 'all 0.3s',
      }}>
        ${balance.toLocaleString()}
      </div>
    </div>
  )

  return (
    <DemoBoundary name="Transaction Demo">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Controls</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>Amount:</label>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '6px 10px', color: s.text, fontFamily: s.mono, fontSize: 13, width: 80,
                }}
                type="number" min="1" max="1000"
              />
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button
                onClick={() => setMode('transaction')}
                style={{
                  background: mode === 'transaction' ? s.green : s.bg2,
                  border: `1px solid ${mode === 'transaction' ? s.green : s.border}`,
                  borderRadius: 6, padding: '6px 12px',
                  color: mode === 'transaction' ? s.bg : s.text2,
                  fontFamily: s.mono, fontSize: 11, cursor: 'pointer',
                }}
              >
                With Transaction
              </button>
              <button
                onClick={() => setMode('no-transaction')}
                style={{
                  background: mode === 'no-transaction' ? s.red : s.bg2,
                  border: `1px solid ${mode === 'no-transaction' ? s.red : s.border}`,
                  borderRadius: 6, padding: '6px 12px',
                  color: mode === 'no-transaction' ? s.bg : s.text2,
                  fontFamily: s.mono, fontSize: 11, cursor: 'pointer',
                }}
              >
                Without Transaction
              </button>
            </div>
            <button
              onClick={() => setSimulateError(!simulateError)}
              style={{
                background: simulateError ? `${s.red}20` : s.bg2,
                border: `1px solid ${simulateError ? s.red : s.border}`,
                borderRadius: 6, padding: '6px 12px',
                color: simulateError ? s.red : s.text2,
                fontFamily: s.mono, fontSize: 11, cursor: 'pointer',
              }}
            >
              {simulateError ? '[x] Simulate Error' : '[ ] Simulate Error'}
            </button>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Code</div>
            <div className="tdc" style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: 12, fontFamily: s.mono, fontSize: 11, lineHeight: 1.6,
              whiteSpace: 'pre' as const, overflowX: 'auto',
            }}>
              <style>{`
.tdc code .token.keyword { color: #f92672; }
.tdc code .token.string, .tdc code .token.char, .tdc code .token.builtin, .tdc code .token.inserted { color: #e6db74; }
.tdc code .token.number, .tdc code .token.constant, .tdc code .token.symbol, .tdc code .token.property, .tdc code .token.tag, .tdc code .token.boolean, .tdc code .token.deleted { color: #ae81ff; }
.tdc code .token.selector, .tdc code .token.attr-name { color: #f92672; }
.tdc code .token.attr-value, .tdc code .token.atrule { color: #e6db74; }
.tdc code .token.function, .tdc code .token.class-name { color: #a6e22e; }
.tdc code .token.operator, .tdc code .token.entity, .tdc code .token.url, .tdc code .token.punctuation { color: #f8f8f2; }
.tdc code .token.comment, .tdc code .token.prolog, .tdc code .token.doctype, .tdc code .token.cdata { color: #75715e; font-style: italic; }
.tdc code .token.parameter, .tdc code .token.variable, .tdc code .token.regex, .tdc code .token.important { color: #fd971f; }
`}</style>
              <code dangerouslySetInnerHTML={{ __html: mode === 'transaction' ? txnCodeHtml : rawCodeHtml }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          {accountCard('Alice', aliceBal, s.accent, phase === 'debit')}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 24, color: s.text3 }}>{'-->'}</div>
            <span style={{ fontSize: 12, color: s.yellow, fontFamily: s.mono }}>${amount}</span>
          </div>
          {accountCard('Bob', bobBal, s.green, phase === 'credit')}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={runTransfer}
            disabled={running}
            style={{
              background: running ? s.bg3 : s.accent,
              border: 'none', borderRadius: 6, padding: '8px 20px',
              color: running ? s.text3 : s.bg,
              fontFamily: s.mono, fontSize: 12, fontWeight: 600,
              cursor: running ? 'default' : 'pointer',
            }}
          >
            Transfer
          </button>
          <button
            onClick={reset}
            style={{
              background: s.bg2, border: `1px solid ${s.border}`,
              borderRadius: 6, padding: '8px 16px',
              color: s.text3, fontFamily: s.mono, fontSize: 12, cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        {logs.length > 0 && (
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: 10, fontFamily: s.mono, fontSize: 11, lineHeight: 1.6,
            maxHeight: 140, overflowY: 'auto' as const,
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: log.color }}>{log.text}</div>
            ))}
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
