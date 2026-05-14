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

interface ManifestItem {
  name: string
  version: number
  size: string
  chunks: number
  synced: boolean
}

const initialManifest: ManifestItem[] = [
  { name: 'report_2026_q2.pdf', version: 3, size: '23 MB', chunks: 6, synced: false },
  { name: 'budget.xlsx', version: 5, size: '2.1 MB', chunks: 1, synced: false },
  { name: 'notes.md', version: 12, size: '48 KB', chunks: 1, synced: false },
  { name: 'photo_may.jpg', version: 1, size: '4.2 MB', chunks: 2, synced: false },
  { name: 'presentation.pptx', version: 2, size: '15 MB', chunks: 4, synced: false },
]

export default function DownloadSyncDemo() {
  const [phase, setPhase] = useState<'idle' | 'manifest' | 'comparing' | 'downloading' | 'done'>('idle')
  const [manifest, setManifest] = useState<ManifestItem[]>(initialManifest)
  const [overallProgress, setOverallProgress] = useState(0)
  const [currentItem, setCurrentItem] = useState(-1)
  const [itemProgress, setItemProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startSync = () => {
    setPhase('manifest')
    setTimeout(() => setPhase('comparing'), 600)
    setTimeout(() => {
      setPhase('downloading')
      let itemIdx = 0
      let chunkProgress = 0
      const totalChunks = manifest.reduce((sum, m) => sum + m.chunks, 0)
      let doneChunks = 0

      timerRef.current = setInterval(() => {
        chunkProgress++
        doneChunks++
        setOverallProgress(Math.round((doneChunks / totalChunks) * 100))

        const item = manifest[itemIdx]
        const localProgress = Math.round((chunkProgress / item.chunks) * 100)
        setItemProgress(localProgress)
        setCurrentItem(itemIdx)

        if (chunkProgress >= item.chunks) {
          setManifest(prev => prev.map((m, i) => i === itemIdx ? { ...m, synced: true } : m))
          itemIdx++
          chunkProgress = 0
          if (itemIdx >= manifest.length) {
            if (timerRef.current) clearInterval(timerRef.current)
            setCurrentItem(-1)
            setOverallProgress(100)
            setTimeout(() => setPhase('done'), 400)
          }
        }
      }, 400)
    }, 1200)
  }

  return (
    <DemoBoundary name="Download Sync">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Download & Sync Pipeline
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Client requests sync, server returns a manifest, client compares with local files,
        downloads missing chunks, and reassembles.
      </p>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 20, marginBottom: 16,
      }}>
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ color: s.text3, fontSize: 13, marginBottom: 12 }}>
              Press Sync to start the download pipeline. The client will fetch the latest manifest from the server.
            </div>
          </div>
        )}

        {phase === 'manifest' && (
          <div style={{ color: s.yellow, fontSize: 13, textAlign: 'center', padding: 10 }}>
            Requesting file manifest from server...
          </div>
        )}

        {phase === 'comparing' && (
          <div style={{ color: s.yellow, fontSize: 13, textAlign: 'center', padding: 10 }}>
            Comparing {manifest.length} files against local cache...
          </div>
        )}

        {(phase === 'downloading' || phase === 'done') && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: s.text3, fontSize: 11 }}>Total Progress</span>
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11 }}>{overallProgress}%</span>
              </div>
              <div style={{ background: s.bg3, borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${overallProgress}%`, height: '100%',
                  background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                  borderRadius: 6, transition: 'width 0.3s',
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {manifest.map((item, i) => {
                const isCurrent = currentItem === i && phase === 'downloading'
                return (
                  <div key={item.name} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px', borderRadius: 8,
                    background: isCurrent ? `${s.accent}15` : item.synced ? `${s.green}10` : 'transparent',
                    border: `1px solid ${isCurrent ? s.accent : item.synced ? s.green : s.border}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      background: item.synced ? s.green : isCurrent ? s.yellow : s.border,
                      transition: 'all 0.3s',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: item.synced ? s.green : s.text, fontSize: 12, fontWeight: 600, fontFamily: s.mono }}>
                        {item.name}
                      </div>
                      <div style={{ color: s.text3, fontSize: 10 }}>
                        v{item.version} | {item.size} | {item.chunks} chunk{item.chunks > 1 ? 's' : ''}
                      </div>
                    </div>
                    {isCurrent && (
                      <div style={{ minWidth: 40, textAlign: 'right' }}>
                        <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 11 }}>{itemProgress}%</div>
                      </div>
                    )}
                    {item.synced && (
                      <span style={{ color: s.green, fontSize: 11, fontFamily: s.mono }}>synced</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 10 }}>
            <div style={{ color: s.green, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Sync Complete
            </div>
            <div style={{ color: s.text2, fontSize: 13 }}>
              All {manifest.length} files are up to date across all devices.
            </div>
          </div>
        )}
      </div>

      {phase === 'idle' && (
        <button
          onClick={startSync}
          style={{
            background: s.accent, border: 'none', borderRadius: 8,
            padding: '10px 24px', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, width: '100%',
          }}
        >
          Start Sync
        </button>
      )}
      {phase !== 'idle' && phase !== 'done' && (
        <div style={{ color: s.text3, fontSize: 12, textAlign: 'center' }}>
          {manifest.filter(m => m.synced).length} of {manifest.length} files synced
        </div>
      )}
      {phase === 'done' && (
        <button
          onClick={() => {
            setPhase('idle')
            setManifest(initialManifest.map(m => ({ ...m, synced: false })))
            setOverallProgress(0)
            setCurrentItem(-1)
            setItemProgress(0)
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
