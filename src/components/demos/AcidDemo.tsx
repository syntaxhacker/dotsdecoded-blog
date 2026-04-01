import { useState, useEffect, useRef } from 'react'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

export default function AcidDemo() {
  const [alice, setAlice] = useState(1000)
  const [bob, setBob] = useState(500)
  const [amount, setAmount] = useState('100')
  const [fail, setFail] = useState(false)
  const [logs, setLogs] = useState<{ text: string; color: string }[]>([])
  const [running, setRunning] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [result, setResult] = useState<{ text: string; color: string } | null>(null)
  const [speed, setSpeed] = useState(1)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const aRef = useRef(1000)
  const bRef = useRef(500)
  const [dispA, setDispA] = useState(1000)
  const [dispB, setDispB] = useState(500)

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    let frame: number
    const tick = () => {
      let moved = false
      const ad = alice - aRef.current
      if (ad !== 0) {
        const step = Math.ceil(Math.abs(ad) * 0.18)
        aRef.current += Math.sign(ad) * Math.min(step, Math.abs(ad))
        moved = true
      }
      const bd = bob - bRef.current
      if (bd !== 0) {
        const step = Math.ceil(Math.abs(bd) * 0.18)
        bRef.current += Math.sign(bd) * Math.min(step, Math.abs(bd))
        moved = true
      }
      if (moved) {
        setDispA(aRef.current)
        setDispB(bRef.current)
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [alice, bob])

  const sched = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, getStepDelay(ms, speed)))
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setAlice(1000)
    setBob(500)
    aRef.current = 1000
    bRef.current = 500
    setDispA(1000)
    setDispB(500)
    setLogs([])
    setActiveStep(-1)
    setRunning(false)
    setResult(null)
  }

  const doAcid = () => {
    reset()
    setRunning(true)
    const amt = Math.min(1000, Math.max(1, parseInt(amount) || 100))

    sched(() => {
      setLogs([{ text: 'BEGIN TRANSACTION', color: s.yellow }])
      setActiveStep(0)
    }, 400)

    sched(() => {
      setAlice(p => p - amt)
      setLogs(p => [...p, { text: `DEDUCT $${amt} from Alice`, color: s.orange }])
      setActiveStep(1)
    }, 1300)

    if (fail) {
      sched(() => {
        setLogs(p => [...p, { text: "ERROR: Failed to credit Bob's account", color: s.red }])
        setActiveStep(2)
      }, 2400)

      sched(() => {
        setAlice(1000)
        setLogs(p => [...p, { text: 'ROLLBACK \u2014 all changes reverted', color: s.red }])
        setActiveStep(3)
        setResult({ text: 'Transaction rolled back safely \u2014 balances unchanged', color: s.yellow })
        setRunning(false)
      }, 3600)
    } else {
      sched(() => {
        setBob(p => p + amt)
        setLogs(p => [...p, { text: `ADD $${amt} to Bob`, color: s.orange }])
        setActiveStep(2)
      }, 2400)

      sched(() => {
        setLogs(p => [...p, { text: 'COMMIT \u2014 transaction complete', color: s.green }])
        setActiveStep(3)
        setResult({ text: 'Transfer succeeded \u2014 balances consistent', color: s.green })
        setRunning(false)
      }, 3600)
    }
  }

  const doNoAcid = () => {
    reset()
    setRunning(true)
    const amt = Math.min(1000, Math.max(1, parseInt(amount) || 100))

    sched(() => {
      setAlice(p => p - amt)
      setLogs([{ text: `DEDUCT $${amt} from Alice`, color: s.orange }])
      setActiveStep(0)
    }, 400)

    sched(() => {
      setLogs(p => [...p, { text: 'CRASH! Connection lost before Bob received funds', color: s.red }])
      setActiveStep(1)
      setResult({ text: `Data inconsistency \u2014 $${amt} vanished into thin air`, color: s.red })
      setRunning(false)
    }, 1500)
  }

  const total = alice + bob
  const barMax = 1500
  const crashed = result?.color === s.red && !running

  const card = (name: string, balance: number, grad: string) => (
    <div style={{
      flex: 1, minWidth: 200, background: s.bg2,
      border: `1px solid ${s.border}`, borderRadius: 10, padding: 20,
    }}>
      <div style={{
        fontSize: 12, color: s.text2, marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: 1.2,
      }}>{name}</div>
      <div style={{
        fontSize: 30, fontWeight: 700, fontFamily: s.mono, marginBottom: 14,
      }}>${balance.toLocaleString()}</div>
      <div style={{
        height: 8, background: s.bg3, borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(0, (balance / barMax) * 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${grad})`,
          borderRadius: 4,
          transition: 'width 0.15s linear',
        }} />
      </div>
    </div>
  )

  return (
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: 28, color: s.text,
      animation: crashed ? 'acidShake 0.5s ease' : 'none',
    }}>
      <style>{`
        @keyframes acidBlink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
        @keyframes acidShake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-4px)} 30%,60%,90%{transform:translateX(4px)} }
      `}</style>

      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: -0.3 }}>
        ACID Transaction Visualizer
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {card('Alice', dispA, `${s.accent}, ${s.purple}`)}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', minWidth: 56,
        }}>
          {running && (
            <div style={{
              fontSize: 12, fontFamily: s.mono, color: s.accent, marginBottom: 2,
            }}>
              ${Math.min(1000, Math.max(1, parseInt(amount) || 100))}
            </div>
          )}
          <div style={{ fontSize: 22, color: running ? s.accent : s.border }}>
            -&rarr;
          </div>
        </div>
        {card('Bob', dispB, `${s.green}, ${s.accent}`)}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{
          padding: '4px 14px', fontSize: 13, fontFamily: s.mono,
          color: total === 1500 ? s.text3 : s.red,
          background: total === 1500 ? 'transparent' : `${s.red}14`,
          borderRadius: 6,
        }}>
          Total: ${(dispA + dispB).toLocaleString()}
          {total !== 1500 && '  (expected $1,500)'}
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 14, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, color: s.text2, fontFamily: s.mono }}>$</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={running}
            style={{
              width: 90, background: s.bg2,
              border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '7px 10px', color: s.text, fontSize: 14,
              fontFamily: s.mono, outline: 'none',
            }}
          />
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: s.text3,
          cursor: running ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={fail}
            onChange={e => setFail(e.target.checked)}
            disabled={running}
            style={{ accentColor: s.red }}
          />
          Simulate failure
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={doAcid}
          disabled={running}
          style={{
            padding: '9px 20px', background: running ? s.bg3 : s.accent,
            color: running ? s.text3 : '#fff', border: 'none',
            borderRadius: 6, fontSize: 14, fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'opacity 0.2s',
            opacity: running ? 0.5 : 1,
          }}
        >
          Transfer (ACID)
        </button>
        <button
          type="button"
          onClick={doNoAcid}
          disabled={running}
          style={{
            padding: '9px 20px', background: running ? s.bg3 : s.red,
            color: running ? s.text3 : '#fff', border: 'none',
            borderRadius: 6, fontSize: 14, fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'opacity 0.2s',
            opacity: running ? 0.5 : 1,
          }}
        >
          Transfer (No ACID)
        </button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
        {logs.length > 0 && (
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '9px 20px', background: s.bg3, color: s.text2,
              border: `1px solid ${s.border}`, borderRadius: 6,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {logs.length > 0 && (
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`,
          borderRadius: 8, padding: 16, marginBottom: 16,
          fontFamily: s.mono, fontSize: 13,
        }}>
          <div style={{
            fontSize: 11, color: s.text3, marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: 1.2,
          }}>
            Transaction Log
          </div>
          {logs.map((log, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: i < logs.length - 1 ? 6 : 0,
              opacity: running ? (activeStep === i ? 1 : 0.45) : 0.85,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: log.color, flexShrink: 0,
                boxShadow: activeStep === i && running ? `0 0 8px ${log.color}` : 'none',
                transition: 'box-shadow 0.3s',
              }} />
              <span style={{ color: log.color }}>{log.text}</span>
              {running && activeStep === i && (
                <span style={{
                  animation: 'acidBlink 1s step-end infinite',
                  color: s.text3,
                }}>|</span>
              )}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div style={{
          padding: '12px 18px', marginBottom: 24,
          background: `${result.color}12`,
          border: `1px solid ${result.color}30`,
          borderRadius: 8, fontSize: 14, fontWeight: 600,
          color: result.color, textAlign: 'center',
        }}>
          {result.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { l: 'A', n: 'Atomicity', d: 'All or nothing \u2014 a transaction either fully completes or fully reverts', c: s.accent },
          { l: 'C', n: 'Consistency', d: 'Data moves from one valid state to another \u2014 no rule violations', c: s.green },
          { l: 'I', n: 'Isolation', d: 'Concurrent transactions do not interfere with each other', c: s.purple },
          { l: 'D', n: 'Durability', d: 'Once committed, data survives crashes and power loss', c: s.orange },
        ].map(b => (
          <div key={b.l} style={{
            flex: '1 1 150px', background: s.bg2,
            border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '14px 16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 10, marginBottom: 6,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', width: 28, height: 28,
                borderRadius: 6, background: `${b.c}18`, color: b.c,
                fontSize: 15, fontWeight: 700, fontFamily: s.mono,
              }}>{b.l}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{b.n}</span>
            </div>
            <div style={{ fontSize: 12, color: s.text3, lineHeight: 1.5 }}>
              {b.d}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
