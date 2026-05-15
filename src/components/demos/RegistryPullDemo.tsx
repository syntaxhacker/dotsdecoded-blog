import { useState, useRef, useEffect, useCallback } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface Layer {
  digest: string
  size: number
  downloaded: boolean
  downloading: boolean
}

interface ImageDef {
  name: string
  layers: { digest: string; size: number }[]
  configSize: number
}

const images: Record<string, ImageDef> = {
  ubuntu: {
    name: 'ubuntu:24.04',
    layers: [
      { digest: 'sha256:a1b2c3d4e5f6...', size: 28 },
      { digest: 'sha256:b2c3d4e5f6a7...', size: 14 },
      { digest: 'sha256:c3d4e5f6a7b8...', size: 52 },
      { digest: 'sha256:d4e5f6a7b8c9...', size: 8 },
      { digest: 'sha256:e5f6a7b8c9d0...', size: 36 },
      { digest: 'sha256:f6a7b8c9d0e1...', size: 22 },
      { digest: 'sha256:a7b8c9d0e1f2...', size: 18 },
      { digest: 'sha256:b8c9d0e1f2a3...', size: 44 },
      { digest: 'sha256:c9d0e1f2a3b4...', size: 12 },
    ],
    configSize: 3,
  },
  alpine: {
    name: 'alpine:3.20',
    layers: [
      { digest: 'sha256:x1y2z3w4v5u6...', size: 12 },
      { digest: 'sha256:y2z3w4v5u6x1...', size: 5 },
    ],
    configSize: 1,
  },
}

interface Step {
  label: string
  desc: string
  status: 'pending' | 'active' | 'done'
}

const stepDefs: Step[] = [
  { label: 'Authenticate', desc: 'Token-based auth with registry', status: 'pending' },
  { label: 'Fetch Manifest', desc: 'Retrieve image manifest JSON', status: 'pending' },
  { label: 'Download Config', desc: 'Download image configuration', status: 'pending' },
  { label: 'Download Layers', desc: 'Download each layer blob', status: 'pending' },
  { label: 'Unpack Layers', desc: 'Extract layers into union filesystem', status: 'pending' },
]

