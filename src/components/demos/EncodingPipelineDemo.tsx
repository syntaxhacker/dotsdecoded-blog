import { useState, useEffect, useCallback } from 'react'
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

const stages = [
  { id: 'ingest', label: 'Ingest', desc: 'Raw video uploaded from studio or content partner', detail: 'Receive source file (ProRes, DNxHD). Validate integrity. Store in hot storage tier.', color: s.accent },
  { id: 'transcode', label: 'Transcode', desc: 'Encode to multiple resolutions and codecs', detail: 'Generate 5 renditions (360p-4K). Encode H.264 for wide compat, H.265/AV1 for efficiency. Apply denoise, color grading.', color: s.purple },
  { id: 'package', label: 'Package', desc: 'Fragment into segments and generate manifests', detail: 'Split into 2-6 second segments. Generate HLS .m3u8 and DASH .mpd manifests. Create timed metadata markers.', color: s.yellow },
  { id: 'encrypt', label: 'Encrypt', desc: 'Apply DRM encryption to all segments', detail: 'Encrypt with AES-128 per segment. Generate license URLs per DRM scheme (Widevine, FairPlay, PlayReady).', color: s.orange },
  { id: 'distribute', label: 'Distribute', desc: 'Replicate segments to CDN nodes globally', detail: 'Push to origin storage. Warm edge caches in high-demand regions. Generate content hashes for integrity.', color: s.green },
]

const resolutionSteps = ['360p', '480p', '720p', '1080p', '4K']

export default function EncodingPipelineDemo() {
  const [activeStage, setActiveStage] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [transcodedRes, setTranscodedRes] = useState<string[]>([])
  const [packagedSegs, setPackagedSegs] = useState(0)
  const [encryptedSegs, setEncryptedSegs] = useState(0)
  const [totalSegs] = useState(12)

  const reset = useCallback(() => {
    setActiveStage(-1)
    setTranscodedRes([])
    setPackagedSegs(0)
    setEncryptedSegs(0)
    setCompleted(false)
    setRunning(false)
  }, [])

  const start = useCallback(() => {
    reset()
    setRunning(true)
  }, [reset])

  useEffect(() => {
    if (!running) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let current = 0
    let totalTimeMs = 0

    const advance = () => {
      if (current >= stages.length) return
      setActiveStage(current)

      const stageDelay = getStepDelay(current === 0 ? 600 : current === 1 ? 2000 : current === 2 ? 1200 : current === 3 ? 1000 : 800, speed)

      if (stages[current].id === 'transcode') {
        let resIdx = 0
        const resInterval = setInterval(() => {
          if (resIdx < resolutionSteps.length) {
            setTranscodedRes(prev => [...prev, resolutionSteps[resIdx]])
            resIdx++
          } else {
            clearInterval(resInterval)
          }
        }, getStepDelay(300, speed))
        timers.push(resInterval as unknown as ReturnType<typeof setTimeout>)
      }

      if (stages[current].id === 'package') {
        let segIdx = 0
        const segInterval = setInterval(() => {
          segIdx++
          setPackagedSegs(segIdx)
          if (segIdx >= totalSegs) clearInterval(segInterval)
        }, getStepDelay(80, speed))
        timers.push(segInterval as unknown as ReturnType<typeof setTimeout>)
      }

      if (stages[current].id === 'encrypt') {
        let encIdx = 0
        const encInterval = setInterval(() => {
          encIdx++
          setEncryptedSegs(encIdx)
          if (encIdx >= totalSegs) clearInterval(encInterval)
        }, getStepDelay(70, speed))
        timers.push(encInterval as unknown as ReturnType<typeof setTimeout>)
      }

      totalTimeMs += stageDelay
      current++
      if (current < stages.length) {
        timers.push(setTimeout(advance, stageDelay))
      } else {
        timers.push(setTimeout(() => {
          setCompleted(true)
          setRunning(false)
        }, stageDelay))
      }
    }

    timers.push(setTimeout(advance, 200))
    return () => {
      timers.forEach(t => { clearTimeout(t); clearInterval(t as unknown as number) })
    }
  }, [running, speed])

  return (
    <DemoBoundary name="Encoding Pipeline">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Video Encoding Pipeline</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Raw video goes through five stages before it is ready to stream. Each stage adds processing time and transforms the content.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 0 }}>
            {stages.map((stage, i) => {
              const isActive = activeStage === i
              const isDone = activeStage > i || completed
              return (
                <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                      border: `2px solid ${isDone ? s.green : isActive ? stage.color : s.border}`,
                      background: isDone ? `${s.green}20` : isActive ? `${stage.color}20` : s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s',
                      boxShadow: isActive ? `0 0 16px ${stage.color}40` : 'none',
                    }}>
                      {isDone ? (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke={s.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : isActive ? (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${stage.color}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text3 }}>{i + 1}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: s.mono, color: isDone ? s.green : isActive ? stage.color : s.text3, fontWeight: isActive ? 600 : 400 }}>
                      {stage.label}
                    </div>
                  </div>
                  {i < stages.length - 1 && (
                    <div style={{
                      flex: '0 0 24px', height: 2, background: isDone ? s.green : s.border,
                      marginBottom: 22, transition: 'background 0.3s',
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, fontFamily: s.mono }}>STAGE DETAIL</div>
              {activeStage >= 0 && !completed ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: stages[activeStage].color, marginBottom: 4 }}>{stages[activeStage].label}</div>
                  <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>{stages[activeStage].detail}</div>
                </div>
              ) : completed ? (
                <div style={{ color: s.green, fontSize: 12 }}>All stages complete. Content available on CDN.</div>
              ) : (
                <div style={{ color: s.text3, fontSize: 12 }}>Press "Start Pipeline" to see the encoding flow.</div>
              )}
            </div>

            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, fontFamily: s.mono }}>PROGRESS</div>
              {activeStage < 0 && !running ? (
                <div style={{ color: s.text3, fontSize: 12 }}>Pipeline idle. Click start to begin.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: s.mono, marginBottom: 3 }}>
                      <span style={{ color: s.text3 }}>Transcode</span>
                      <span style={{ color: s.green }}>{transcodedRes.length}/5</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: s.bg3 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${(transcodedRes.length / 5) * 100}%`, background: s.purple, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginTop: 2 }}>
                      {transcodedRes.join(', ') || 'Waiting...'}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: s.mono, marginBottom: 3 }}>
                      <span style={{ color: s.text3 }}>Package</span>
                      <span style={{ color: s.yellow }}>{packagedSegs}/{totalSegs}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: s.bg3 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${(packagedSegs / totalSegs) * 100}%`, background: s.yellow, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: s.mono, marginBottom: 3 }}>
                      <span style={{ color: s.text3 }}>Encrypt</span>
                      <span style={{ color: s.orange }}>{encryptedSegs}/{totalSegs}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: s.bg3 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${(encryptedSegs / totalSegs) * 100}%`, background: s.orange, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={running ? reset : start} style={{
              background: running ? s.red : completed ? s.accent : s.green, border: 'none', borderRadius: 8,
              padding: '8px 24px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {running ? 'Stop' : completed ? 'Replay' : 'Start Pipeline'}
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </DemoBoundary>
  )
}
