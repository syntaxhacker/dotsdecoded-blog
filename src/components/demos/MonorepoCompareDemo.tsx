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

const COLUMNS = ['pnpm\nWorkspaces', 'Turborepo', 'Nx', 'Bazel']

interface CellData {
  value: string
  rating: 'high' | 'medium' | 'low' | 'none'
}

interface RowData {
  feature: string
  cells: CellData[]
}

const ROWS: RowData[] = [
  {
    feature: 'Setup\nComplexity',
    cells: [
      { value: 'Low', rating: 'high' },
      { value: 'Low-Medium', rating: 'medium' },
      { value: 'Medium', rating: 'medium' },
      { value: 'High', rating: 'low' },
    ],
  },
  {
    feature: 'Caching',
    cells: [
      { value: 'None', rating: 'none' },
      { value: 'Content-hash per task', rating: 'high' },
      { value: 'Computation graph', rating: 'high' },
      { value: 'Content-addressed', rating: 'high' },
    ],
  },
  {
    feature: 'Remote\nCaching',
    cells: [
      { value: 'Not built-in', rating: 'none' },
      { value: 'Built-in (Vercel)', rating: 'high' },
      { value: 'Nx Cloud', rating: 'high' },
      { value: 'Built-in', rating: 'high' },
    ],
  },
  {
    feature: 'Parallel\nExecution',
    cells: [
      { value: 'Not built-in', rating: 'none' },
      { value: 'Topological', rating: 'medium' },
      { value: 'Task graph', rating: 'high' },
      { value: 'Distributed', rating: 'high' },
    ],
  },
  {
    feature: 'Incremental\nBuilds',
    cells: [
      { value: 'Not built-in', rating: 'none' },
      { value: 'Cache-based', rating: 'medium' },
      { value: 'Affected graph', rating: 'high' },
      { value: 'Hermetic', rating: 'high' },
    ],
  },
  {
    feature: 'Dependency\nGraph',
    cells: [
      { value: 'Native only', rating: 'medium' },
      { value: 'Imported', rating: 'medium' },
      { value: 'Built-in', rating: 'high' },
      { value: 'Built-in', rating: 'high' },
    ],
  },
  {
    feature: 'Best For',
    cells: [
      { value: 'Small projects', rating: 'medium' },
      { value: 'Medium monorepos', rating: 'high' },
      { value: 'Large monorepos', rating: 'high' },
      { value: 'Monorepos at scale', rating: 'medium' },
    ],
  },
]

const RATING_COLORS: Record<string, string> = {
  high: s.green,
  medium: s.yellow,
  low: s.orange,
  none: s.red,
}

const RATING_BG: Record<string, string> = {
  high: `${s.green}15`,
  medium: `${s.yellow}10`,
  low: `${s.orange}10`,
  none: `${s.red}08`,
}

export default function MonorepoCompareDemo() {
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  return (
    <DemoBoundary name="Monorepo Tool Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Tool Comparison</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click a row for more details on each dimension.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
            fontFamily: s.mono, fontSize: 12,
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: '10px 12px', textAlign: 'left',
                  color: s.text3, fontWeight: 600, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: 1,
                  borderBottom: `2px solid ${s.border}`,
                  background: s.bg3, borderRadius: '8px 0 0 0',
                }}>
                  Feature
                </th>
                {COLUMNS.map((col, idx) => (
                  <th key={idx} style={{
                    padding: '10px 12px', textAlign: 'center',
                    color: s.text, fontWeight: 600, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: 1,
                    borderBottom: `2px solid ${s.border}`,
                    background: s.bg3,
                    borderRadius: idx === COLUMNS.length - 1 ? '0 8px 0 0' : 0,
                    whiteSpace: 'pre-line',
                    lineHeight: 1.3,
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rIdx) => (
                <tr key={rIdx} onClick={() => setSelectedRow(selectedRow === rIdx ? null : rIdx)} style={{
                  cursor: 'pointer',
                  background: selectedRow === rIdx ? `${s.accent}08` : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <td style={{
                    padding: '10px 12px',
                    color: s.text2, fontWeight: 600, fontSize: 11,
                    borderBottom: `1px solid ${s.border}`,
                    whiteSpace: 'pre-line',
                    lineHeight: 1.3,
                  }}>
                    {row.feature}
                  </td>
                  {row.cells.map((cell, cIdx) => (
                    <td key={cIdx} style={{
                      padding: '8px 10px', textAlign: 'center',
                      borderBottom: `1px solid ${s.border}`,
                      background: cell.rating === 'high' ? RATING_BG.high : RATING_BG[cell.rating],
                      transition: 'background 0.2s',
                    }}>
                      <div style={{
                        color: RATING_COLORS[cell.rating],
                        fontSize: 11, fontWeight: 600,
                        lineHeight: 1.3,
                      }}>
                        {cell.value === 'Not built-in' || cell.value === 'None'
                          ? <span style={{ color: s.text3 }}>{cell.value}</span>
                          : cell.value}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
          {Object.entries(RATING_COLORS).map(([key, color]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ color: s.text3, fontSize: 11, textTransform: 'capitalize' }}>
                {key === 'none' ? 'Not available' : key}
              </span>
            </div>
          ))}
        </div>

        {selectedRow !== null && (
          <div style={{
            marginTop: 16, borderTop: `1px solid ${s.border}`,
            paddingTop: 16, background: s.bg, borderRadius: 8, padding: 16,
          }}>
            <div style={{ color: s.text, fontSize: 13, fontWeight: 600, marginBottom: 10, whiteSpace: 'pre-line' }}>
              {ROWS[selectedRow].feature.replace('\n', ' ')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROWS[selectedRow].cells.map((cell, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    minWidth: 100, textAlign: 'right',
                    color: s.text2, fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {COLUMNS[idx].replace('\n', ' ')}
                  </div>
                  <div style={{
                    flex: 1, padding: '4px 10px', borderRadius: 4,
                    background: RATING_BG[cell.rating],
                    color: RATING_COLORS[cell.rating],
                    fontSize: 12,
                  }}>
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
