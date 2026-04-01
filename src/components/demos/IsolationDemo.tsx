import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
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

const laptop = (price: string) => [{ name: 'Laptop', price }]

const baseProducts = [
  { name: 'Laptop', price: '$999' },
  { name: 'Phone', price: '$699' },
  { name: 'Tablet', price: '$549' },
]

const allProducts = [...baseProducts, { name: 'Monitor', price: '$600' }]

type Step = {
  a: string
  b: string
  aStatus: string
  bStatus: string
  data: { name: string; price: string }[]
  aView: { name: string; price: string }[] | null
  bView: { name: string; price: string }[] | null
  aFlash: boolean
  bFlash: boolean
  warning: string | null
  warningColor: string
}

type Scenario = {
  name: string
  level: string
  steps: Step[]
}

const scenarios: Scenario[] = [
  {
    name: 'Dirty Read',
    level: 'Read Uncommitted',
    steps: [
      {
        a: '', b: '',
        aStatus: 'Idle', bStatus: 'Idle',
        data: laptop('$999'),
        aView: null, bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: 'BEGIN', b: '',
        aStatus: 'Active', bStatus: 'Idle',
        data: laptop('$999'),
        aView: null, bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: "UPDATE products\n  SET price = 899\n  WHERE name = 'Laptop'", b: '',
        aStatus: 'Uncommitted', bStatus: 'Idle',
        data: laptop('$999'),
        aView: laptop('$899'), bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: "SELECT price\n  FROM products\n  WHERE name = 'Laptop'",
        aStatus: 'Uncommitted', bStatus: 'Reading',
        data: laptop('$999'),
        aView: laptop('$899'), bView: laptop('$899'),
        aFlash: false, bFlash: true,
        warning: "Dirty Read: B reads A's uncommitted $899", warningColor: s.red,
      },
      {
        a: 'ROLLBACK', b: '',
        aStatus: 'Rolled back', bStatus: 'Holds phantom data',
        data: laptop('$999'),
        aView: null, bView: laptop('$899'),
        aFlash: false, bFlash: true,
        warning: '$899 never existed in the committed database', warningColor: s.red,
      },
    ],
  },
  {
    name: 'Non-Repeatable Read',
    level: 'Read Committed',
    steps: [
      {
        a: '', b: '',
        aStatus: 'Idle', bStatus: 'Idle',
        data: laptop('$999'),
        aView: null, bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: "BEGIN\n\nSELECT price\n  FROM products\n  WHERE name = 'Laptop'",
        aStatus: 'Idle', bStatus: 'Active',
        data: laptop('$999'),
        aView: null, bView: laptop('$999'),
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: "BEGIN\n\nUPDATE products\n  SET price = 799\n  WHERE name = 'Laptop'\n\nCOMMIT", b: '',
        aStatus: 'Committed', bStatus: 'Active',
        data: laptop('$799'),
        aView: null, bView: laptop('$999'),
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: "SELECT price\n  FROM products\n  WHERE name = 'Laptop'\n\n-- 2nd read in same tx",
        aStatus: 'Committed', bStatus: 'Active',
        data: laptop('$799'),
        aView: null, bView: laptop('$799'),
        aFlash: false, bFlash: true,
        warning: 'Non-Repeatable Read: same query returned different values ($999 then $799)', warningColor: s.yellow,
      },
    ],
  },
  {
    name: 'Phantom Read',
    level: 'Repeatable Read',
    steps: [
      {
        a: '', b: '',
        aStatus: 'Idle', bStatus: 'Idle',
        data: [...baseProducts],
        aView: null, bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: 'BEGIN\n\nSELECT *\n  FROM products\n  WHERE price > 500\n\n-- 3 rows returned', b: '',
        aStatus: 'Active', bStatus: 'Idle',
        data: [...baseProducts],
        aView: [...baseProducts],
        bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: "BEGIN\n\nINSERT INTO products\n  (name, price)\nVALUES\n  ('Monitor', 600)\n\nCOMMIT",
        aStatus: 'Active', bStatus: 'Committed',
        data: [...allProducts],
        aView: [...baseProducts],
        bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: 'SELECT *\n  FROM products\n  WHERE price > 500\n\n-- 4 rows returned!', b: '',
        aStatus: 'Active', bStatus: 'Committed',
        data: [...allProducts],
        aView: [...allProducts],
        bView: null,
        aFlash: true, bFlash: false,
        warning: 'Phantom Read: a new row materialized between identical queries', warningColor: s.yellow,
      },
    ],
  },
  {
    name: 'Serializable',
    level: 'Serializable',
    steps: [
      {
        a: '', b: '',
        aStatus: 'Idle', bStatus: 'Idle',
        data: [...baseProducts],
        aView: null, bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: 'BEGIN\n\nSELECT *\n  FROM products\n  WHERE price > 500\n\n-- 3 rows returned', b: '',
        aStatus: 'Active', bStatus: 'Idle',
        data: [...baseProducts],
        aView: [...baseProducts],
        bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: "BEGIN\n\nINSERT INTO products\n  (name, price)\nVALUES\n  ('Monitor', 600)\n\n-- blocked, waiting...",
        aStatus: 'Active', bStatus: 'Blocked',
        data: [...baseProducts],
        aView: [...baseProducts],
        bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: 'COMMIT', b: '',
        aStatus: 'Committed', bStatus: 'Blocked',
        data: [...baseProducts],
        aView: null,
        bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: '-- lock released\nINSERT succeeds',
        aStatus: 'Committed', bStatus: 'Committed',
        data: [...allProducts],
        aView: null,
        bView: null,
        aFlash: false, bFlash: false,
        warning: null, warningColor: '',
      },
      {
        a: '', b: '',
        aStatus: 'Committed', bStatus: 'Committed',
        data: [...allProducts],
        aView: null,
        bView: null,
        aFlash: false, bFlash: false,
        warning: 'No anomaly: B waited for A to finish before writing', warningColor: s.green,
      },
    ],
  },
]

