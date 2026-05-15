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

const chunkColors = [s.accent, s.green, s.yellow, s.purple, s.orange, s.red]

const fileSizeMB = 23
const chunkSizeMB = 4
const numChunks = Math.ceil(fileSizeMB / chunkSizeMB)

const hashes = [
  'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
  '3b9c2b9b1c6b7f3d8e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
  'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
  '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  'f0e1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
  '8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
]

const shortHashes = [
  'a7ffc6f8', '3b9c2b9b', 'e5f6a7b8', '1a2b3c4d', 'f0e1d2c3', '8d9e0f1a',
]

export default function FileChunkingDemo() {
  const [phase, setPhase] = useState<'idle' | 'splitting' | 'hashing' | 'uploading' | 'done'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedChunks, setUploadedChunks] = useState<number[]>([])
  const [dedupSkipped, setDedupSkipped] = useState<number[]>([])
  const [currentUploading, setCurrentUploading] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startDemo = () => {
    setPhase('splitting')
    setUploadProgress(0)
    setUploadedChunks([])
    setDedupSkipped([])
    setCurrentUploading(null)

    setTimeout(() => setPhase('hashing'), 600)

    setTimeout(() => {
      setPhase('uploading')
      let i = 0
      timerRef.current = setInterval(() => {
        const isDedup = i === 2 || i === 4
        setCurrentUploading(i)
        setTimeout(() => {
          setUploadedChunks(prev => [...prev, i])
          if (isDedup) setDedupSkipped(prev => [...prev, i])
          setUploadProgress(((i + 1) / numChunks) * 100)
          i++
          if (i >= numChunks) {
            if (timerRef.current) clearInterval(timerRef.current)
            setCurrentUploading(null)
            setTimeout(() => setPhase('done'), 400)
          }
        }, 200)
      }, 500)
    }, 1200)
  }

  const barWidth = 400
  const chunkWidth = Math.floor(barWidth / numChunks)

  return (
    <DemoBoundary name="File Chunking">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        File Chunking
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        A {fileSizeMB}MB file is split into {numChunks} chunks of {chunkSizeMB}MB each.
        Each chunk gets a SHA-256 hash. Already-known chunks (dedup) are skipped.
      </p>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 20, marginBottom: 16, minHeight: 320,
      }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          original file: report_2026_q2.pdf ({fileSizeMB}MB)
        </div>

        <div style={{ position: 'relative', height: 40, background: s.bg3, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          {phase === 'idle' && (
            <div style={{ height: '100%', background: s.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              File
            </div>
          )}
          {phase !== 'idle' && (
            <div style={{ display: 'flex', height: '100%' }}>
              {Array.from({ length: numChunks }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '100%',
                  background: phase === 'splitting'
                    ? chunkColors[i % chunkColors.length]
                    : phase === 'hashing'
                    ? chunkColors[i % chunkColors.length]
                    : uploadedChunks.includes(i)
                    ? dedupSkipped.includes(i) ? s.green : chunkColors[i % chunkColors.length]
                    : currentUploading === i
                    ? s.yellow
                    : s.bg3,
                  borderRight: i < numChunks - 1 ? `1px solid ${s.bg}` : 'none',
                  transition: 'background 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff', fontWeight: 600,
                }}>
                  {phase === 'uploading' && currentUploading === i && '~'}
                  {uploadedChunks.includes(i) && dedupSkipped.includes(i) ? 'D' : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {phase === 'splitting' && (
          <div style={{ color: s.yellow, fontSize: 13, textAlign: 'center', padding: 10 }}>
            Splitting file into {numChunks} x {chunkSizeMB}MB chunks...
          </div>
        )}

        {phase === 'hashing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ color: s.yellow, fontSize: 13, marginBottom: 6 }}>Computing SHA-256 hashes:</div>
            {Array.from({ length: numChunks }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: s.mono, fontSize: 11 }}>
                <span style={{ color: chunkColors[i % chunkColors.length], fontWeight: 600, minWidth: 60 }}>
                  Chunk {i + 1}
                </span>
                <span style={{ color: s.text2 }}>{shortHashes[i]}...</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'uploading' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: s.text3, fontSize: 11 }}>Upload Progress</span>
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11 }}>{Math.round(uploadProgress)}%</span>
              </div>
              <div style={{ background: s.bg3, borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress}%`, height: '100%',
                  background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                  borderRadius: 6, transition: 'width 0.3s',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: numChunks }).map((_, i) => {
                const isUploaded = uploadedChunks.includes(i)
                const isDedup = dedupSkipped.includes(i)
                const isCurrent = currentUploading === i
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '4px 8px', borderRadius: 6,
                    background: isCurrent ? `${s.yellow}15` : 'transparent',
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: isUploaded ? (isDedup ? s.green : s.accent) : isCurrent ? s.yellow : s.border,
                      transition: 'all 0.3s',
                    }} />
                    <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11, minWidth: 70 }}>Chunk {i + 1}</span>
                    <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{shortHashes[i]}...</span>
                    {isDedup && <span style={{ color: s.green, fontSize: 11, fontFamily: s.mono }}>(dedup - skipped)</span>}
                    {isCurrent && !isUploaded && <span style={{ color: s.yellow, fontSize: 11 }}>uploading...</span>}
                    {isUploaded && !isDedup && <span style={{ color: s.accent, fontSize: 11 }}>uploaded</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 10 }}>
            <div style={{ color: s.green, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Upload Complete
            </div>
            <div style={{ color: s.text2, fontSize: 13 }}>
              {numChunks} chunks processed. {dedupSkipped.length} chunks skipped via deduplication.
              Effective upload: {(numChunks - dedupSkipped.length) * chunkSizeMB}MB (of {fileSizeMB}MB).
            </div>
          </div>
        )}
      </div>

      {phase === 'idle' && (
        <button
          onClick={startDemo}
          style={{
            background: s.accent, border: 'none', borderRadius: 8,
            padding: '10px 24px', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, width: '100%',
          }}
        >
          Start Upload
        </button>
      )}
      {phase !== 'idle' && phase !== 'done' && (
        <div style={{ color: s.text3, fontSize: 12, textAlign: 'center' }}>
          Chunks {uploadedChunks.length}/{numChunks} uploaded
        </div>
      )}
      {phase === 'done' && (
        <button
          onClick={() => {
            setPhase('idle')
            setUploadProgress(0)
            setUploadedChunks([])
            setDedupSkipped([])
            setCurrentUploading(null)
          }}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 24px', color: s.text2, cursor: 'pointer',
            fontSize: 13, width: '100%',
          }}
        >
          Reset
        </button>
      )}
    </div>
    </DemoBoundary>
  )
}
