import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Stage {
  id: string
  label: string
  desc: string
  icon: string
}

const stages: Stage[] = [
  { id: 'chunk', label: 'Chunk', desc: 'Split file into 4MB blocks', icon: 'C' },
  { id: 'hash', label: 'Hash', desc: 'Compute SHA-256 per chunk', icon: '#' },
  { id: 'dedup', label: 'Dedup', desc: 'Check if chunk already stored', icon: 'D' },
  { id: 'compress', label: 'Compress', desc: 'gzip compress each chunk', icon: 'Z' },
  { id: 'encrypt', label: 'Encrypt', desc: 'AES-256-GCM encrypt', icon: 'E' },
  { id: 'store', label: 'Store', desc: 'Write to S3/blob storage', icon: 'S' },
  { id: 'metadata', label: 'Metadata', desc: 'Update file_versions table', icon: 'M' },
  { id: 'notify', label: 'Notify', desc: 'Push sync event to clients', icon: 'N' },
]

const detailData: Record<string, { detail: string; color: string }> = {
  chunk: { detail: 'report_2026.pdf split into 6 x 4MB chunks', color: s.accent },
  hash: { detail: 'SHA-256: a7ffc6f8... (chunk 1)', color: s.accent },
  dedup: { detail: '2 of 6 chunks already exist in blob store (dedup 33%)', color: s.green },
  compress: { detail: 'gzip: 4MB -> 2.8MB (30% compression ratio)', color: s.accent },
  encrypt: { detail: 'AES-256-GCM: encrypted with per-file key', color: s.accent },
  store: { detail: 'Uploaded to s3://dotsdecoded/chunks/a7ffc6...', color: s.green },
  metadata: { detail: 'INSERT file_versions SET user_id, file_id, chunk_count=6', color: s.accent },
  notify: { detail: 'Sync notification pushed to 3 connected devices', color: s.accent },
}

export default function UploadPipelineDemo() {
  const [activeStage, setActiveStage] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completed, setCompleted] = useState<number[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const play = () => {
    setIsPlaying(true)
    setActiveStage(0)
    setCompleted([])
    let i = 0
    timerRef.current = setInterval(() => {
      setActiveStage(i)
      setCompleted(prev => [...prev, i])
      i++
      if (i >= stages.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsPlaying(false)
        setActiveStage(-1)
      }
    }, 700)
  }

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsPlaying(false)
    setActiveStage(-1)
    setCompleted([])
  }

  return (
    <DemoBoundary name="Upload Pipeline">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Upload Pipeline
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Each file passes through 8 stages before it is available to other devices.
        Click any stage to inspect it, or press Play to animate the full pipeline.
      </p>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 24, marginBottom: 16,
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20,
          position: 'relative',
        }}>
          {stages.map((st, i) => {
            const isActive = activeStage === i
            const isDone = completed.includes(i)
            return (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  onClick={() => { if (!isPlaying) { setActiveStage(i); setCompleted(prev => prev.includes(i) ? prev : [...prev, i]) } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: isPlaying ? 'default' : 'pointer',
                    padding: '6px 0', flex: 1,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? s.green : isActive ? s.yellow : s.bg3,
                    border: `2px solid ${isDone ? s.green : isActive ? s.yellow : s.border}`,
                    color: isDone || isActive ? '#000' : s.text3,
                    fontWeight: 700, fontSize: 13, fontFamily: s.mono,
                    transition: 'all 0.3s',
                  }}>
                    {st.icon}
                  </div>
                  <div>
                    <div style={{ color: isDone ? s.green : isActive ? s.yellow : s.text2, fontSize: 13, fontWeight: 600, transition: 'color 0.3s' }}>
                      {st.label}
                    </div>
                    <div style={{ color: s.text3, fontSize: 11 }}>{st.desc}</div>
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div style={{
                    width: 2, height: 16, background: isDone ? s.green : s.border,
                    flexShrink: 0, borderRadius: 1, transition: 'background 0.3s',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: 14, minHeight: 60,
        }}>
          {activeStage >= 0 && activeStage < stages.length ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: detailData[stages[activeStage].id].color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#000',
                }}>
                  {stages[activeStage].icon}
                </div>
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>
                  {stages[activeStage].label}
                </span>
              </div>
              <div style={{ color: detailData[stages[activeStage].id].color, fontSize: 12, fontFamily: s.mono }}>
                {detailData[stages[activeStage].id].detail}
              </div>
            </div>
          ) : (
            <div style={{ color: s.text3, fontSize: 12 }}>
              {completed.length === stages.length
                ? 'Upload complete. File is now available across all devices.'
                : 'Select a stage or press Play to start the pipeline.'}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={reset}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 20px', color: s.text2, cursor: 'pointer', fontSize: 13,
          }}
        >
          Reset
        </button>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            background: isPlaying ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
            padding: '10px 20px', color: isPlaying ? s.text3 : '#fff',
            cursor: isPlaying ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}
        >
          {isPlaying ? 'Running...' : completed.length === stages.length ? 'Replay' : 'Play Pipeline'}
        </button>
      </div>
    </div>
    </DemoBoundary>
  )
}
