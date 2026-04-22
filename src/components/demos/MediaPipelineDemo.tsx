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

type MediaType = 'photo' | 'video'

const stages = [
  { id: 'upload', label: 'Upload', detail: 'Client sends media to API gateway', color: s.accent },
  { id: 'store', label: 'Object Storage', detail: 'Raw file stored in S3-compatible bucket', color: s.green },
  { id: 'process', label: 'Processing', detail: 'Resize, compress, generate thumbnails', color: s.yellow },
  { id: 'transcode', label: 'Transcoding', detail: 'Convert to multiple resolutions', color: s.purple },
  { id: 'cdn', label: 'CDN Distribution', detail: 'Replicate to edge nodes worldwide', color: s.orange },
  { id: 'ready', label: 'Ready', detail: 'Content available to all users', color: s.green },
]

const resolutions = [
  { label: '4K', size: '3840x2160', bitrate: '20 Mbps' },
  { label: '1080p', size: '1920x1080', bitrate: '8 Mbps' },
  { label: '720p', size: '1280x720', bitrate: '5 Mbps' },
  { label: '480p', size: '854x480', bitrate: '2.5 Mbps' },
  { label: '360p', size: '640x360', bitrate: '1 Mbps' },
]

export default function MediaPipelineDemo() {
  const [mediaType, setMediaType] = useState<MediaType>('video')
  const [activeStage, setActiveStage] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [transcodeProgress, setTranscodeProgress] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)

  const reset = useCallback(() => {
    setActiveStage(-1)
    setTranscodeProgress([])
    setCompleted(false)
    setRunning(false)
  }, [])

  const start = useCallback(() => {
    reset()
    setRunning(true)
  }, [reset])

  useEffect(() => {
    if (!running) return

    const baseDelay = 800
    const delay = getStepDelay(baseDelay, speed)

    const stageTimers: ReturnType<typeof setTimeout>[] = []
    let currentStage = 0

    const advance = () => {
      if (currentStage < stages.length) {
        setActiveStage(currentStage)
        if (stages[currentStage].id === 'transcode' && mediaType === 'video') {
          const resolutionsToProcess = resolutions.slice()
          let resIdx = 0
          const resInterval = setInterval(() => {
            if (resIdx < resolutionsToProcess.length) {
              setTranscodeProgress(prev => [...prev, resolutionsToProcess[resIdx].label])
              resIdx++
            } else {
              clearInterval(resInterval)
            }
          }, getStepDelay(300, speed))
          stageTimers.push(resInterval as unknown as ReturnType<typeof setTimeout>)
        }
        currentStage++
        if (currentStage < stages.length) {
          stageTimers.push(setTimeout(advance, delay))
        } else {
          stageTimers.push(setTimeout(() => {
            setCompleted(true)
            setRunning(false)
          }, delay / 2))
        }
      }
    }

    stageTimers.push(setTimeout(advance, 200))

    return () => {
      stageTimers.forEach(t => clearTimeout(t))
      stageTimers.forEach(t => clearInterval(t))
    }
  }, [running, speed, mediaType])

  return (
    <DemoBoundary name="Media Storage Pipeline">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['photo', 'video'] as MediaType[]).map(mt => (
              <button key={mt} onClick={() => { setMediaType(mt); reset() }} style={{
                padding: '6px 16px', borderRadius: 6, border: `1px solid ${mediaType === mt ? s.accent : s.border}`,
                background: mediaType === mt ? `${s.accent}20` : s.bg2, color: mediaType === mt ? s.accent : s.text3,
                fontFamily: s.mono, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {mt}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
            <button onClick={running ? reset : start} style={{
              padding: '6px 16px', borderRadius: 6, border: `1px solid ${running ? s.red : s.green}`,
              background: running ? `${s.red}20` : `${s.green}20`, color: running ? s.red : s.green,
              fontFamily: s.mono, fontSize: 12, cursor: 'pointer',
            }}>
              {running ? 'Reset' : completed ? 'Replay' : 'Start Pipeline'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
          {stages.map((stage, i) => {
            const isActive = activeStage === i
            const isDone = activeStage > i || completed
            const isPending = activeStage < i && !completed
            return (
              <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', margin: '0 auto 6px',
                    border: `2px solid ${isDone ? s.green : isActive ? stage.color : s.border}`,
                    background: isDone ? `${s.green}20` : isActive ? `${stage.color}20` : s.bg2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 12px ${stage.color}40` : 'none',
                  }}>
                    {isDone ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke={s.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : isActive ? (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${stage.color}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>{i + 1}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: s.mono, color: isDone ? s.green : isActive ? stage.color : s.text3, fontWeight: isActive ? 600 : 400 }}>
                    {stage.label}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div style={{
                    width: 24, height: 2, background: isDone ? s.green : s.border,
                    marginBottom: 22, transition: 'background 0.3s ease',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, minHeight: 180 }}>
          <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, fontFamily: s.mono }}>STAGE DETAIL</div>
            {activeStage >= 0 ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: stages[activeStage].color, marginBottom: 6 }}>{stages[activeStage].label}</div>
                <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>{stages[activeStage].detail}</div>
                {stages[activeStage].id === 'process' && mediaType === 'photo' && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Processing steps:</div>
                    {['Validate file format', 'Extract metadata (EXIF)', 'Generate 3 thumbnail sizes', 'Compress to WebP', 'Store in object storage'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: s.text2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.green }} />
                        {step}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: s.text3, lineHeight: 1.6 }}>
                Press "Start Pipeline" to see how a {mediaType} is uploaded, processed, and delivered to users via CDN.
              </div>
            )}
          </div>

          <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, fontFamily: s.mono }}>
              {mediaType === 'video' ? 'TRANSCODE PROGRESS' : 'PROCESSING OUTPUT'}
            </div>
            {mediaType === 'video' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resolutions.map(res => {
                  const done = transcodeProgress.includes(res.label)
                  const active = activeStage === 3 && !done
                  return (
                    <div key={res.label} style={{
                      display: 'grid', gridTemplateColumns: '50px 1fr 60px 60px', gap: 8, alignItems: 'center',
                      padding: '6px 10px', borderRadius: 4, background: done ? `${s.green}10` : s.bg,
                      border: `1px solid ${done ? s.green + '30' : s.border}`,
                      transition: 'all 0.3s ease',
                    }}>
                      <span style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: done ? s.green : active ? s.purple : s.text3 }}>{res.label}</span>
                      <div style={{ height: 4, borderRadius: 2, background: s.bg3 }}>
                        <div style={{
                          height: '100%', borderRadius: 2, width: done ? '100%' : active ? '60%' : '0%',
                          background: done ? s.green : s.purple, transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{res.size}</span>
                      <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{res.bitrate}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Original', size: '2048x2048', format: 'JPEG' },
                  { label: 'Large', size: '1080x1080', format: 'WebP' },
                  { label: 'Medium', size: '640x640', format: 'WebP' },
                  { label: 'Thumbnail', size: '150x150', format: 'WebP' },
                ].map(thumb => {
                  const done = activeStage > 2 || completed
                  return (
                    <div key={thumb.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 4, background: done ? `${s.green}10` : s.bg,
                      border: `1px solid ${done ? s.green + '30' : s.border}`,
                      transition: 'all 0.3s ease',
                    }}>
                      <span style={{ fontFamily: s.mono, fontSize: 11, color: done ? s.green : s.text3 }}>{thumb.label}</span>
                      <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{thumb.size} {thumb.format}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {completed && (
          <div style={{ marginTop: 14, background: `${s.green}10`, border: `1px solid ${s.green}30`, borderRadius: 6, padding: '10px 14px', fontSize: 12, color: s.green }}>
            Pipeline complete. Content replicated to CDN edge nodes and available globally with low latency.
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </DemoBoundary>
  )
}
