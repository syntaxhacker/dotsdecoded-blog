import { useState, useEffect, useCallback } from 'react'
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

type Warehouse = { id: string; name: string; stock: number; initialStock: number; locked: boolean }

const PRODUCT = 'Mechanical Keyboard'
const INITIAL_STOCK = 5
const BUYERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']

type BuyerState = {
  name: string
  status: 'waiting' | 'reading' | 'locked' | 'deducting' | 'done' | 'failed'
  warehouse: string | null
  readValue: number | null
  wroteValue: number | null
}

export default function InventoryDemo() {
  const [locking, setLocking] = useState(false)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [speed, setSpeed] = useState(1)

  const initWh = (): Warehouse[] => [
    { id: 'WH-01', name: 'New York', stock: INITIAL_STOCK, initialStock: INITIAL_STOCK, locked: false },
    { id: 'WH-02', name: 'Los Angeles', stock: INITIAL_STOCK, initialStock: INITIAL_STOCK, locked: false },
    { id: 'WH-03', name: 'Chicago', stock: INITIAL_STOCK, initialStock: INITIAL_STOCK, locked: false },
  ]

  const [warehouses, setWarehouses] = useState<Warehouse[]>(initWh)
  const [buyers, setBuyers] = useState<BuyerState[]>([])
  const [log, setLog] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, msg])
  }, [])

  const reset = () => {
    setRunning(false)
    setStep(-1)
    setWarehouses(initWh)
    setBuyers([])
    setLog([])
  }

  const start = () => {
    reset()
    const initial = BUYERS.map((name) => ({
      name, status: 'waiting' as const, warehouse: null as string | null,
      readValue: null as number | null, wroteValue: null as number | null,
    }))
    setBuyers(initial)
    setRunning(true)
    setStep(0)
  }

  useEffect(() => {
    if (!running || step < 0) return

    const buyerIdx = Math.min(step, BUYERS.length - 1)
    const buyer = BUYERS[buyerIdx]
    const whIdx = buyerIdx % 3
    const whId = `WH-0${whIdx + 1}`

    const t = setTimeout(() => {
      if (locking) {
        setBuyers((prev) => {
          const next = [...prev]
          if (next[buyerIdx]) {
            next[buyerIdx] = {
              ...next[buyerIdx],
              status: warehouses[whIdx].locked ? 'waiting' : 'locked',
              warehouse: whId,
              readValue: warehouses[whIdx].stock,
              wroteValue: warehouses[whIdx].stock - 1,
            }
          }
          return next
        })
        setWarehouses((prev) => {
          const next = [...prev]
          next[whIdx] = { ...next[whIdx], locked: true }
          return next
        })
        addLog(`${buyer} acquires lock on ${whId} (stock: ${warehouses[whIdx].stock})`)

        const t2 = setTimeout(() => {
          setWarehouses((prev) => {
            const next = [...prev]
            next[whIdx] = { ...next[whIdx], stock: next[whIdx].stock - 1, locked: false }
            return next
          })
          setBuyers((prev) => {
            const next = [...prev]
            if (next[buyerIdx]) {
              next[buyerIdx] = { ...next[buyerIdx], status: 'done' }
            }
            return next
          })
          addLog(`${buyer} deducted 1 from ${whId} -> stock: ${warehouses[whIdx].stock - 1}`)
          addLog(`${buyer} releases lock on ${whId}`)

          if (step >= BUYERS.length - 1) {
            setTimeout(() => setRunning(false), getStepDelay(400, speed))
          } else {
            setStep((prev) => prev + 1)
          }
        }, getStepDelay(800, speed))
        return () => clearTimeout(t2)
      } else {
        setBuyers((prev) => {
          const next = [...prev]
          const currentStock = warehouses[whIdx].stock
          const newStock = currentStock - 1
          if (next[buyerIdx]) {
            next[buyerIdx] = {
              ...next[buyerIdx],
              status: newStock < 0 ? 'failed' : 'done',
              warehouse: whId,
              readValue: currentStock,
              wroteValue: newStock,
            }
          }
          return next
        })
        setWarehouses((prev) => {
          const next = [...prev]
          next[whIdx] = { ...next[whIdx], stock: next[whIdx].stock - 1 }
          return next
        })
        addLog(`${buyer} reads ${whId} stock: ${warehouses[whIdx].stock}, writes: ${warehouses[whIdx].stock - 1}`)

        if (step >= BUYERS.length - 1) {
          setTimeout(() => setRunning(false), getStepDelay(400, speed))
        } else {
          setStep((prev) => prev + 1)
        }
      }
    }, getStepDelay(500, speed))

    return () => clearTimeout(t)
  }, [running, step, locking, warehouses, speed, addLog])

  const hasOversell = warehouses.some((wh) => wh.stock < 0)

  return (
    <DemoBoundary name="Inventory Race Condition">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: s.text3 }}>Distributed Locking</span>
            <button onClick={() => { reset(); setLocking((v) => !v) }} disabled={running}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', padding: 0,
                background: locking ? s.accent : s.bg3, cursor: running ? 'not-allowed' : 'pointer',
                position: 'relative', transition: 'background 0.2s', opacity: running ? 0.6 : 1,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9, background: s.text,
                position: 'absolute', top: 3, left: locking ? 23 : 3, transition: 'left 0.2s',
              }} />
            </button>
          </div>
          <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            Product: {PRODUCT} | Initial: {INITIAL_STOCK} per warehouse
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {warehouses.map((wh) => (
            <div key={wh.id} style={{
              background: s.bg2, border: `1px solid ${wh.stock < 0 ? s.red : wh.locked ? s.yellow : s.border}`,
              borderRadius: 10, padding: 14, transition: 'border-color 0.3s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.text }}>{wh.name}</div>
                  <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>{wh.id}</div>
                </div>
                {wh.locked && (
                  <div style={{
                    fontSize: 10, fontFamily: s.mono, color: s.yellow, padding: '2px 8px',
                    borderRadius: 4, background: `${s.yellow}15`, border: `1px solid ${s.yellow}33`,
                  }}>LOCKED</div>
                )}
              </div>
              <div style={{
                fontSize: 32, fontWeight: 700, fontFamily: s.mono, textAlign: 'center',
                color: wh.stock < 0 ? s.red : wh.stock === 0 ? s.yellow : s.green,
                transition: 'color 0.3s',
              }}>
                {wh.stock}
              </div>
              <div style={{ fontSize: 11, color: s.text3, textAlign: 'center', marginTop: 4 }}>units in stock</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={start} disabled={running}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: running ? s.bg3 : s.accent, color: running ? s.text3 : '#fff',
              fontSize: 14, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Simulate Concurrent Purchases
          </button>
          <button onClick={reset}
            style={{
              padding: '10px 18px', borderRadius: 8, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.text2, fontSize: 14, cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Reset
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        {buyers.length > 0 && (
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 8 }}>Buyers</div>
            {buyers.map((b) => (
              <div key={b.name} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                borderBottom: `1px solid ${s.bg3}`,
              }}>
                <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text2, width: 50 }}>{b.name}</span>
                <span style={{ fontSize: 11, color: s.text3, width: 55 }}>{b.warehouse}</span>
                {b.readValue !== null && (
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
                    {'read: '}{b.readValue}{' -> write: '}{b.wroteValue}
                  </span>
                )}
                <div style={{ marginLeft: 'auto' }}>
                  {b.status === 'done' && (
                    <span style={{ fontSize: 10, color: s.green, fontFamily: s.mono }}>OK</span>
                  )}
                  {b.status === 'failed' && (
                    <span style={{ fontSize: 10, color: s.red, fontFamily: s.mono }}>OVERSELL</span>
                  )}
                  {b.status === 'locked' && (
                    <span style={{ fontSize: 10, color: s.yellow, fontFamily: s.mono }}>LOCKED</span>
                  )}
                  {b.status === 'waiting' && (
                    <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>WAITING</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!running && hasOversell && (
          <div style={{
            background: `${s.red}10`, border: `1px solid ${s.red}44`,
            borderRadius: 10, padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.red, marginBottom: 4 }}>
              Race condition detected! Negative inventory.
            </div>
            <div style={{ fontSize: 13, color: s.text2 }}>
              Multiple buyers read the same stock value simultaneously, then each wrote (stock - 1).
              Without locking, reads are not isolated from concurrent writes.
            </div>
          </div>
        )}

        {!running && locking && !hasOversell && step >= BUYERS.length - 1 && (
          <div style={{
            background: `${s.green}10`, border: `1px solid ${s.green}44`,
            borderRadius: 10, padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.green, marginBottom: 4 }}>
              Distributed locking prevented overselling.
            </div>
            <div style={{ fontSize: 13, color: s.text2 }}>
              Each buyer acquired an exclusive lock before reading and deducting stock.
              Concurrent requests waited until the lock was released.
            </div>
          </div>
        )}

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14, maxHeight: 160, overflowY: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>Event Log</div>
          {log.length === 0 && <div style={{ fontSize: 12, color: s.text3 }}>Waiting...</div>}
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 11, fontFamily: s.mono, color: i === log.length - 1 ? s.text : s.text3, padding: '2px 0' }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}
