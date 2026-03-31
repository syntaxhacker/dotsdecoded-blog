import { useState } from 'react'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export default function ScalingDemo() {
  const [rps, setRps] = useState(1000)
  const [sqlLevel, setSqlLevel] = useState(1)

  const sqlCapacity = sqlLevel * 3000
  const sqlUsage = clamp(rps / sqlCapacity, 0, 1)
  const sqlOverloaded = sqlUsage > 0.85
  const sqlCpu = clamp(sqlUsage * 100 + (Math.random() * 2 - 1), 0, 100)
  const sqlRam = clamp(sqlUsage * 80 + 15, 0, 100)
  const sqlDisk = clamp(sqlUsage * 60 + 20, 0, 100)
  const sqlCost = sqlLevel * 2000

  const nosqlServerCap = 1500
  const nosqlServers = Math.max(1, Math.ceil(rps / nosqlServerCap))
  const nosqlCost = nosqlServers * 400
  const nosqlOverloaded = rps > nosqlServers * nosqlServerCap * 0.9

  const sqlLatency = sqlOverloaded ? (120 + sqlUsage * 400).toFixed(0) : (5 + sqlUsage * 30).toFixed(0)
  const nosqlLatency = nosqlOverloaded ? (30 + sqlUsage * 80).toFixed(0) : (3 + (rps / (nosqlServers * nosqlServerCap)) * 15).toFixed(0)
  const sqlThroughput = Math.min(rps, sqlCapacity).toLocaleString()
  const nosqlThroughput = rps.toLocaleString()

  const sqlMaxUpgrade = 4

  const barColor = (pct: number, overloaded: boolean) => {
    if (overloaded && pct > 75) return s.red
    if (pct > 70) return s.yellow
    return s.green
  }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: s.bg2, borderRadius: 8, padding: '14px 18px', border: `1px solid ${s.border}` }}>
          <span style={{ fontSize: 13, color: s.text2, whiteSpace: 'nowrap' }}>Requests per second</span>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={rps}
            onChange={e => setRps(Number(e.target.value))}
            style={{ flex: 1, accentColor: s.accent, height: 6 }}
          />
          <span style={{ fontFamily: s.mono, fontSize: 14, color: s.accent, minWidth: 60, textAlign: 'right' }}>
            {rps.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: s.text }}>
              Vertical Scaling (SQL)
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14, minHeight: 100 }}>
              <div style={{
                width: 60 + sqlLevel * 18,
                height: 50 + sqlLevel * 14,
                background: sqlOverloaded ? s.red : s.accent,
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.4s ease',
                opacity: 0.15 + sqlLevel * 0.15,
                position: 'relative',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: s.bg, fontWeight: 700 }}>SQL</span>
                <span style={{ fontFamily: s.mono, fontSize: 9, color: s.bg, opacity: 0.8 }}>
                  Tier {sqlLevel}
                </span>
              </div>
            </div>

            {['CPU', 'RAM', 'Disk'].map(label => {
              const pct = label === 'CPU' ? sqlCpu : label === 'RAM' ? sqlRam : sqlDisk
              return (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>{label}</span>
                    <span style={{ fontSize: 11, color: barColor(pct, sqlOverloaded), fontFamily: s.mono }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: s.bg3, borderRadius: 3 }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: barColor(pct, sqlOverloaded),
                      borderRadius: 3,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }} />
                  </div>
                </div>
              )
            })}

            {sqlOverloaded && (
              <div style={{
                background: `${s.red}15`,
                border: `1px solid ${s.red}40`,
                borderRadius: 6,
                padding: '8px 10px',
                marginTop: 10,
                fontSize: 11,
                color: s.red,
                lineHeight: 1.4,
              }}>
                Single server at capacity! Need a bigger machine ($$$)
              </div>
            )}

            <button
              disabled={sqlLevel >= sqlMaxUpgrade}
              onClick={() => setSqlLevel(l => l + 1)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '8px 0',
                borderRadius: 6,
                border: `1px solid ${sqlLevel >= sqlMaxUpgrade ? s.border : s.accent}`,
                background: sqlLevel >= sqlMaxUpgrade ? s.bg3 : `${s.accent}20`,
                color: sqlLevel >= sqlMaxUpgrade ? s.text3 : s.accent,
                fontFamily: s.mono,
                fontSize: 12,
                cursor: sqlLevel >= sqlMaxUpgrade ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {sqlLevel >= sqlMaxUpgrade ? 'Max tier reached' : `Upgrade to Tier ${sqlLevel + 1} (+$${((sqlLevel + 1) * 2000).toLocaleString()}/mo)`}
            </button>

            <div style={{ marginTop: 8, fontSize: 11, color: s.text3, textAlign: 'center' }}>
              Capacity: {sqlCapacity.toLocaleString()} rps | Cost: ${sqlCost.toLocaleString()}/mo
            </div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: s.text }}>
              Horizontal Scaling (NoSQL)
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              marginBottom: 14,
              minHeight: 100,
              alignItems: 'center',
            }}>
              {Array.from({ length: nosqlServers }, (_, i) => {
                const serverLoad = clamp(rps / nosqlServers / nosqlServerCap, 0, 1)
                const thisServerRps = Math.round(rps / nosqlServers)
                return (
                  <div
                    key={i}
                    style={{
                      width: 52,
                      height: 40,
                      background: serverLoad > 0.85 ? s.yellow : s.green,
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.2 + clamp(serverLoad, 0.2, 0.8),
                      transition: 'all 0.4s ease',
                      animation: i === nosqlServers - 1 && nosqlOverloaded ? 'fadeIn 0.4s ease' : undefined,
                    }}
                  >
                    <span style={{ fontFamily: s.mono, fontSize: 8, color: s.bg, fontWeight: 700 }}>N{ i + 1}</span>
                    <span style={{ fontFamily: s.mono, fontSize: 7, color: s.bg, opacity: 0.8 }}>
                      {thisServerRps}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, background: s.bg, borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Servers</div>
                <div style={{ fontFamily: s.mono, fontSize: 16, color: s.green }}>{nosqlServers}</div>
              </div>
              <div style={{ flex: 1, background: s.bg, borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Total Cap</div>
                <div style={{ fontFamily: s.mono, fontSize: 16, color: s.accent }}>
                  {(nosqlServers * nosqlServerCap).toLocaleString()}
                </div>
              </div>
            </div>

            {nosqlOverloaded && (
              <div style={{
                background: `${s.yellow}15`,
                border: `1px solid ${s.yellow}40`,
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 11,
                color: s.yellow,
                lineHeight: 1.4,
              }}>
                Auto-scale: adding more servers
              </div>
            )}

            {!nosqlOverloaded && rps > 500 && (
              <div style={{
                background: `${s.green}15`,
                border: `1px solid ${s.green}40`,
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 11,
                color: s.green,
                lineHeight: 1.4,
              }}>
                {nosqlServers} servers handling load evenly
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 11, color: s.text3, textAlign: 'center' }}>
              Capacity: {(nosqlServers * nosqlServerCap).toLocaleString()} rps | Cost: ${nosqlCost.toLocaleString()}/mo
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          background: s.bg2,
          borderRadius: 8,
          padding: 14,
          border: `1px solid ${s.border}`,
        }}>
          {[
            { label: 'Cost / month', sql: `$${sqlCost.toLocaleString()}`, nosql: `$${nosqlCost.toLocaleString()}`, better: sqlCost <= nosqlCost ? 'sql' : 'nosql' },
            { label: 'Avg Latency', sql: `${sqlLatency}ms`, nosql: `${nosqlLatency}ms`, better: Number(sqlLatency) <= Number(nosqlLatency) ? 'sql' : 'nosql' },
            { label: 'Throughput', sql: `${sqlThroughput} rps`, nosql: `${nosqlThroughput} rps`, better: Number(sqlThroughput.replace(/,/g, '')) >= Number(nosqlThroughput.replace(/,/g, '')) ? 'sql' : 'nosql' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, textAlign: 'center' }}>{m.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: 4,
                  background: m.better === 'sql' ? `${s.accent}15` : 'transparent',
                  border: `1px solid ${m.better === 'sql' ? s.accent + '40' : s.border}`,
                }}>
                  <div style={{ fontSize: 9, color: s.text3, marginBottom: 2 }}>SQL</div>
                  <div style={{ fontFamily: s.mono, fontSize: 12, color: m.better === 'sql' ? s.accent : s.text2 }}>
                    {m.sql}
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: 4,
                  background: m.better === 'nosql' ? `${s.green}15` : 'transparent',
                  border: `1px solid ${m.better === 'nosql' ? s.green + '40' : s.border}`,
                }}>
                  <div style={{ fontSize: 9, color: s.text3, marginBottom: 2 }}>NoSQL</div>
                  <div style={{ fontFamily: s.mono, fontSize: 12, color: m.better === 'nosql' ? s.green : s.text2 }}>
                    {m.nosql}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
