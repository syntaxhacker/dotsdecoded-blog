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

type SlotStatus = 'idle' | 'hit' | 'miss' | 'checking'

interface CacheSlot {
  index: number
  label: string
  value: string | null
  status: SlotStatus
  changed: boolean
}

interface LogEntry {
  renderNum: number
  nameChanged: boolean
  emojiChanged: boolean
  slot0Status: 'HIT' | 'MISS'
  slot2Status: 'HIT' | 'MISS'
  cachedCount: number
  totalChecks: number
  perfect: boolean
}

const initialSlots: CacheSlot[] = [
  { index: 0, label: 'name (dep)', value: null, status: 'idle', changed: false },
  { index: 1, label: 'greeting (computed)', value: null, status: 'idle', changed: false },
  { index: 2, label: 'emoji (dep)', value: null, status: 'idle', changed: false },
]

function MemoCacheDemo() {
  const [name, setName] = useState('World')
  const [emoji, setEmoji] = useState('')
  const [slots, setSlots] = useState<CacheSlot[]>(initialSlots)
  const [renderCount, setRenderCount] = useState(0)
  const [totalHits, setTotalHits] = useState(0)
  const [totalMisses, setTotalMisses] = useState(0)
  const [log, setLog] = useState<LogEntry[]>([])
  const [animating, setAnimating] = useState(false)
  const [currentPhase, setCurrentPhase] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef<number>(0)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log])

  const hitRate = renderCount === 0 ? 0 : Math.round((totalHits / (totalHits + totalMisses)) * 100)

  const handleRender = () => {
    if (animating) return
    setAnimating(true)
    phaseRef.current = 0

    const prevName = slots[0].value
    const prevEmoji = slots[2].value
    const nameChanged = prevName === null || prevName !== name
    const emojiChanged = prevEmoji === null || prevEmoji !== emoji

    const newSlot0Status: 'HIT' | 'MISS' = nameChanged ? 'MISS' : 'HIT'
    const newSlot2Status: 'HIT' | 'MISS' = emojiChanged ? 'MISS' : 'HIT'
    const cachedCount = (newSlot0Status === 'HIT' ? 1 : 0) + (newSlot2Status === 'HIT' ? 1 : 0)
    const perfect = cachedCount === 2

    const greeting = `Hello, ${name}!`
    const jsx = `${greeting} ${emoji}`

    const steps: Array<{ phase: string; slotUpdates: CacheSlot[]; stats: { hits: number; misses: number; count: number } }> = []

    setSlots(prev => prev.map(sl => ({ ...sl, status: 'idle', changed: false })))
    setCurrentPhase('')

    const baseSlots = [
      { index: 0, label: 'name (dep)', value: prevName, status: 'idle' as SlotStatus, changed: nameChanged },
      { index: 1, label: 'greeting (computed)', value: slots[1].value, status: 'idle' as SlotStatus, changed: false },
      { index: 2, label: 'emoji (dep)', value: prevEmoji, status: 'idle' as SlotStatus, changed: emojiChanged },
    ]

    steps.push({
      phase: 'const $ = _c(3)',
      slotUpdates: baseSlots.map(sl => ({ ...sl, status: 'idle' })),
      stats: { hits: totalHits, misses: totalMisses, count: renderCount },
    })

    steps.push({
      phase: `$[0] !== "${name}" ? ...`,
      slotUpdates: baseSlots.map((sl, i) => ({
        ...sl,
        status: i === 0 ? 'checking' as SlotStatus : 'idle' as SlotStatus,
      })),
      stats: { hits: totalHits, misses: totalMisses, count: renderCount },
    })

    steps.push({
      phase: nameChanged ? `Slot 0 MISS — recompute greeting` : `Slot 0 HIT — load cached greeting`,
      slotUpdates: baseSlots.map((sl, i) => {
        if (i === 0) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'hit' as SlotStatus, value: name }
        if (i === 1 && nameChanged) return { ...sl, status: 'miss' as SlotStatus, value: greeting, changed: true }
        return sl
      }),
      stats: {
        hits: totalHits + (nameChanged ? 0 : 1),
        misses: totalMisses + (nameChanged ? 1 : 0),
        count: renderCount + 1,
      },
    })

    steps.push({
      phase: `$[2] !== "${emoji}" ? ...`,
      slotUpdates: baseSlots.map((sl, i) => {
        if (i === 0) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'hit' as SlotStatus, value: name }
        if (i === 1) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'idle' as SlotStatus, value: nameChanged ? greeting : (slots[1].value as string), changed: nameChanged }
        if (i === 2) return { ...sl, status: 'checking' as SlotStatus }
        return sl
      }),
      stats: {
        hits: totalHits + (nameChanged ? 0 : 1),
        misses: totalMisses + (nameChanged ? 1 : 0),
        count: renderCount + 1,
      },
    })

    steps.push({
      phase: emojiChanged ? `Slot 2 MISS — recompute JSX` : `Slot 2 HIT — load cached JSX`,
      slotUpdates: baseSlots.map((sl, i) => {
        if (i === 0) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'hit' as SlotStatus, value: name }
        if (i === 1) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'idle' as SlotStatus, value: nameChanged ? greeting : (slots[1].value as string), changed: nameChanged }
        if (i === 2) return { ...sl, status: emojiChanged ? 'miss' as SlotStatus : 'hit' as SlotStatus, value: emoji }
        return sl
      }),
      stats: {
        hits: totalHits + (nameChanged ? 0 : 1) + (emojiChanged ? 0 : 1),
        misses: totalMisses + (nameChanged ? 1 : 0) + (emojiChanged ? 1 : 0),
        count: renderCount + 1,
      },
    })

    steps.push({
      phase: perfect ? 'All slots matched — zero work done!' : 'return t1',
      slotUpdates: baseSlots.map((sl, i) => {
        if (i === 0) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'hit' as SlotStatus, value: name }
        if (i === 1) return { ...sl, status: nameChanged ? 'miss' as SlotStatus : 'idle' as SlotStatus, value: nameChanged ? greeting : (slots[1].value as string), changed: nameChanged }
        if (i === 2) return { ...sl, status: emojiChanged ? 'miss' as SlotStatus : 'hit' as SlotStatus, value: emoji }
        return sl
      }),
      stats: {
        hits: totalHits + cachedCount,
        misses: totalMisses + (2 - cachedCount),
        count: renderCount + 1,
      },
    })

    let stepIdx = 0
    const runStep = () => {
      if (stepIdx >= steps.length) {
        const entry: LogEntry = {
          renderNum: renderCount + 1,
          nameChanged,
          emojiChanged,
          slot0Status: newSlot0Status,
          slot2Status: newSlot2Status,
          cachedCount,
          totalChecks: 2,
          perfect,
        }
        setLog(prev => [...prev, entry])
        setRenderCount(prev => prev + 1)
        setTotalHits(totalHits + cachedCount)
        setTotalMisses(totalMisses + (2 - cachedCount))
        setAnimating(false)
        setCurrentPhase('')
        return
      }

      const step = steps[stepIdx]
      setCurrentPhase(step.phase)
      setSlots(step.slotUpdates)
      setTotalHits(step.stats.hits)
      setTotalMisses(step.stats.misses)
      setRenderCount(step.stats.count)
      stepIdx++
      phaseRef.current = window.setTimeout(runStep, 600) as unknown as number
    }

    window.setTimeout(runStep, 100)
  }

  useEffect(() => {
    return () => {
      if (phaseRef.current) clearTimeout(phaseRef.current)
    }
  }, [])

  const slotColors: Record<SlotStatus, string> = {
    idle: s.bg3,
    checking: s.yellow,
    hit: s.green,
    miss: s.red,
  }

  const slotBorderColors: Record<SlotStatus, string> = {
    idle: s.border,
    checking: s.yellow,
    hit: s.green,
    miss: s.red,
  }

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${s.border}`,
        background: s.bg2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: s.text2, fontSize: 13, fontWeight: 600 }}>Props:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13 }}>name=</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={animating}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 4,
                color: s.text,
                fontFamily: s.mono,
                fontSize: 13,
                padding: '4px 8px',
                width: 100,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13 }}>emoji=</span>
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              disabled={animating}
              placeholder="e.g. :)"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 4,
                color: s.text,
                fontFamily: s.mono,
                fontSize: 13,
                padding: '4px 8px',
                width: 80,
                outline: 'none',
              }}
            />
          </div>
        </div>
        <button
          onClick={handleRender}
          disabled={animating}
          style={{
            background: animating ? s.bg3 : s.accent,
            color: animating ? s.text3 : '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: animating ? 'not-allowed' : 'pointer',
            fontFamily: s.mono,
            transition: 'background 0.2s',
          }}
        >
          {animating ? 'Rendering...' : 'Render'}
        </button>
      </div>

      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{
          color: s.text3,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}>
          Memo Cache — const $ = _c(3)
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          {slots.map((slot) => (
            <div
              key={slot.index}
              style={{
                flex: 1,
                borderRadius: 6,
                overflow: 'hidden',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                border: `2px solid ${slotBorderColors[slot.status]}`,
                boxShadow: slot.status === 'hit'
                  ? `0 0 12px ${s.green}40`
                  : slot.status === 'miss'
                    ? `0 0 12px ${s.red}40`
                    : slot.status === 'checking'
                      ? `0 0 12px ${s.yellow}40`
                      : 'none',
              }}
            >
              <div style={{
                padding: '6px 10px',
                background: slotColors[slot.status] + '20',
                borderBottom: `1px solid ${slotBorderColors[slot.status]}40`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text3 }}>${'['}{slot.index}{']'}</span>
                {slot.status === 'hit' && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.green, letterSpacing: 0.5 }}>HIT</span>
                )}
                {slot.status === 'miss' && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.red, letterSpacing: 0.5 }}>MISS</span>
                )}
                {slot.status === 'checking' && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.yellow, letterSpacing: 0.5 }}>CHK</span>
                )}
                {slot.status === 'idle' && slot.changed && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.yellow, letterSpacing: 0.5 }}>DIRTY</span>
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>{slot.label}</div>
                <div style={{
                  fontFamily: s.mono,
                  fontSize: 13,
                  color: slot.value !== null ? s.text : s.text3,
                  minHeight: 20,
                  wordBreak: 'break-all',
                }}>
                  {slot.value !== null ? `"${slot.value}"` : '(empty)'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentPhase && (
        <div style={{
          margin: '0 20px',
          padding: '8px 12px',
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 4,
          fontFamily: s.mono,
          fontSize: 12,
          color: s.accent,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: s.yellow, animation: 'pulse 1s infinite' }}>&gt;</span>
          {currentPhase}
        </div>
      )}

      <div style={{
        padding: '8px 20px 12px',
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{
          padding: '8px 12px',
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Renders</span>
          <span style={{ color: s.text, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{renderCount}</span>
        </div>
        <div style={{
          padding: '8px 12px',
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: s.green, fontSize: 11 }}>Hits</span>
          <span style={{ color: s.green, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{totalHits}</span>
        </div>
        <div style={{
          padding: '8px 12px',
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: s.red, fontSize: 11 }}>Misses</span>
          <span style={{ color: s.red, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{totalMisses}</span>
        </div>
        <div style={{
          padding: '8px 12px',
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Hit Rate</span>
          <span style={{
            color: hitRate >= 80 ? s.green : hitRate >= 50 ? s.yellow : s.red,
            fontFamily: s.mono,
            fontSize: 14,
            fontWeight: 700,
          }}>{hitRate}%</span>
        </div>
      </div>

      {log.length > 0 && (
        <div style={{
          borderTop: `1px solid ${s.border}`,
          maxHeight: 180,
          overflowY: 'auto',
          background: '#060810',
        }}>
          <div style={{
            padding: '8px 12px',
            color: s.text3,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            borderBottom: `1px solid ${s.border}`,
            position: 'sticky',
            top: 0,
            background: '#060810',
            zIndex: 1,
          }}>
            Execution Log
          </div>
          <div ref={logRef} style={{ padding: '4px 0' }}>
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  padding: '5px 12px',
                  fontFamily: s.mono,
                  fontSize: 11,
                  lineHeight: 1.5,
                  borderBottom: i < log.length - 1 ? `1px solid ${s.border}20` : 'none',
                  color: s.text2,
                }}
              >
                <span style={{ color: s.purple }}>Render #{entry.renderNum}</span>
                <span style={{ color: s.text3 }}>{': '}</span>
                <span style={{ color: entry.nameChanged ? s.yellow : s.green }}>
                  name={entry.nameChanged ? 'changed' : 'same'}
                </span>
                <span style={{ color: s.text3 }}>{', '}</span>
                <span style={{ color: entry.emojiChanged ? s.yellow : s.green }}>
                  emoji={entry.emojiChanged ? 'changed' : 'same'}
                </span>
                <span style={{ color: s.text3 }}>{' → '}</span>
                <span style={{ color: entry.slot0Status === 'HIT' ? s.green : s.red }}>
                  Slot 0 {entry.slot0Status}
                </span>
                <span style={{ color: s.text3 }}>{', '}</span>
                <span style={{ color: entry.slot2Status === 'HIT' ? s.green : s.red }}>
                  Slot 2 {entry.slot2Status}
                </span>
                <span style={{ color: s.text3 }}>{'. '}</span>
                <span style={{ color: s.accent }}>
                  {entry.cachedCount}/{entry.totalChecks} cached
                </span>
                {entry.perfect && (
                  <span style={{ color: s.green, fontWeight: 600 }}> (Perfect!)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

export default function MemoCacheDemoWithBoundary() {
  return (
    <DemoBoundary name="Memo Cache Explorer">
      <MemoCacheDemo />
    </DemoBoundary>
  )
}
