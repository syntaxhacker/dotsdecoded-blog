import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const HOLD_DURATION = 60

type SeatState = 'available' | 'held' | 'sold' | 'unavailable'

interface Seat {
  id: string
  row: string
  num: number
  state: SeatState
}

interface SectionConfig {
  key: string
  label: string
  rows: string[]
  seatsPerRow: number
}

const SECTIONS: SectionConfig[] = [
  { key: 'floor', label: 'Floor', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 10 },
  { key: 'mezzanine', label: 'Mezzanine', rows: ['G', 'H', 'I', 'J'], seatsPerRow: 8 },
  { key: 'balcony', label: 'Balcony', rows: ['K', 'L', 'M'], seatsPerRow: 6 },
]

function generateSeats(cfg: SectionConfig): Seat[] {
  const seats: Seat[] = []
  const states: SeatState[] = ['available', 'available', 'available', 'available', 'available', 'sold', 'sold', 'held', 'unavailable', 'available']
  for (const row of cfg.rows) {
    for (let n = 1; n <= cfg.seatsPerRow; n++) {
      const st = states[Math.floor(Math.random() * states.length)]
      seats.push({ id: `${row}-${n}`, row, num: n, state: st })
    }
  }
  return seats
}

export default function SeatInventoryDemo() {
  const [sectionIdx, setSectionIdx] = useState(0)
  const [seats, setSeats] = useState<Seat[]>(() => generateSeats(SECTIONS[0]))
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [holdRemaining, setHoldRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdEndRef = useRef<number>(0)

  const cfg = SECTIONS[sectionIdx]

  const regenerate = useCallback((idx: number) => {
    setSeats(generateSeats(SECTIONS[idx]))
    setSelectedSeat(null)
    setHoldRemaining(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    regenerate(0)
  }, [regenerate])

  const selectSection = (idx: number) => {
    setSectionIdx(idx)
    regenerate(idx)
  }

  const clickSeat = (seatId: string) => {
    if (selectedSeat) return
    setSeats(prev => prev.map(seat => seat.id === seatId ? { ...seat, state: 'held' as SeatState } : seat))
    setSelectedSeat(seatId)
    setHoldRemaining(HOLD_DURATION)
    holdEndRef.current = Date.now() + HOLD_DURATION * 1000
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((holdEndRef.current - Date.now()) / 1000))
      setHoldRemaining(left)
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        setSeatState(seatId, 'available')
        setSelectedSeat(null)
      }
    }, 1000)
  }

  const setSeatState = (seatId: string, st: SeatState) => {
    setSeats(prev => prev.map(seat => seat.id === seatId ? { ...seat, state: st } : seat))
  }

  const confirmBooking = () => {
    if (!selectedSeat) return
    setSeatState(selectedSeat, 'sold')
    if (timerRef.current) clearInterval(timerRef.current)
    setSelectedSeat(null)
    setHoldRemaining(0)
  }

  const resetSection = () => regenerate(sectionIdx)

  const minutes = Math.floor(holdRemaining / 60)
  const seconds = holdRemaining % 60

  const selectedRow = selectedSeat ? selectedSeat.split('-')[0] : ''
  const selectedNum = selectedSeat ? selectedSeat.split('-')[1] : ''

  return (
    <DemoBoundary name="Seat Inventory">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>Seat Inventory</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {SECTIONS.map((sec, i) => (
            <button key={sec.key} onClick={() => selectSection(i)} style={{
              background: i === sectionIdx ? s.accent : s.bg3,
              border: i === sectionIdx ? `1px solid ${s.accent}` : `1px solid ${s.border}`,
              borderRadius: 8, padding: '8px 18px',
              color: i === sectionIdx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, fontWeight: i === sectionIdx ? 600 : 400,
              transition: 'all 0.15s',
            }}>{sec.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={resetSection} style={{
            background: 'transparent', border: `1px solid ${s.border}`,
            borderRadius: 6, padding: '6px 14px',
            color: s.text3, cursor: 'pointer', fontSize: 12,
          }}>Reset Section</button>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: s.bg, borderRadius: 10, padding: '20px 12px', marginBottom: 16,
          border: `1px solid ${s.border}`,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Stage — {cfg.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cfg.rows.map(row => (
              <div key={row} style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {cfg.seatsPerRow > 0 && (
                  <div style={{ width: 20, color: s.text3, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row}</div>
                )}
                {seats.filter(st => st.row === row).map(st => (
                  <div key={st.id} onClick={() => {
                    if (st.state === 'available' && !selectedSeat) clickSeat(st.id)
                  }} style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: st.state === 'available' ? s.green
                      : st.state === 'held' ? s.yellow
                      : st.state === 'sold' ? s.red
                      : s.bg3,
                    border: `1px solid ${
                      st.state === 'available' ? s.green
                      : st.state === 'held' ? s.yellow
                      : st.state === 'sold' ? s.red
                      : s.border
                    }`,
                    cursor: st.state === 'available' && !selectedSeat ? 'pointer' : 'default',
                    opacity: st.state === 'unavailable' ? 0.3 : 1,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {st.state === 'held' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.5 }} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {([
              { label: 'Available', color: s.green },
              { label: 'Held', color: s.yellow },
              { label: 'Sold', color: s.red },
              { label: 'Unavailable', color: s.text3 },
            ] as const).map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                <span style={{ color: s.text3, fontSize: 11 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedSeat ? (
          <div style={{
            background: s.bg3, border: `1px solid ${s.yellow}`, borderRadius: 10,
            padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>
                Seat {selectedRow}-{selectedNum} Selected
              </div>
              <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 13, marginTop: 4 }}>
                Hold expires in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmBooking} style={{
                background: s.accent, border: 'none', borderRadius: 8,
                padding: '8px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Confirm Booking</button>
              <button onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setSeatState(selectedSeat, 'available')
                setSelectedSeat(null)
                setHoldRemaining(0)
              }} style={{
                background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 8,
                padding: '8px 16px', color: s.text3, cursor: 'pointer', fontSize: 13,
              }}>Release</button>
            </div>
          </div>
        ) : (
          <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            Click an available seat to start a {HOLD_DURATION}-second hold timer
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