const comparisonData = [
  { level: 'Read Uncommitted', dirty: false, nonRepeat: false, phantom: false },
  { level: 'Read Committed', dirty: true, nonRepeat: false, phantom: false },
  { level: 'Repeatable Read', dirty: true, nonRepeat: true, phantom: false },
  { level: 'Serializable', dirty: true, nonRepeat: true, phantom: true },
]

export default function IsolationDemo() {
  const [si, setSi] = useState(0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [flash, setFlash] = useState(false)
  const [speed, setSpeed] = useState(1)

  const sc = scenarios[si]
  const cur = sc.steps[step]

  const reset = useCallback(() => {
    setStep(0)
    setPlaying(false)
    setFlash(false)
  }, [])

  useEffect(() => { reset() }, [si, reset])

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      setStep(p => {
        if (p < sc.steps.length - 1) return p + 1
        setPlaying(false)
        return p
      })
    }, getStepDelay(2000, speed))
    return () => clearTimeout(t)
  }, [playing, step, sc, speed])

  useEffect(() => {
    const sd = scenarios[si].steps[step]
    if (sd.warning) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), getStepDelay(1000, speed))
      return () => clearTimeout(t)
    }
  }, [step, si, speed])

  const next = () => {
    if (step < sc.steps.length - 1) setStep(step + 1)
    else setPlaying(false)
  }

  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  const togglePlay = () => {
    if (step >= sc.steps.length - 1) {
      setStep(0)
      setFlash(false)
      setPlaying(true)
    } else {
      setPlaying(p => !p)
    }
  }

  const statusColor = (status: string) => {
    if (status === 'Blocked') return s.orange
    if (status === 'Committed') return s.green
    if (status === 'Rolled back') return s.red
    if (status === 'Active' || status === 'Reading') return s.accent
    if (status === 'Uncommitted') return s.yellow
    return s.text3
  }

  const panelBorder = (isHL: boolean, wColor: string, status: string) => {
    if (status === 'Blocked') return s.orange
    if (isHL && flash) return wColor
    return s.border
  }

  const renderPanel = (
    label: string,
    labelColor: string,
    status: string,
    sql: string,
    view: { name: string; price: string }[] | null,
    isHL: boolean,
    wColor: string,
    isNewRow: (name: string) => boolean,
  ) => (
    <div style={{
      padding: 16,
      background: s.bg2,
      borderRadius: 8,
      border: `1px solid ${panelBorder(isHL, wColor, status)}`,
      transition: 'border-color 0.3s',
      minHeight: 120,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: labelColor, fontWeight: 600, fontSize: 14 }}>{label}</span>
        <span style={{
          padding: '2px 10px',
          borderRadius: 4,
          fontSize: 11,
          fontFamily: s.mono,
          background: `${statusColor(status)}15`,
          color: statusColor(status),
        }}>
          {status}
        </span>
      </div>
      {sql && (
        <div style={{
          padding: '8px 12px',
          background: s.bg,
          borderRadius: 6,
          fontFamily: s.mono,
          fontSize: 12,
          color: s.text2,
          marginBottom: view ? 12 : 0,
          whiteSpace: 'pre-line',
          lineHeight: 1.5,
        }}>
          {sql}
        </div>
      )}
      {view && (
        <div>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, fontFamily: s.mono }}>Sees:</div>
          {view.map((row, i) => (
            <div key={`${row.name}-${i}`} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              background: isHL && flash ? `${wColor}15` : s.bg,
              borderRadius: 4,
              marginBottom: 4,
              transition: 'background 0.3s',
              borderLeft: isNewRow(row.name) ? `2px solid ${wColor}` : '2px solid transparent',
            }}>
              <span style={{ color: s.text2, fontSize: 13 }}>{row.name}</span>
              <span style={{
                color: isHL && flash ? wColor : s.accent,
                fontFamily: s.mono,
                fontSize: 13,
                fontWeight: 500,
              }}>
                {row.price}
              </span>
            </div>
          ))}
        </div>
      )}
      {!sql && !view && (
        <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono, fontStyle: 'italic' }}>
          Waiting...
        </div>
      )}
    </div>
  )

  const btnBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 6,
    border: `1px solid ${s.border}`,
    background: s.bg3,
    color: s.text2,
    cursor: 'pointer',
    fontFamily: s.mono,
    fontSize: 12,
    transition: 'all 0.2s',
  }

  return (
    <DemoBoundary name="Isolation Levels">
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: s.bg,
        padding: 24,
        borderRadius: 12,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {scenarios.map((sc, i) => (
            <button
              key={sc.name}
              onClick={() => setSi(i)}
              style={{
                ...btnBase,
                border: `1px solid ${i === si ? s.accent : s.border}`,
                background: i === si ? s.bg3 : 'transparent',
                color: i === si ? s.text : s.text3,
              }}
            >
              {sc.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>Isolation Level:</span>
          <span style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: comparisonData[si].phantom ? `${s.green}15` : comparisonData[si].dirty ? `${s.yellow}15` : `${s.red}15`,
            color: comparisonData[si].phantom ? s.green : comparisonData[si].dirty ? s.yellow : s.red,
            fontFamily: s.mono,
            fontSize: 13,
          }}>
            {sc.level}
          </span>
        </div>

        <div style={{
          padding: 12,
          background: s.bg2,
          borderRadius: 8,
          border: `1px solid ${s.border}`,
          marginBottom: 16,
        }}>
          <div style={{
            color: s.text3,
            fontSize: 11,
            fontFamily: s.mono,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Committed Data
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {cur.data.map((row, i) => (
              <div key={`${row.name}-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: s.text2, fontSize: 14 }}>{row.name}</span>
                <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 14, fontWeight: 500 }}>{row.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {renderPanel(
            'Transaction A',
            s.accent,
            cur.aStatus,
            cur.a,
            cur.aView,
            cur.aFlash,
            cur.warningColor,
            (name) => si === 2 && step === 3 && name === 'Monitor',
          )}
          {renderPanel(
            'Transaction B',
            s.purple,
            cur.bStatus,
            cur.b,
            cur.bView,
            cur.bFlash,
            cur.warningColor,
            () => false,
          )}
        </div>

        {cur.warning && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            background: cur.warningColor === s.green ? `${s.green}08` : `${cur.warningColor}12`,
            border: `1px solid ${cur.warningColor}30`,
            color: cur.warningColor,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: s.mono,
          }}>
            {cur.warning}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={prev} disabled={step === 0} style={{
            ...btnBase,
            opacity: step === 0 ? 0.4 : 1,
            cursor: step === 0 ? 'not-allowed' : 'pointer',
          }}>
            Prev
          </button>
          <button onClick={togglePlay} style={{
            ...btnBase,
            background: playing ? `${s.accent}20` : s.bg3,
            color: playing ? s.accent : s.text2,
          }}>
            {playing ? 'Pause' : step >= sc.steps.length - 1 ? 'Replay' : 'Play'}
          </button>
          <button onClick={next} disabled={step === sc.steps.length - 1} style={{
            ...btnBase,
            opacity: step === sc.steps.length - 1 ? 0.4 : 1,
            cursor: step === sc.steps.length - 1 ? 'not-allowed' : 'pointer',
          }}>
            Next
          </button>
          <button onClick={reset} style={btnBase}>Reset</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {sc.steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i <= step ? s.accent : s.bg3,
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            {step + 1}/{sc.steps.length}
          </span>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{
          padding: 12,
          background: s.bg2,
          borderRadius: 8,
          border: `1px solid ${s.border}`,
          marginBottom: 24,
        }}>
          <div style={{
            color: s.text3,
            fontSize: 11,
            fontFamily: s.mono,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Timeline
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 0 }}>
            <div style={{ padding: '4px 8px', color: s.text3, fontSize: 11, fontFamily: s.mono, borderBottom: `1px solid ${s.border}` }} />
            <div style={{ padding: '4px 8px', color: s.accent, fontSize: 11, fontFamily: s.mono, borderBottom: `1px solid ${s.border}` }}>Tx A</div>
            <div style={{ padding: '4px 8px', color: s.purple, fontSize: 11, fontFamily: s.mono, borderBottom: `1px solid ${s.border}` }}>Tx B</div>
            {sc.steps.slice(0, step + 1).map((st, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <div style={{
                  padding: '5px 8px',
                  color: i === step ? s.accent : s.text3,
                  fontSize: 11,
                  fontFamily: s.mono,
                  background: i === step ? s.bg3 : 'transparent',
                  borderBottom: i < step ? `1px solid ${s.border2}` : 'none',
                }}>
                  {i + 1}
                </div>
                <div style={{
                  padding: '5px 8px',
                  color: i === step ? s.text : s.text3,
                  fontSize: 11,
                  fontFamily: s.mono,
                  whiteSpace: 'pre-line',
                  background: i === step ? s.bg3 : 'transparent',
                  borderBottom: i < step ? `1px solid ${s.border2}` : 'none',
                  lineHeight: 1.4,
                }}>
                  {st.a || '--'}
                </div>
                <div style={{
                  padding: '5px 8px',
                  color: i === step ? s.text : s.text3,
                  fontSize: 11,
                  fontFamily: s.mono,
                  whiteSpace: 'pre-line',
                  background: i === step ? s.bg3 : 'transparent',
                  borderBottom: i < step ? `1px solid ${s.border2}` : 'none',
                  lineHeight: 1.4,
                }}>
                  {st.b || '--'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: 16,
          background: s.bg2,
          borderRadius: 8,
          border: `1px solid ${s.border}`,
        }}>
          <div style={{
            color: s.text3,
            fontSize: 11,
            fontFamily: s.mono,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Isolation Levels vs Anomalies
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${s.border}`, marginBottom: 0 }}>
              <div style={{ flex: 1.2, padding: '8px 12px', color: s.text3, fontSize: 12, fontFamily: s.mono }}>Level</div>
              <div style={{ flex: 1, padding: '8px 12px', color: s.text3, fontSize: 12, fontFamily: s.mono, textAlign: 'center' }}>Dirty Read</div>
              <div style={{ flex: 1, padding: '8px 12px', color: s.text3, fontSize: 12, fontFamily: s.mono, textAlign: 'center' }}>Non-Repeatable</div>
              <div style={{ flex: 1, padding: '8px 12px', color: s.text3, fontSize: 12, fontFamily: s.mono, textAlign: 'center' }}>Phantom</div>
            </div>
            {comparisonData.map((row, i) => {
              const isCurrent = i === si
              const bg = isCurrent ? `${s.accent}08` : 'transparent'
              const cells: boolean[] = [row.dirty, row.nonRepeat, row.phantom]
              return (
                <div key={row.level} style={{ display: 'flex', borderBottom: `1px solid ${s.border2}` }}>
                  <div style={{
                    flex: 1.2,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontFamily: s.mono,
                    color: isCurrent ? s.accent : s.text2,
                    fontWeight: isCurrent ? 600 : 400,
                    background: bg,
                  }}>
                    {row.level}
                  </div>
                  {cells.map((prevents, j) => (
                    <div key={j} style={{
                      flex: 1,
                      padding: '8px 12px',
                      textAlign: 'center',
                      background: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: prevents ? s.green : s.red,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        color: prevents ? s.green : s.red,
                        fontSize: 11,
                        fontFamily: s.mono,
                      }}>
                        {prevents ? 'Prevents' : 'Allows'}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
