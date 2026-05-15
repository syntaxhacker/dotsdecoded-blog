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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface ImageVariant {
  id: string
  name: string
  base: string
  baseSize: number
  layers: { label: string; size: number; color: string }[]
}

const baseImages: ImageVariant[] = [
  {
    id: 'ubuntu',
    name: 'Ubuntu (full)',
    base: 'ubuntu:24.04',
    baseSize: 1200,
    layers: [
      { label: 'Base OS', size: 120, color: s.red },
      { label: 'glibc + libs', size: 280, color: s.orange },
      { label: 'bash + shell utils', size: 45, color: s.yellow },
      { label: 'apt + package manager', size: 35, color: s.purple },
      { label: 'Python runtime', size: 180, color: s.accent },
      { label: 'pip packages', size: 85, color: s.green },
      { label: 'App binary', size: 15, color: s.text },
      { label: 'Package cache', size: 240, color: s.red },
      { label: 'Docs + man pages', size: 100, color: s.orange },
      { label: 'locales + timezone', size: 100, color: s.yellow },
    ],
  },
  {
    id: 'alpine',
    name: 'Alpine',
    base: 'alpine:3.20',
    baseSize: 350,
    layers: [
      { label: 'Base OS (musl)', size: 15, color: s.green },
      { label: 'busybox + utils', size: 8, color: s.accent },
      { label: 'apk + package manager', size: 12, color: s.purple },
      { label: 'Python runtime', size: 180, color: s.accent },
      { label: 'pip packages', size: 85, color: s.green },
      { label: 'App binary', size: 15, color: s.text },
      { label: 'Package cache', size: 20, color: s.yellow },
      { label: 'Docs', size: 15, color: s.orange },
    ],
  },
  {
    id: 'distroless',
    name: 'Distroless',
    base: 'gcr.io/distroless/python3',
    baseSize: 150,
    layers: [
      { label: 'glibc (minimal)', size: 15, color: s.green },
      { label: 'Python runtime', size: 80, color: s.accent },
      { label: 'pip packages', size: 40, color: s.green },
      { label: 'App binary', size: 15, color: s.text },
    ],
  },
  {
    id: 'scratch',
    name: 'Scratch',
    base: 'FROM scratch',
    baseSize: 20,
    layers: [
      { label: 'Static binary', size: 12, color: s.accent },
      { label: 'CA certs', size: 5, color: s.green },
      { label: 'Timezone data', size: 3, color: s.text },
    ],
  },
]

interface OptToggle {
  id: string
  label: string
  desc: string
  savingsPct: number
  enabled: boolean
}

const optToggles: OptToggle[] = [
  { id: 'dockerignore', label: 'Use .dockerignore', desc: 'Exclude node_modules, .git, tmp files', savingsPct: 15, enabled: false },
  { id: 'combine_run', label: 'Combine RUN commands', desc: 'Fewer layers, less metadata overhead', savingsPct: 8, enabled: false },
  { id: 'multistage', label: 'Multi-stage builds', desc: 'Separate build deps from runtime', savingsPct: 35, enabled: false },
  { id: 'smaller_base', label: 'Use smaller base image', desc: 'Alpine / Distroless instead of Ubuntu', savingsPct: 70, enabled: false },
  { id: 'clean_cache', label: 'Remove package manager caches', desc: 'apt clean, rm -rf /var/cache/apt/*', savingsPct: 20, enabled: false },
]

