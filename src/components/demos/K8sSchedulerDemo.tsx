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

interface NodeData {
  name: string
  cpuTotal: number
  cpuUsed: number
  memTotal: number
  memUsed: number
}

const nodesData: NodeData[] = [
  { name: 'node-1', cpuTotal: 4, cpuUsed: 2.5, memTotal: 8, memUsed: 3 },
  { name: 'node-2', cpuTotal: 2, cpuUsed: 1.8, memTotal: 4, memUsed: 3.5 },
  { name: 'node-3', cpuTotal: 8, cpuUsed: 3, memTotal: 16, memUsed: 6 },
]

const podRequest = { cpu: 2, mem: 4 }

type Phase = 'pending' | 'filtering' | 'filtered' | 'scoring' | 'scored' | 'bound'

export default function K8sSchedulerDemo() {
  const [phase, setPhase] = useState<Phase>('pending')
  const [boundNode, setBoundNode] = useState<string | null>(null)

  const filteredNodes = nodesData.filter(n =>
    (n.cpuTotal - n.cpuUsed) >= podRequest.cpu &&
    (n.memTotal - n.memUsed) >= podRequest.mem
  )

  const scores = filteredNodes.map(n => {
    const cpuScore = ((n.cpuTotal - n.cpuUsed - podRequest.cpu) / n.cpuTotal) * 50
    const memScore = ((n.memTotal - n.memUsed - podRequest.mem) / n.memTotal) * 50
    return { name: n.name, score: Math.round((cpuScore + memScore) * 10) / 10 }
  })

  const bestNode = scores.length > 0 ? scores.reduce((a, b) => a.score > b.score ? a : b).name : null

  const nextPhase = () => {
    if (phase === 'pending') setPhase('filtering')
    else if (phase === 'filtering') setPhase('filtered')
    else if (phase === 'filtered') setPhase('scoring')
    else if (phase === 'scoring') setPhase('scored')
    else if (phase === 'scored') {
      setPhase('bound')
      setBoundNode(bestNode)
    }
  }

  const resetDemo = () => {
    setPhase('pending')
    setBoundNode(null)
  }

  const phaseDescriptions: Record<Phase, { title: string; desc: string }> = {
    pending: { title: 'Pod Pending', desc: 'A new Pod with a resource request of 2 CPU cores and 4 GB memory is waiting to be scheduled. The scheduler must find a suitable node.' },
    filtering: { title: 'Filtering (Predicates)', desc: 'The scheduler checks each node against the Pod\'s resource requirements. Nodes that do not have enough free CPU or memory are filtered out.' },
    filtered: { title: 'Filtered Nodes', desc: `Nodes that passed filtering: ${filteredNodes.map(n => n.name).join(', ') || 'none'}. Only nodes with sufficient resources proceed to scoring.` },
    scoring: { title: 'Scoring (Priorities)', desc: 'The scheduler scores each remaining node based on how much resources would remain after placing the Pod. Higher remaining resources = higher score.' },
    scored: { title: 'Scoring Complete', desc: `Scores calculated. ${bestNode ? `Node "${bestNode}" has the highest score and will be selected.` : 'No suitable node found.'}` },
    bound: { title: 'Binding', desc: `${bestNode ? `The Pod is bound to "${boundNode}". The scheduler creates a Binding object, and the kubelet on the selected node starts the Pod.` : 'Pod remains unscheduled.'}` },
  }

  const canAdvance = phase !== 'bound'
  const stepIdx = ['pending', 'filtering', 'filtered', 'scoring', 'scored', 'bound'].indexOf(phase)

  return (
    <DemoBoundary name="Scheduler Algorithm">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Scheduler Algorithm</div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            background: phase === 'bound' ? s.green : s.bg3,
            border: `1px solid ${phase === 'bound' ? s.green : s.border}`,
            borderRadius: 10, padding: '12px 20',
            transition: 'all 0.3s',
          }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Pending Pod</div>
            <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text }}>my-app-6f4b8c9d</div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginTop: 4 }}>
              Request: {podRequest.cpu} CPU, {podRequest.mem} GB
            </div>
            {phase === 'bound' && boundNode && (
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.green, marginTop: 4 }}>
                Bound to: {boundNode}
              </div>
            )}
          </div>
          <div style={{
            display: 'flex', gap: 4,
          }}>
            {['pending', 'filtering', 'filtered', 'scoring', 'scored', 'bound'].map((st, i) => (
              <div key={st} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i <= stepIdx ? s.accent : s.bg3,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {nodesData.map((n) => {
          const filtered = phase === 'filtered' || phase === 'scoring' || phase === 'scored' || phase === 'bound'
          const passed = filteredNodes.some(fn => fn.name === n.name)
          const isBound = phase === 'bound' && boundNode === n.name
          const nodeScore = scores.find(s => s.name === n.name)
          const showScore = (phase === 'scored' || phase === 'bound') && nodeScore
          const cpuAvail = n.cpuTotal - n.cpuUsed
          const memAvail = n.memTotal - n.memUsed
          const passesBasic = cpuAvail >= podRequest.cpu && memAvail >= podRequest.mem

          let borderClr = s.border
          let bgClr = s.bg2
          if (filtered && !passed) { borderClr = s.red; bgClr = `${s.red}08` }
          if (filtered && passed) { borderClr = s.green; bgClr = `${s.green}08` }
          if (isBound) { borderClr = s.accent; bgClr = `${s.accent}15` }

          return (
            <div key={n.name} style={{
              flex: '1 1 180px', background: bgClr, border: `1px solid ${borderClr}`,
              borderRadius: 10, padding: 16, transition: 'all 0.3s',
              opacity: filtered && !passed ? 0.4 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: s.mono, fontSize: 13, color: isBound ? s.accent : s.text, fontWeight: 600 }}>{n.name}</span>
                {isBound && <span style={{ color: s.green, fontSize: 16 }}>+</span>}
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: s.text3, fontSize: 10 }}>CPU</span>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 10 }}>{n.cpuUsed}/{n.cpuTotal}</span>
                </div>
                <div style={{ height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(n.cpuUsed / n.cpuTotal) * 100}%`,
                    background: passesBasic ? s.accent : s.red, borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: s.text3, fontSize: 10 }}>Memory</span>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 10 }}>{n.memUsed}/{n.memTotal} GB</span>
                </div>
                <div style={{ height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(n.memUsed / n.memTotal) * 100}%`,
                    background: passesBasic ? s.accent : s.red, borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>

              {showScore && (
                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{nodeScore.score}</span>
                </div>
              )}

              {filtered && passed && phase === 'filtered' && (
                <div style={{ color: s.green, fontFamily: s.mono, fontSize: 10, textAlign: 'center', marginTop: 4 }}>PASS</div>
              )}
              {filtered && !passed && phase === 'filtered' && (
                <div style={{ color: s.red, fontFamily: s.mono, fontSize: 10, textAlign: 'center', marginTop: 4 }}>FILTERED OUT</div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border2}`, borderRadius: 8,
        padding: 12, marginBottom: 16, minHeight: 60,
      }}>
        <div style={{ color: s.accent, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {phaseDescriptions[phase].title}
        </div>
        <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
          {phaseDescriptions[phase].desc}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {canAdvance && (
          <button onClick={nextPhase} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s',
          }}>
            {phase === 'pending' ? 'Filter Nodes' :
             phase === 'filtering' ? 'Show Results' :
             phase === 'filtered' ? 'Score Nodes' :
             phase === 'scoring' ? 'Show Scores' :
             phase === 'scored' ? 'Bind Pod' : ''}
          </button>
        )}
        <button onClick={resetDemo} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
      </div>

      <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Algorithm Phases</div>
        {[
          { label: 'Filter', desc: 'Eliminate nodes that cannot fit the Pod', color: s.accent, active: stepIdx >= 1 },
          { label: 'Score', desc: 'Rank remaining nodes by resource availability', color: s.green, active: stepIdx >= 3 },
          { label: 'Bind', desc: 'Assign the Pod to the highest-ranked node', color: s.purple, active: stepIdx >= 5 },
        ].map((st) => (
          <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: st.active ? 1 : 0.5, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 48 }}>{st.label}</span>
            <span style={{ color: s.text2, fontSize: 12 }}>{st.desc}</span>
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}
