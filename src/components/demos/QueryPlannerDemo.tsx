import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

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

const TOTAL = 100
const IDX_PAGES = 2
const IO_MULT = 4

function rh(i: number): number {
  return (i * 7 + 13) % TOTAL
}

export default function QueryPlannerDemo() {
  const [sel, setSel] = useState(5)

  const matching = useMemo(() => {
    let c = 0
    for (let i = 0; i < TOTAL; i++) if (rh(i) < sel) c++
    return c
  }, [sel])

  const idxReads = IDX_PAGES + matching
  const idxCost = IDX_PAGES + matching * IO_MULT
  const fullCost = TOTAL

  const idxWins = sel <= 24
  const fullWins = sel >= 31
  const tie = !idxWins && !fullWins

  const maxVis = 22
  const idxVis = Math.min(matching, maxVis - IDX_PAGES)
  const idxOver = matching - idxVis

  const plan = idxWins
    ? `Index Scan using idx_status (cost=0.00..${idxCost.toFixed(2)})`
    : `Seq Scan on users (cost=0.00..${fullCost.toFixed(2)})`

  const alt = idxWins
    ? `Seq Scan on users (cost=0.00..${fullCost.toFixed(2)})`
    : `Index Scan using idx_status (cost=0.00..${idxCost.toFixed(2)})`

  const note = idxWins
    ? `Index scan reads ${IDX_PAGES} index pages + ${matching} data pages = ${idxReads} page reads vs ${fullCost} page reads for full scan. Even with ~${IO_MULT}x random I/O penalty per lookup, reading so few pages keeps total cost at ${idxCost.toFixed(0)} vs ${fullCost}.`
    : fullWins
      ? `Full scan reads ${fullCost} pages once (cost: ${fullCost}). Index scan would read ${IDX_PAGES} index pages + ${matching} data pages = ${idxReads} page reads, but random I/O overhead drives estimated cost to ${idxCost.toFixed(0)}.`
      : `Optimizer estimates similar cost \u2014 index: ${idxCost.toFixed(0)} vs sequential: ${fullCost}. May choose either plan.`

  const cardBorder = (winner: boolean) => {
    if (winner) return s.green
    if (tie) return s.yellow
    return s.border
  }

  const cardBg = (winner: boolean) => {
    if (winner) return 'rgba(61,214,140,0.05)'
    if (tie) return 'rgba(224,176,64,0.05)'
    return s.bg2
  }

  return (
    <DemoBoundary name="Query Planner">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg,
        padding: 24,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 4, letterSpacing: 0.3 }}>
          Query Planner
        </div>
        <div style={{ fontSize: 12, color: s.text3, marginBottom: 20 }}>
          Adjust selectivity to see how the optimizer chooses between index scan and full table scan
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: s.text2, minWidth: 76 }}>Selectivity</span>
          <input
            type="range"
            min={1}
            max={90}
            value={sel}
            onChange={(e) => setSel(Number(e.target.value))}
            style={{ flex: 1, height: 4, accentColor: s.accent, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: s.accent, fontFamily: s.mono, minWidth: 40, textAlign: 'right' }}>
            {sel}%
          </span>
        </div>
        <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono, marginBottom: 20 }}>
          {matching} of {TOTAL} rows match the query condition
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: 4,
          marginBottom: 24,
          padding: 16,
          background: s.bg2,
          borderRadius: 6,
          border: `1px solid ${s.border}`,
        }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 2,
              background: rh(i) < sel ? s.accent : s.bg3,
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{
            padding: 16,
            borderRadius: 6,
            border: `2px solid ${cardBorder(idxWins)}`,
            background: cardBg(idxWins),
            opacity: fullWins ? 0.5 : 1,
            transition: 'all 0.3s',
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: idxWins ? s.green : tie ? s.yellow : s.text,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              Index Scan
              {idxWins && <span style={{ fontSize: 10, fontWeight: 500, color: s.green, opacity: 0.8 }}>OPTIMAL</span>}
              {tie && <span style={{ fontSize: 10, fontWeight: 500, color: s.yellow, opacity: 0.8 }}>SIMILAR COST</span>}
            </div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
              {Array.from({ length: IDX_PAGES }, (_, i) => (
                <div key={`a${i}`} style={{ width: 14, height: 14, borderRadius: 2, background: s.accent, flexShrink: 0 }} />
              ))}
              {idxVis > 0 && Array.from({ length: idxVis }, (_, i) => (
                <div key={`b${i}`} style={{ width: 14, height: 14, borderRadius: 2, background: s.green, flexShrink: 0 }} />
              ))}
              {idxOver > 0 && (
                <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginLeft: 4 }}>+{idxOver} more</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 4 }}>
              {IDX_PAGES} index + {matching} data = {idxReads} page reads
            </div>
            <div style={{ fontSize: 12, color: s.text2, fontFamily: s.mono, marginBottom: 6 }}>
              Estimated cost: {idxCost.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: s.text3, fontStyle: 'italic' }}>
              random I/O: ~{IO_MULT}x cost per lookup
            </div>
          </div>

          <div style={{
            padding: 16,
            borderRadius: 6,
            border: `2px solid ${cardBorder(fullWins)}`,
            background: cardBg(fullWins),
            opacity: idxWins ? 0.5 : 1,
            transition: 'all 0.3s',
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: fullWins ? s.green : tie ? s.yellow : s.text,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              Full Table Scan
              {fullWins && <span style={{ fontSize: 10, fontWeight: 500, color: s.green, opacity: 0.8 }}>OPTIMAL</span>}
              {tie && <span style={{ fontSize: 10, fontWeight: 500, color: s.yellow, opacity: 0.8 }}>SIMILAR COST</span>}
            </div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
              {Array.from({ length: maxVis }, (_, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: s.orange, flexShrink: 0 }} />
              ))}
              <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginLeft: 4 }}>+{TOTAL - maxVis} more</span>
            </div>
            <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 4 }}>
              {TOTAL} sequential page reads
            </div>
            <div style={{ fontSize: 12, color: s.text2, fontFamily: s.mono, marginBottom: 6 }}>
              Estimated cost: {fullCost.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: s.text3, fontStyle: 'italic' }}>
              sequential I/O: reads pages in order
            </div>
          </div>
        </div>

        <div style={{
          padding: 14,
          background: s.bg2,
          borderRadius: 6,
          border: `1px solid ${s.border}`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: s.text3, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            EXPLAIN Output
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 12, marginBottom: tie ? 4 : 0 }}>
            <span style={{ color: tie ? s.yellow : s.green }}>{'-> '}</span>
            <span style={{ color: tie ? s.yellow : s.text }}>{plan}</span>
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
            {'   '}{alt}{!tie ? ' [rejected]' : ''}
          </div>
        </div>

        <div style={{
          fontSize: 12,
          color: s.text2,
          lineHeight: 1.7,
          padding: 14,
          borderRadius: 6,
          background: tie ? 'rgba(224,176,64,0.06)' : 'rgba(91,141,239,0.06)',
          border: `1px solid ${tie ? 'rgba(224,176,64,0.2)' : 'rgba(91,141,239,0.15)'}`,
        }}>
          {note}
        </div>
      </div>
    </DemoBoundary>
  )
}
