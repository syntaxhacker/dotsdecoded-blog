import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

export default function AmazonCapacityDemo() {
  const [users, setUsers] = useState(300)
  const [dau, setDau] = useState(100)
  const [orders, setOrders] = useState(10)
  const [products, setProducts] = useState(2)
  const [searches, setSearches] = useState(100)

  const totalUsers = users * 1e6
  const dailyActive = dau * 1e6
  const dailyOrders = orders * 1e6
  const ordersPerSec = dailyOrders / 86400
  const totalProducts = products * 1e9
  const dailySearches = searches * 1e6
  const searchQPS = dailySearches / 86400
  const peakQPS = searchQPS * 5
  const catalogSize = totalProducts * 5 * 1024

  const rows = useMemo(() => [
    { label: 'Total Users', value: fmt(totalUsers), color: s.accent },
    { label: 'Daily Active Users', value: fmt(dailyActive), color: s.green },
    { label: 'Daily Orders', value: fmt(dailyOrders), color: s.orange },
    { label: 'Orders / Second', value: `${fmt(ordersPerSec)}/s`, color: s.purple },
    { label: 'Total Products', value: fmt(totalProducts), color: s.accent },
    { label: 'Daily Searches', value: fmt(dailySearches), color: s.yellow },
    { label: 'Search QPS (avg)', value: `${fmt(searchQPS)}/s`, color: s.text2 },
    { label: 'Search QPS (peak 5x)', value: `${fmt(peakQPS)}/s`, color: s.red },
    { label: 'Catalog Storage', value: `${(catalogSize / 1e12).toFixed(0)} TB`, color: s.text3 },
  ], [totalUsers, dailyActive, dailyOrders, ordersPerSec, totalProducts, dailySearches, searchQPS, peakQPS, catalogSize])

  const slider = (label: string, value: number, min: number, max: number, step: number, unit: string, setter: (v: number) => void) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: s.text2 }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setter(Number(e.target.value))}
        style={{ width: '100%', accentColor: s.accent, height: 4, cursor: 'pointer' }} />
    </div>
  )

  return (
    <DemoBoundary name="Amazon Capacity Estimation">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 14 }}>Input Parameters</div>
            {slider('Total Users', users, 10, 1000, 10, 'M', setUsers)}
            {slider('DAU', dau, 10, 500, 10, 'M', setDau)}
            {slider('Daily Orders', orders, 1, 50, 1, 'M', setOrders)}
            {slider('Products', products, 0.1, 10, 0.1, 'B', setProducts)}
            {slider('Daily Searches', searches, 10, 500, 10, 'M', setSearches)}
          </div>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 14 }}>Calculated Metrics</div>
            {rows.map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${s.bg3}` }}>
                <span style={{ fontSize: 13, color: s.text3 }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: s.mono, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            {fmt(dailyOrders)} orders/day / 86400 sec = {ordersPerSec.toFixed(0)} orders/sec | {fmt(dailySearches)} searches/day = {searchQPS.toFixed(0)} QPS (avg), {peakQPS.toFixed(0)} QPS (peak) | {fmt(totalProducts)} products x 5KB = {(catalogSize / 1e12).toFixed(0)} TB catalog
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
