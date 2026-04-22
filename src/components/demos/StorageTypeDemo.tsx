import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type StorageType = 'block' | 'file' | 'object'

interface DataItem {
  id: string
  label: string
  correct: StorageType
  placed: StorageType | null
  result: 'correct' | 'incorrect' | null
}

const initialItems: DataItem[] = [
  { id: 'vm-disk', label: 'VM Disk Image', correct: 'block', placed: null, result: null },
  { id: 'database', label: 'Database Volume', correct: 'block', placed: null, result: null },
  { id: 'source-code', label: 'Source Code Files', correct: 'file', placed: null, result: null },
  { id: 'configs', label: 'Config Files', correct: 'file', placed: null, result: null },
  { id: 'photos', label: 'User Photos', correct: 'object', placed: null, result: null },
  { id: 'videos', label: 'Video Streams', correct: 'object', placed: null, result: null },
  { id: 'backups', label: 'Daily Backups', correct: 'object', placed: null, result: null },
  { id: 'logs', label: 'Application Logs', correct: 'object', placed: null, result: null },
  { id: 'swap', label: 'Swap Space', correct: 'block', placed: null, result: null },
]

const storageInfo: Record<StorageType, {
  name: string
  color: string
  analogy: string
  useCases: string[]
  latency: string
  throughput: string
  cost: string
  scalability: string
}> = {
  block: {
    name: 'Block Storage',
    color: s.accent,
    analogy: 'Safe deposit box — raw, fast, low-level access',
    useCases: ['VM disks', 'Databases', 'Swap space', 'Raw partitions'],
    latency: 'Sub-millisecond',
    throughput: 'Very high',
    cost: 'High',
    scalability: 'Limited (per-volume)',
  },
  file: {
    name: 'File Storage',
    color: s.green,
    analogy: 'Filing cabinet — organized hierarchy, shared access',
    useCases: ['Home directories', 'Shared folders', 'Source code', 'Config files'],
    latency: 'Low',
    throughput: 'Medium',
    cost: 'Medium',
    scalability: 'Medium (NFS/SMB limits)',
  },
  object: {
    name: 'Object/Blob Storage',
    color: s.orange,
    analogy: 'Warehouse with barcodes — flat namespace, metadata-rich',
    useCases: ['Images', 'Videos', 'Backups', 'Logs', 'Static assets'],
    latency: 'Medium',
    throughput: 'High (parallel reads)',
    cost: 'Low',
    scalability: 'Virtually unlimited',
  },
}

export default function StorageTypeDemo() {
  const [items, setItems] = useState<DataItem[]>(initialItems)
  const [dragging, setDragging] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  const reset = useCallback(() => {
    setItems(initialItems)
    setDragging(null)
    setScore(0)
    setTotal(0)
  }, [])

  const handleDrop = useCallback((storageType: StorageType) => {
    if (!dragging) return
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== dragging) return item
        const correct = item.correct === storageType
        return { ...item, placed: storageType, result: correct ? 'correct' : 'incorrect' }
      })
    )
    const item = items.find((i) => i.id === dragging)
    if (item) {
      setTotal((t) => t + 1)
      if (item.correct === storageType) setScore((sc) => sc + 1)
    }
    setDragging(null)
  }, [dragging, items])

  const remaining = items.filter((i) => !i.placed)
  const placed = items.filter((i) => i.placed)

  const renderStoragePanel = (type: StorageType) => {
    const info = storageInfo[type]
    const placedItems = items.filter((i) => i.placed === type)
    const isOver = dragging !== null

    return (
      <div
        key={type}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
        onDrop={() => handleDrop(type)}
        style={{
          flex: 1, minWidth: 0,
          background: s.bg,
          border: `2px dashed ${isOver ? info.color : s.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
      >
        <div style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${s.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: info.color }} />
          <span style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: info.color }}>
            {info.name}
          </span>
        </div>

        <div style={{ padding: 10 }}>
          <div style={{
            fontSize: 10, color: s.text3, lineHeight: 1.4, marginBottom: 8, fontStyle: 'italic',
          }}>
            {info.analogy}
          </div>

          <div style={{
            minHeight: 40, borderRadius: 4, background: s.bg2,
            border: `1px solid ${s.border}`, padding: 6, marginBottom: 8,
          }}>
            {placedItems.length === 0 ? (
              <div style={{ color: s.text3, fontSize: 10, textAlign: 'center', padding: '6px 0' }}>
                Drop items here
              </div>
            ) : (
              placedItems.map((item) => (
                <div key={item.id} style={{
                  padding: '3px 8px', marginBottom: 3, borderRadius: 3,
                  background: item.result === 'correct' ? `${s.green}15` : `${s.red}15`,
                  border: `1px solid ${item.result === 'correct' ? `${s.green}30` : `${s.red}30`}`,
                  fontSize: 10, fontFamily: s.mono,
                  color: item.result === 'correct' ? s.green : s.red,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>{item.label}</span>
                  <span>{item.result === 'correct' ? 'OK' : `-> ${storageInfo[item.correct!].name}`}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ fontFamily: s.mono, fontSize: 9, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {([
              ['Latency', info.latency],
              ['Throughput', info.throughput],
              ['Cost', info.cost],
              ['Scale', info.scalability],
            ] as const).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: s.text3 }}>{label}</span>
                <span style={{ color: s.text2 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="Storage Types">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '10px 14px', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
            Drag each data type to the correct storage.{' '}
            <span style={{ color: s.text2 }}>Score: {score}/{total}</span>
          </div>
          {total > 0 && (
            <button onClick={reset} style={{
              padding: '4px 12px', background: s.bg3, color: s.text2,
              border: `1px solid ${s.border}`, borderRadius: 4, cursor: 'pointer',
              fontFamily: s.mono, fontSize: 10,
            }}>
              Reset
            </button>
          )}
        </div>

        {remaining.length > 0 && (
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: 10, marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap',
          }}>
            {remaining.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragging(item.id)}
                onDragEnd={() => setDragging(null)}
                style={{
                  padding: '6px 12px', borderRadius: 4,
                  background: dragging === item.id ? s.bg3 : s.bg2,
                  border: `1px solid ${dragging === item.id ? s.accent : s.border}`,
                  fontSize: 11, fontFamily: s.mono, color: s.text2,
                  cursor: 'grab', userSelect: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {renderStoragePanel('block')}
          {renderStoragePanel('file')}
          {renderStoragePanel('object')}
        </div>

        {total === items.length && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 6, textAlign: 'center',
            background: score === total ? `${s.green}10` : `${s.yellow}10`,
            border: `1px solid ${score === total ? `${s.green}30` : `${s.yellow}30`}`,
            fontFamily: s.mono, fontSize: 12,
            color: score === total ? s.green : s.yellow,
          }}>
            {score === total
              ? `Perfect! ${score}/${total} — you know your storage types.`
              : `${score}/${total} correct. Review the use cases above and try again.`}
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