export default function RegistryPullDemo() {
  const [selectedImage, setSelectedImage] = useState<'ubuntu' | 'alpine'>('ubuntu')
  const [steps, setSteps] = useState<Step[]>(stepDefs.map(st => ({ ...st })))
  const [layers, setLayers] = useState<Layer[]>([])
  const [pulling, setPulling] = useState(false)
  const [pulled, setPulled] = useState(false)
  const [showManifest, setShowManifest] = useState(true)
  const [speed, setSpeed] = useState(1)
  const pullingRef = useRef(false)
  const logRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`])
  }, [])

  const updateStep = useCallback((idx: number, status: Step['status']) => {
    setSteps(prev => prev.map((st, i) => i === idx ? { ...st, status } : st))
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const startPull = useCallback(async () => {
    if (pullingRef.current) return
    pullingRef.current = true
    setPulling(true)
    setPulled(false)
    setLogs([])
    setSteps(stepDefs.map(st => ({ ...st, status: 'pending' as const })))
    setLayers(images[selectedImage].layers.map(l => ({ digest: l.digest, size: l.size, downloaded: false, downloading: false })))

    updateStep(0, 'active')
    addLog(`Pulling from library/${selectedImage}`)
    addLog('Authenticating with registry...')
    await new Promise(r => setTimeout(r, getStepDelay(500, speed)))
    addLog('Authentication token received')
    updateStep(0, 'done')

    updateStep(1, 'active')
    addLog('Fetching manifest...')
    await new Promise(r => setTimeout(r, getStepDelay(400, speed)))
    addLog(`Manifest fetched: ${images[selectedImage].layers.length} layers, ${images[selectedImage].configSize}MB config`)
    updateStep(1, 'done')

    updateStep(2, 'active')
    addLog('Downloading config blob...')
    await new Promise(r => setTimeout(r, getStepDelay(300, speed)))
    addLog(`Config blob downloaded (${images[selectedImage].configSize}MB)`)
    updateStep(2, 'done')

    updateStep(3, 'active')
    const lrs = images[selectedImage].layers
    for (let i = 0; i < lrs.length; i++) {
      setLayers(prev => prev.map((l, li) => li === i ? { ...l, downloading: true } : l))
      const delay = getStepDelay(300 + lrs[i].size * 20, speed)
      addLog(`Downloading layer ${i + 1}/${lrs.length}: ${lrs[i].digest.slice(0, 12)}... (${lrs[i].size}MB)`)
      await new Promise(r => setTimeout(r, delay))
      setLayers(prev => prev.map((l, li) => li === i ? { ...l, downloading: false, downloaded: true } : l))
      addLog(`Layer ${i + 1}/${lrs.length} downloaded (${lrs[i].size}MB)`)
    }
    updateStep(3, 'done')

    updateStep(4, 'active')
    addLog('Unpacking layers into overlay filesystem...')
    await new Promise(r => setTimeout(r, getStepDelay(600, speed)))
    addLog('Applying layer diff...')
    await new Promise(r => setTimeout(r, getStepDelay(400, speed)))
    addLog(`Successfully pulled ${images[selectedImage].name} in ${(Math.random() * 3 + 2).toFixed(1)}s`)
    updateStep(4, 'done')

    setPulled(true)
    setPulling(false)
    pullingRef.current = false
  }, [selectedImage, speed, addLog, updateStep])

  const image = images[selectedImage]
  const totalSize = image.layers.reduce((sum, l) => sum + l.size, 0) + image.configSize

  const manifestJson = `{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "size": ${image.configSize * 1024 * 1024},
    "digest": "sha256:config-digest..."
  },
  "layers": [
${image.layers.map((l, i) => `    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": ${l.size * 1024 * 1024},
      "digest": "${l.digest}"
    }${i < image.layers.length - 1 ? ',' : ''}`).join('\n')}
  ]
}`

  return (
    <DemoBoundary name="Registry Pull">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={H}>docker pull: Registry Walkthrough</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {(['ubuntu', 'alpine'] as const).map(img => (
            <button key={img} onClick={() => { if (!pulling) { setSelectedImage(img); setPulled(false); setLogs([]); setSteps(stepDefs.map(st => ({ ...st, status: 'pending' as const }))); setLayers([]) } }} style={{
              flex: 1, padding: '14px 16px', borderRadius: 10, cursor: pulling ? 'not-allowed' : 'pointer',
              background: selectedImage === img ? s.accent : s.bg3, border: selectedImage === img ? 'none' : `1px solid ${s.border}`,
              color: selectedImage === img ? '#fff' : s.text2, fontSize: 13, fontWeight: 600, opacity: pulling ? 0.5 : 1,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontFamily: s.mono, marginBottom: 2 }}>{img}</div>
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{image.layers.length} layers, ~{totalSize}MB</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Pull Steps</div>
            {steps.map((st, i) => (
              <div key={st.label} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                background: st.status === 'active' ? `${s.accent}15` : 'transparent',
                borderRadius: 6, marginBottom: 4, transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: st.status === 'done' ? s.green : st.status === 'active' ? s.yellow : s.bg3,
                  border: `2px solid ${st.status === 'done' ? s.green : st.status === 'active' ? s.yellow : s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#000', fontWeight: 700,
                }}>
                  {st.status === 'done' ? 'V' : st.status === 'active' ? '>' : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: st.status === 'active' ? s.accent : s.text }}>{st.label}</div>
                  <div style={{ fontSize: 10, color: s.text3 }}>{st.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            {layers.length > 0 && (
              <div>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Layer Downloads</div>
                {layers.map((l, i) => (
                  <div key={l.digest} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontFamily: s.mono, color: l.downloaded ? s.green : l.downloading ? s.yellow : s.text3 }}>
                        Layer {i + 1}: {l.digest.slice(0, 16)}
                      </span>
                      <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>{l.size}MB</span>
                    </div>
                    <div style={{ height: 6, background: s.bg, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: l.downloaded ? '100%' : l.downloading ? `${Math.random() * 70 + 20}%` : '0%',
                        background: l.downloaded ? s.green : l.downloading ? s.accent : s.bg3,
                        borderRadius: 3, transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={startPull} disabled={pulling} style={{
            background: pulling ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
            color: '#fff', cursor: pulling ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: pulling ? 0.5 : 1, flex: 1,
          }}>{pulling ? 'Pulling...' : pulled ? 'Pull Again' : `Pull ${selectedImage}`}</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowManifest(!showManifest)} style={{
            background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 11, fontFamily: s.mono,
          }}>
            {showManifest ? 'Hide' : 'Show'} Manifest JSON
          </button>
        </div>

        {showManifest && (
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12,
            fontFamily: s.mono, fontSize: 11, color: s.text2, whiteSpace: 'pre', overflowX: 'auto', marginBottom: 12, maxHeight: 200, overflowY: 'auto',
          }}>
            {manifestJson}
          </div>
        )}

        <div ref={logRef} style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: 12, maxHeight: 150, overflowY: 'auto', fontFamily: s.mono, fontSize: 11, lineHeight: 1.7,
        }}>
          {logs.length === 0 ? (
            <span style={{ color: s.text3 }}>Click "Pull" to start the walkthrough...</span>
          ) : (
            logs.map((line, i) => (
              <div key={i} style={{
                color: line.includes('Error') ? s.red : line.includes('downloaded') || line.includes('Successfully') ? s.green : s.text2,
                whiteSpace: 'nowrap',
              }}>{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