export default function ImageOptimizeDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [toggles, setToggles] = useState<OptToggle[]>(optToggles.map(t => ({ ...t })))
  const [showBreakdown, setShowBreakdown] = useState(true)

  const toggleOpt = (idx: number) => {
    setToggles(prev => prev.map((t, i) => i === idx ? { ...t, enabled: !t.enabled } : t))
  }

  const active = baseImages[selectedIdx]

  const savedSizes = useMemo(() => {
    const baseSize = active.baseSize
    let running = baseSize
    const steps: { label: string; after: number; saved: number; color: string }[] = []
    toggles.forEach(t => {
      if (t.enabled) {
        const saved = Math.round(running * t.savingsPct / 100)
        running = Math.max(running - saved, 5)
        steps.push({ label: t.label, after: running, saved, color: s.green })
      }
    })
    return { original: baseSize, optimized: running, steps }
  }, [active.baseSize, toggles])

  const totalSaved = savedSizes.original - savedSizes.optimized
  const savingsPct = Math.round((totalSaved / savedSizes.original) * 100)

  return (
    <DemoBoundary name="Image Optimization">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Image Size Optimization</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {baseImages.map((img, i) => (
            <button key={img.id} onClick={() => setSelectedIdx(i)} style={{
              flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', minWidth: 100,
              background: selectedIdx === i ? img.layers[0].color : s.bg3,
              border: selectedIdx === i ? 'none' : `1px solid ${s.border}`,
              color: selectedIdx === i ? '#000' : s.text2, fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono }}>{img.name}</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>~{img.baseSize}MB</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Optimization Techniques
            </div>
            {toggles.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                borderRadius: 6, marginBottom: 3,
                background: t.enabled ? `${s.green}10` : 'transparent',
                transition: 'all 0.2s',
              }}>
                <button onClick={() => toggleOpt(i)} style={{
                  width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${t.enabled ? s.green : s.border}`,
                  background: t.enabled ? s.green : 'transparent', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: t.enabled ? '#000' : 'transparent', fontWeight: 700,
                }}>
                  {t.enabled ? 'V' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: s.text3 }}>{t.desc}</div>
                </div>
                <div style={{
                  fontSize: 10, fontFamily: s.mono, color: s.text3, whiteSpace: 'nowrap',
                }}>
                  -{t.savingsPct}%
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Size Comparison
            </div>

            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: s.text2, marginBottom: 8 }}>Before vs After Optimization</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: s.text3, minWidth: 40 }}>Before:</span>
                <div style={{ flex: 1, height: 14, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: '100%', background: s.red, borderRadius: 4,
                    opacity: 0.7, transition: 'width 0.5s',
                  }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text, minWidth: 50, textAlign: 'right' }}>{savedSizes.original}MB</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: s.text3, minWidth: 40 }}>After:</span>
                <div style={{ flex: 1, height: 14, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(savedSizes.optimized / savedSizes.original) * 100}%`,
                    background: s.green, borderRadius: 4, transition: 'width 0.5s',
                  }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text, minWidth: 50, textAlign: 'right' }}>{savedSizes.optimized}MB</span>
              </div>

              {savingsPct > 0 && (
                <div style={{
                  fontSize: 12, fontWeight: 600, color: s.green, textAlign: 'center',
                  padding: '6px 10px', background: `${s.green}10`, borderRadius: 6,
                }}>
                  {savingsPct}% smaller ({totalSaved}MB saved)
                </div>
              )}
            </div>

            {savedSizes.steps.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Optimization Steps</div>
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Start: {savedSizes.original}MB</div>
                  {savedSizes.steps.map((st, i) => (
                    <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: s.text2, flex: 1 }}>{st.label}</span>
                      <span style={{ fontSize: 10, color: s.green, fontFamily: s.mono }}>-{st.saved}MB</span>
                      <span style={{ fontSize: 10, color: s.text, fontFamily: s.mono }}>{st.after}MB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowBreakdown(!showBreakdown)} style={{
            background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 11, fontFamily: s.mono,
          }}>
            {showBreakdown ? 'Hide' : 'Show'} Layer Breakdown
          </button>
        </div>

        {showBreakdown && (
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ color: s.text, fontSize: 12, fontWeight: 600, marginBottom: 8, fontFamily: s.mono }}>{active.name} Layers</div>
            {active.layers.map((l, i) => {
              const pct = (l.size / active.baseSize) * 100
              return (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: s.text2, minWidth: 110 }}>{l.label}</div>
                  <div style={{ flex: 1, height: 10, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, background: l.color, borderRadius: 3,
                      minWidth: 4, transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, minWidth: 40, textAlign: 'right' }}>{l.size}MB</div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: s.text3 }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', flex: 1 }}>
            <div style={{ fontWeight: 600, color: s.text, marginBottom: 4, fontSize: 12 }}>What is included</div>
            {active.base === 'FROM scratch' ? (
              <div>Only the static Go binary and essential files. No shell, no package manager, no OS layer. Smallest possible image.</div>
            ) : (
              <div>
                Shell: {active.id === 'ubuntu' ? 'bash' : active.id === 'alpine' ? 'busybox sh' : 'none'} |
                Pkg mgr: {active.id === 'ubuntu' ? 'apt' : active.id === 'alpine' ? 'apk' : 'none'} |
                Libc: {active.id === 'ubuntu' ? 'glibc (full)' : active.id === 'alpine' ? 'musl' : 'glibc (minimal)'}
              </div>
            )}
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', flex: 1 }}>
            <div style={{ fontWeight: 600, color: s.text, marginBottom: 4, fontSize: 12 }}>Best for</div>
            {active.id === 'ubuntu' ? 'General purpose, dev environments, complex apps' :
             active.id === 'alpine' ? 'Small production images, Python/Node/Go apps' :
             active.id === 'distroless' ? 'Production, security-sensitive deployments' :
             'Go static binaries, minimal containers'}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
