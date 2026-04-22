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

export default function UberCapacityDemo() {
  const [rides, setRides] = useState(100)
  const [drivers, setDrivers] = useState(5)
  const [riders, setRiders] = useState(15)
  const [rideBytes, setRideBytes] = useState(1)

  const dailyRides = rides * 1e6
  const ridesPerSec = dailyRides / 86400
  const onlineDrivers = drivers * 1e6
  const driverQPS = onlineDrivers
  const onlineRiders = riders * 1e6
  const concurrentConns = onlineDrivers + onlineRiders
  const dailyStorage = dailyRides * rideBytes * 1024
  const yearlyStorage = dailyStorage * 365

  const rows = useMemo(() => [
    { label: 'Daily Rides', value: `${fmt(dailyRides)}`, color: s.accent },
    { label: 'Rides / Second', value: `${fmt(ridesPerSec)}/s`, color: s.green },
    { label: 'Online Drivers', value: fmt(onlineDrivers), color: s.purple },
    { label: 'Driver GPS QPS', value: `${fmt(driverQPS)}/s`, color: s.orange },
    { label: 'Online Riders', value: fmt(onlineRiders), color: s.accent },
    { label: 'Concurrent Connections', value: fmt(concurrentConns), color: s.yellow },
    { label: 'Daily Storage', value: `${(dailyStorage / 1e9).toFixed(0)} GB`, color: s.text2 },
    { label: 'Yearly Storage', value: `${(yearlyStorage / 1e12).toFixed(1)} TB`, color: s.text3 },
  ], [dailyRides, ridesPerSec, onlineDrivers, driverQPS, onlineRiders, concurrentConns, dailyStorage, yearlyStorage])

  const slider = (label: string, value: number, min: number, max: number, step: number, unit: string, setter: (v: number) => void) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: s.text2 }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setter(Number(e.target.value))}
        style={{ width: '100%', accentColor: s.accent, height: 4, cursor: 'pointer' }}
      />
    </div>
  )

  return (
    <DemoBoundary name="Uber Capacity Estimation">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 14 }}>Input Parameters</div>
            {slider('Daily Rides', rides, 10, 500, 10, 'M', setRides)}
            {slider('Online Drivers', drivers, 1, 20, 0.5, 'M', setDrivers)}
            {slider('Active Riders', riders, 5, 50, 1, 'M', setRiders)}
            {slider('Bytes per Ride', rideBytes, 0.5, 5, 0.5, ' KB', setRideBytes)}
          </div>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 14 }}>Calculated Metrics</div>
            {rows.map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${s.bg3}` }}>
                <span style={{ fontSize: 13, color: s.text3 }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: s.mono, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            {dailyRides.toLocaleString()} rides/day / 86400 sec = {ridesPerSec.toFixed(0)} rides/sec | {fmt(driverQPS)} drivers x 1 update/sec = {fmt(driverQPS)} GPS QPS | {fmt(onlineDrivers)} + {fmt(onlineRiders)} = {fmt(concurrentConns)} WebSocket connections
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
