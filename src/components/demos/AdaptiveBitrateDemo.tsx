import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Rendition {
  label: string
  resolution: string
  bitrateKbps: number
  bandwidthBps: number
}

const renditions: Rendition[] = [
  { label: '4K', resolution: '3840x2160', bitrateKbps: 16000, bandwidthBps: 16000000 },
  { label: '1080p', resolution: '1920x1080', bitrateKbps: 8000, bandwidthBps: 8000000 },
  { label: '720p', resolution: '1280x720', bitrateKbps: 5000, bandwidthBps: 5000000 },
  { label: '480p', resolution: '854x480', bitrateKbps: 2500, bandwidthBps: 2500000 },
  { label: '360p', resolution: '640x360', bitrateKbps: 1000, bandwidthBps: 1000000 },
]

const manifestM3U8 = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=16000000,RESOLUTION=3840x2160
4k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=854x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360
360p.m3u8`

const manifestHtml = Prism.highlight(manifestM3U8, Prism.languages.typescript, 'typescript')

export default function AdaptiveBitrateDemo() {
  const [bandwidth, setBandwidth] = useState(5000)
  const [currentRendition, setCurrentRendition] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [playhead, setPlayhead] = useState(0)
  const [switches, setSwitches] = useState<{ time: number; from: string; to: string }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const delta = Math.random() * 6000 - 2000
      setBandwidth(prev => {
        const next = Math.max(500, Math.min(20000, prev + delta))
        return Math.round(next)
      })
      setPlayhead(p => p + 1)
    }, getStepDelay(1200, speed))
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, speed])

  useEffect(() => {
    const maxIdx = renditions.length - 1
    for (let i = maxIdx; i >= 0; i--) {
      if (bandwidth >= renditions[i].bandwidthBps * 1.3 / 1000000) {
        if (i !== currentRendition && playing) {
          setSwitches(prev => [...prev, {
            time: playhead,
            from: renditions[currentRendition].label,
            to: renditions[i].label,
          }])
          setCurrentRendition(i)
        }
        return
      }
    }
    if (0 !== currentRendition && playing) {
      setSwitches(prev => [...prev, {
        time: playhead, from: renditions[currentRendition].label, to: renditions[0].label,
      }])
      setCurrentRendition(0)
    }
  }, [bandwidth, currentRendition, playing, playhead])

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(false)
    setBandwidth(5000)
    setCurrentRendition(2)
    setPlayhead(0)
    setSwitches([])
  }

  const bps = bandwidth * 1000
  const prevColor = (idx: number) => {
    const diff = Math.abs(idx - currentRendition)
    if (idx === currentRendition) return s.green
    if (diff <= 1) return s.yellow
    return s.border
  }

  return (
    <DemoBoundary name="Adaptive Bitrate Streaming">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Adaptive Bitrate Streaming</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Bandwidth fluctuates during playback. The player dynamically switches between renditions using HLS or DASH manifests.
          </p>

          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono }}>BANDWIDTH</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 16,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{bandwidth} Kbps</span>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
                    {bps >= 16000000 ? '4K ready' : bps >= 8000000 ? '1080p ready' : bps >= 5000000 ? '720p ready' : bps >= 2500000 ? '480p ready' : '360p only'}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: s.bg3, position: 'relative' }}>
                  {renditions.slice().reverse().map((r, i) => {
                    const idx = renditions.length - 1 - i
                    const pct = ((idx === 0 ? 500 : renditions[idx].bandwidthBps / 1000000 * 1.3) / 26000) * 100
                    return (
                      <div key={r.label} style={{
                        position: 'absolute', left: `${pct}%`, top: -3, width: 1, height: 12,
                        background: s.text3, opacity: 0.3,
                      }} />
                    )
                  })}
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${(bandwidth / 26000) * 100}%`,
                    background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>

            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono }}>CURRENT RENDITION</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.green}40`, borderRadius: 8, padding: 16, textAlign: 'center',
              }}>
                <div style={{ color: s.green, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
                  {renditions[currentRendition].label}
                </div>
                <div style={{ color: s.text3, fontSize: 11 }}>
                  {renditions[currentRendition].resolution}
                </div>
                <div style={{ color: s.text3, fontSize: 11 }}>
                  {renditions[currentRendition].bitrateKbps} Kbps
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono }}>AVAILABLE RENDITIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {renditions.map((r, i) => {
                const isActive = i === currentRendition
                const canPlay = bandwidth * 1000 >= r.bandwidthBps * 1.3 / 1000
                return (
                  <div key={r.label} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px', gap: 12, alignItems: 'center',
                    padding: '8px 12px', borderRadius: 6,
                    background: isActive ? `${s.green}15` : s.bg,
                    border: `1px solid ${isActive ? s.green : canPlay ? s.border : s.border + '40'}`,
                    opacity: canPlay ? 1 : 0.4,
                    transition: 'all 0.3s',
                  }}>
                    <span style={{
                      fontFamily: s.mono, fontSize: 13, fontWeight: 600,
                      color: isActive ? s.green : canPlay ? s.text : s.text3,
                    }}>{r.label}</span>
                    <div style={{ height: 6, borderRadius: 3, background: s.bg3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${(r.bandwidthBps / 20000000) * 100}%`,
                        background: isActive ? s.green : canPlay ? s.accent : s.border,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{r.resolution}</span>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: isActive ? s.green : s.text3 }}>
                      {r.bitrateKbps} Kbps
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => { if (playing) reset(); else setPlaying(true) }} style={{
              background: playing ? s.red : s.green, border: 'none', borderRadius: 8,
              padding: '8px 24px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {playing ? 'Stop' : 'Simulate Bandwidth'}
            </button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '8px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>Reset</button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          {switches.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono }}>RENDITION SWITCHES</div>
              <div style={{ maxHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {switches.slice(-8).map((sw, i) => (
                  <div key={i} style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, padding: '2px 8px', background: s.bg, borderRadius: 4 }}>
                    {sw.time}s  {sw.from} {'->'} {sw.to}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono }}>HLS MASTER MANIFEST (manifest.m3u8)</div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, overflowX: 'auto', border: `1px solid ${s.border}` }}>
              <style>{`
                code .token.keyword { color: #f92672; } code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; } code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; } code .token.selector, code .token.attr-name { color: #f92672; } code .token.attr-value, code .token.atrule { color: #e6db74; } code .token.function, code .token.class-name { color: #a6e22e; } code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; } code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; } code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
              `}</style>
              <code style={{ fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: manifestHtml }} />
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
