import { useState, useEffect, useRef, useCallback } from 'react'
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

function fmtBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.round(mb)} MB`
}

export default function CgroupDemo() {
  const [cpuLimit, setCpuLimit] = useState(2)
  const [memLimit, setMemLimit] = useState(1024)
  const [ioLimit, setIoLimit] = useState(500)
  const [limitsOn, setLimitsOn] = useState(false)
  const [running, setRunning] = useState(false)
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memUsage, setMemUsage] = useState(128)
  const [ioUsage, setIoUsage] = useState(0)
  const [throttled, setThrottled] = useState(false)
  const [throttleMsg, setThrottleMsg] = useState('')
  const [speed, setSpeed] = useState(1)
  const [intensity, setIntensity] = useState(50)
  const tickRef = useRef(0)
  const runningRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    if (!runningRef.current) return
    tickRef.current += 1
    const demand = intensity / 100
    const targetCpu = 4 * demand + Math.random() * 0.5
    const targetMem = memLimit * demand * 0.8 + Math.random() * 10
    const targetIo = 800 * demand + Math.random() * 50

    if (limitsOn) {
      let newCpu = Math.min(targetCpu, cpuLimit)
      let newMem = Math.min(targetMem, memLimit)
      let newIo = Math.min(targetIo, ioLimit)
      let wasThrottled = false
      let msgs: string[] = []

      if (targetCpu > cpuLimit) {
        wasThrottled = true
        msgs.push(`CPU capped at ${cpuLimit.toFixed(1)} cores (requested ${targetCpu.toFixed(1)})`)
        newCpu = cpuLimit
      }
      if (targetMem > memLimit) {
        wasThrottled = true
        msgs.push(`Memory capped at ${fmtBytes(memLimit)} (requested ${fmtBytes(targetMem)})`)
        newMem = memLimit
      }
      if (targetIo > ioLimit) {
        wasThrottled = true
        msgs.push(`I/O capped at ${ioLimit} IOPS (requested ${Math.round(targetIo)})`)
        newIo = ioLimit
      }

      setCpuUsage(Math.round(newCpu * 100) / 100)
      setMemUsage(Math.round(newMem * 10) / 10)
      setIoUsage(Math.round(newIo))

      if (wasThrottled && tickRef.current % 3 === 0) {
        setThrottled(true)
        setThrottleMsg(msgs.join('; '))
        setTimeout(() => {
          setThrottled(false)
          setThrottleMsg('')
        }, 1200)
      }
    } else {
      setCpuUsage(Math.round(targetCpu * 100) / 100)
      setMemUsage(Math.round(targetMem * 10) / 10)
      setIoUsage(Math.round(targetIo))
    }
  }, [limitsOn, cpuLimit, memLimit, ioLimit, intensity])

  useEffect(() => {
    if (running) {
      runningRef.current = true
      tickRef.current = 0
      const id = setInterval(tick, getStepDelay(200, speed))
      intervalRef.current = id
      return () => {
        clearInterval(id)
        intervalRef.current = null
      }
    } else {
      runningRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setCpuUsage(0)
      setMemUsage(128)
      setIoUsage(0)
    }
  }, [running, tick, speed])

  const cpuPct = limitsOn ? Math.min((cpuUsage / cpuLimit) * 100, 100) : Math.min((cpuUsage / 4) * 100, 100)
  const memPct = limitsOn ? Math.min((memUsage / memLimit) * 100, 100) : Math.min((memUsage / 8192) * 100, 100)
  const ioPct = limitsOn ? Math.min((ioUsage / ioLimit) * 100, 100) : Math.min((ioUsage / 1000) * 100, 100)

  return (
    <DemoBoundary name="Cgroup Resource Limits">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Cgroup Resource Limits</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Control groups limit CPU, memory, and I/O. Toggle limits on/off and adjust the stress load.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: s.bg2, borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setLimitsOn(false)}
            style={{
              background: !limitsOn ? s.yellow : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 16px',
              color: !limitsOn ? '#000' : s.text2,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            No Limits
          </button>
          <button
            onClick={() => setLimitsOn(true)}
            style={{
              background: limitsOn ? s.accent : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 16px',
              color: limitsOn ? '#fff' : s.text2,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            With Cgroup Limits
          </button>
        </div>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setRunning(!running)}
          style={{
            background: running ? s.red : s.green,
            border: 'none', borderRadius: 8, padding: '10px 24px',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {running ? 'Stop Stress' : 'Start Stress'}
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Load:</span>
          <input
            type="range" min={5} max={100} value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            style={{ flex: 1, accentColor: s.orange }}
          />
          <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12, minWidth: 30 }}>{intensity}%</span>
        </div>
      </div>

      {throttled && (
        <div style={{
          background: `${s.red}15`, border: `1px solid ${s.red}`, borderRadius: 8,
          padding: '8px 14px', marginBottom: 16, fontSize: 12, color: s.red,
          fontFamily: s.mono,
        }}>
          THROTTLED: {throttleMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: s.orange, fontSize: 13, fontWeight: 600 }}>CPU</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>
              {cpuUsage.toFixed(1)} / {limitsOn ? cpuLimit.toFixed(1) : '4.0'} cores
            </div>
          </div>
          {limitsOn && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>Limit (cores)</label>
              <input
                type="range" min={1} max={40} value={cpuLimit * 10}
                onChange={e => setCpuLimit(Number(e.target.value) / 10)}
                style={{ width: '100%', accentColor: s.orange }}
              />
            </div>
          )}
          <div style={{ height: 24, background: s.bg, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(cpuPct, 100)}%`,
              background: cpuPct > 90 && limitsOn ? s.red : s.orange,
              borderRadius: 6, transition: 'width 0.2s, background 0.3s',
            }} />
          </div>
          <div style={{ color: s.text3, fontSize: 11, marginTop: 6 }}>{cpuPct.toFixed(0)}% usage</div>
        </div>

        <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: s.accent, fontSize: 13, fontWeight: 600 }}>Memory</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>
              {fmtBytes(memUsage)} / {fmtBytes(limitsOn ? memLimit : 8192)}
            </div>
          </div>
          {limitsOn && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>Limit</label>
              <input
                type="range" min={64} max={8192} value={memLimit}
                onChange={e => setMemLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: s.accent }}
              />
            </div>
          )}
          <div style={{ height: 24, background: s.bg, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(memPct, 100)}%`,
              background: memPct > 90 && limitsOn ? s.red : s.accent,
              borderRadius: 6, transition: 'width 0.2s, background 0.3s',
            }} />
          </div>
          <div style={{ color: s.text3, fontSize: 11, marginTop: 6 }}>{memPct.toFixed(0)}% usage</div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: s.green, fontSize: 13, fontWeight: 600 }}>I/O</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>
            {ioUsage} / {limitsOn ? ioLimit : 1000} IOPS
          </div>
        </div>
        {limitsOn && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>Limit (IOPS)</label>
            <input
              type="range" min={1} max={1000} value={ioLimit}
              onChange={e => setIoLimit(Number(e.target.value))}
              style={{ width: '100%', accentColor: s.green }}
            />
          </div>
        )}
        <div style={{ height: 24, background: s.bg, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(ioPct, 100)}%`,
            background: ioPct > 90 && limitsOn ? s.red : s.green,
            borderRadius: 6, transition: 'width 0.2s, background 0.3s',
          }} />
        </div>
        <div style={{ color: s.text3, fontSize: 11, marginTop: 6 }}>{ioPct.toFixed(0)}% usage</div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          /sys/fs/cgroup (read-only view)
        </div>
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ color: s.text }}>/sys/fs/cgroup/container/</div>
          <div style={{ color: limitsOn ? s.text3 : s.text3 }}>
            {limitsOn ? (
              <>
                <div style={{ color: s.orange }}>cpu.max {cpuLimit.toFixed(1)} 100000</div>
                <div style={{ color: s.accent }}>memory.max {fmtBytes(memLimit).replace(' ', '')}</div>
                <div style={{ color: s.green }}>io.max 8:0 rbps={ioLimit * 1000} wbps={ioLimit * 1000}</div>
                <div style={{ color: s.red, marginTop: 6 }}>cpu.stat: nr_throttled {throttled ? tickRef.current : 0}</div>
                <div style={{ color: s.yellow }}>memory.current {fmtBytes(memUsage).replace(' ', '')}</div>
              </>
            ) : (
              <>
                <div style={{ color: s.text3 }}>cpu.max max 100000</div>
                <div style={{ color: s.text3 }}>memory.max max</div>
                <div style={{ color: s.text3 }}>io.max (unlimited)</div>
                <div style={{ color: s.text3, marginTop: 6 }}>cpu.stat: nr_throttled 0</div>
                <div style={{ color: s.text3 }}>memory.current {fmtBytes(memUsage).replace(' ', '')}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
