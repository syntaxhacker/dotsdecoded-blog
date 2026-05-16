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

interface CachePkg {
  name: string
  deps: string[]
  color: string
}

const PKGS: CachePkg[] = [
  { name: 'lib', deps: [], color: s.purple },
  { name: 'utils', deps: ['lib'], color: s.green },
  { name: 'app-a', deps: ['utils'], color: s.accent },
  { name: 'app-b', deps: [], color: s.orange },
]

interface Phase {
  label: string
  desc: string
  status: Record<string, 'hit' | 'miss'>
  turboMeta: Record<string, string>
  nxMeta: Record<string, string>
}

const PHASES: Phase[] = [
  {
    label: 'First Build',
    desc: 'Cold cache. No build artifacts exist. Every package must be compiled from source.',
    status: { lib: 'miss', utils: 'miss', 'app-a': 'miss', 'app-b': 'miss' },
    turboMeta: { lib: 'hash: a3f2c1', utils: 'hash: b7d4e8', 'app-a': 'hash: c9f1a2', 'app-b': 'hash: d4e7b3' },
    nxMeta: { lib: 'first build', utils: 'first build', 'app-a': 'first build', 'app-b': 'first build' },
  },
  {
    label: 'No Changes',
    desc: 'All source files unchanged. Cached artifacts match current hashes -- zero rebuilds needed.',
    status: { lib: 'hit', utils: 'hit', 'app-a': 'hit', 'app-b': 'hit' },
    turboMeta: { lib: 'hash: a3f2c1', utils: 'hash: b7d4e8', 'app-a': 'hash: c9f1a2', 'app-b': 'hash: d4e7b3' },
    nxMeta: { lib: 'cache match', utils: 'cache match', 'app-a': 'cache match', 'app-b': 'cache match' },
  },
  {
    label: 'lib Changed',
    desc: 'lib source modified. utils and app-a depend on lib transitively. app-b is independent and stays cached.',
    status: { lib: 'miss', utils: 'miss', 'app-a': 'miss', 'app-b': 'hit' },
    turboMeta: { lib: 'hash: f8e2d1', utils: 'hash: b7d4e8', 'app-a': 'hash: c9f1a2', 'app-b': 'hash: d4e7b3' },
    nxMeta: { lib: 'source changed', utils: 'affected by lib', 'app-a': 'affected by lib', 'app-b': 'cache match' },
  },
]

const PKG_NAMES = PKGS.map(p => p.name)

const DEP_LINES: { from: number; to: number }[] = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
]

export default function MonorepoCacheDemo() {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [mode, setMode] = useState<'turborepo' | 'nx'>('turborepo')
  const phase = PHASES[phaseIdx]

  return (
    <DemoBoundary name="Build Cache Visualization">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Build Cache</div>
          <div style={{ display: 'flex', gap: 4, background: s.bg3, borderRadius: 8, padding: 3 }}>
            <button onClick={() => setMode('turborepo')} style={{
              background: mode === 'turborepo' ? s.bg : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 14px',
              color: mode === 'turborepo' ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>Turborepo</button>
            <button onClick={() => setMode('nx')} style={{
              background: mode === 'nx' ? s.bg : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 14px',
              color: mode === 'nx' ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>Nx</button>
          </div>
        </div>

        <div style={{ color: s.text2, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          {phase.desc}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
          {PKGS.map((pkg, idx) => {
            const status = phase.status[pkg.name]
            const isHit = status === 'hit'
            return (
              <div key={pkg.name} style={{ display: 'flex', alignItems: 'center' }}>
                {idx > 0 && (
                  <div style={{
                    width: 24, height: 2, background: s.border2,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', right: -4, top: -4,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: `6px solid ${s.border2}`,
                      transform: 'rotate(-90deg)',
                    }} />
                  </div>
                )}
                <div style={{
                  background: isHit ? `${s.green}12` : `${s.red}12`,
                  border: `1px solid ${isHit ? s.green : s.red}`,
                  borderRadius: 10, padding: '14px 18px',
                  textAlign: 'center', minWidth: 110,
                  transition: 'all 0.4s',
                }}>
                  <div style={{ fontFamily: s.mono, fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 4 }}>
                    {pkg.name}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    background: isHit ? s.green : s.red,
                    borderRadius: 4, padding: '2px 8px',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    fontFamily: s.mono, letterSpacing: 0.5,
                  }}>
                    {isHit ? 'CACHE HIT' : 'CACHE MISS'}
                  </div>
                  <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginTop: 6 }}>
                    {mode === 'turborepo' ? phase.turboMeta[pkg.name] : phase.nxMeta[pkg.name]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {PHASES.map((ph, idx) => (
            <button key={idx} onClick={() => setPhaseIdx(idx)} style={{
              background: phaseIdx === idx ? s.accent : s.bg3,
              border: 'none', borderRadius: 8, padding: '8px 18px',
              color: phaseIdx === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              {ph.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            How It Works
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green, flexShrink: 0 }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 70 }}>Cache Hit</span>
              <span style={{ color: s.text2, fontSize: 12 }}>Hash matches -- artifact restored from cache, no computation needed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red, flexShrink: 0 }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 70 }}>Cache Miss</span>
              <span style={{ color: s.text2, fontSize: 12 }}>Hash changed -- task must execute from source</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.border2, flexShrink: 0 }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 70 }}>Dependency</span>
              <span style={{ color: s.text2, fontSize: 12 }}>Arrow points from dependency to dependent (e.g., utils depends on lib)</span>
            </div>
          </div>
          {mode === 'turborepo' ? (
            <div style={{ color: s.text3, fontSize: 12, marginTop: 10 }}>
              Turborepo computes a content hash for each task's inputs. If the hash matches a previous run, the cached output is restored.
            </div>
          ) : (
            <div style={{ color: s.text3, fontSize: 12, marginTop: 10 }}>
              Nx constructs a computation graph and uses affected commands to determine exactly which tasks need re-execution based on the dependency graph.
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
