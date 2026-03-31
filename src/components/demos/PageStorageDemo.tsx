import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const MAX_ROWS = 6
const NAMES = [
  'Alice','Bob','Carol','Dave','Eve','Frank','Grace','Hank',
  'Iris','Jack','Kate','Leo','Mona','Nick','Olga','Paul',
  'Quin','Rosa','Stan','Tina','Uma','Vera','Will','Xena','Yuri','Zara',
]
const ROW_COLORS = [
  '#5b8def','#3dd68c','#9b7bea','#e8945a','#e0b040',
  '#6bb8e0','#e07be8','#7be8b8','#e8c97b','#b87be8',
]

interface RowData {
  id: number
  name: string
  color: string
}

interface PageData {
  id: number
  rows: RowData[]
  splitting: boolean
  appearing: boolean
}

function PageCard({
  page,
  isSelected,
  showPageReads,
  selectedRowId,
  onRowClick,
  lastInsertedId,
}: {
  page: PageData
  isSelected: boolean
  showPageReads: boolean
  selectedRowId: number | null
  onRowClick: (rowId: number) => void
  lastInsertedId: number | null
}) {
  const fill = (page.rows.length / MAX_ROWS) * 100
  const isFull = page.rows.length >= MAX_ROWS
  const [staggerDone, setStaggerDone] = useState(true)
  const prevAppearing = useRef(page.appearing)

  useEffect(() => {
    if (prevAppearing.current === true && page.appearing === false) {
      setStaggerDone(false)
      const t = setTimeout(() => setStaggerDone(true), 500)
      return () => clearTimeout(t)
    }
    prevAppearing.current = page.appearing
  }, [page.appearing])

  return (
    <div style={{
      width: 240,
      background: page.splitting ? 'rgba(232, 93, 93, 0.08)' : s.bg2,
      border: `2px solid ${page.splitting ? s.red : isSelected ? s.accent : s.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      opacity: page.appearing ? 0 : 1,
      transform: page.appearing
        ? 'translateY(16px) scale(0.95)'
        : 'translateY(0) scale(1)',
      transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s, box-shadow 0.3s',
      boxShadow: page.splitting
        ? '0 0 24px rgba(232, 93, 93, 0.25)'
        : isSelected
          ? '0 0 20px rgba(91, 141, 239, 0.15)'
          : 'none',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: `1px solid ${s.border}`,
        background: s.bg3,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: page.splitting ? s.red : s.text,
          fontFamily: s.mono,
        }}>
          Page {page.id}
        </span>
        <span style={{
          fontSize: 11,
          color: s.text3,
          fontFamily: s.mono,
          background: s.bg,
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          4 KB
        </span>
      </div>

      <div style={{
        minHeight: MAX_ROWS * 38 + 12,
        padding: '6px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {Array.isArray(page.rows)
          ? page.rows.map((row, idx) => {
              const highlighted = showPageReads && selectedRowId === row.id
              const isNew = lastInsertedId === row.id
              const staggerDelay = staggerDone ? 0 : idx * 0.07
              const staggerOpacity = staggerDone ? 1 : 0
              const rowOpacity = isNew ? 0 : staggerOpacity

              return (
                <div
                  key={row.id}
                  onClick={() => showPageReads && onRowClick(row.id)}
                  style={{
                    margin: '0 8px',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${highlighted ? s.accent : s.border}`,
                    background: highlighted ? 'rgba(91, 141, 239, 0.12)' : s.bg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: showPageReads ? 'pointer' : 'default',
                    borderLeft: `3px solid ${row.color}`,
                    opacity: rowOpacity,
                    transform: isNew
                      ? 'translateY(-8px) scale(0.95)'
                      : staggerDone
                        ? 'none'
                        : 'translateX(-20px)',
                    transition: `opacity 0.35s ease ${staggerDelay}s, transform 0.35s ease ${staggerDelay}s`,
                  }}
                >
                  <span style={{
                    fontSize: 11,
                    fontFamily: s.mono,
                    color: s.text3,
                    minWidth: 20,
                  }}>
                    {row.id}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontFamily: s.mono,
                    color: s.text,
                    flex: 1,
                  }}>
                    {row.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: s.text3,
                    fontFamily: s.mono,
                  }}>
                    ~680B
                  </span>
                </div>
              )
            })
          : null}

        {Array.isArray(page.rows) && page.rows.length < MAX_ROWS
          ? Array.from({ length: MAX_ROWS - page.rows.length }).map((_, i) => (
              <div
                key={`empty-${page.id}-${i}`}
                style={{
                  margin: '0 8px',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px dashed rgba(62, 74, 91, 0.4)',
                  minHeight: 32,
                }}
              />
            ))
          : null}
      </div>

      <div style={{
        padding: '8px 12px',
        borderTop: `1px solid ${s.border}`,
        background: s.bg3,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>
            Capacity
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: s.mono,
            color: isFull ? s.red : s.text3,
            fontWeight: isFull ? 700 : 400,
          }}>
            {page.rows.length}/{MAX_ROWS}
          </span>
        </div>
        <div style={{
          height: 4,
          background: s.bg,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${fill}%`,
            background: isFull
              ? s.red
              : fill > 66
                ? s.yellow
                : s.green,
            borderRadius: 2,
            transition: 'width 0.4s ease, background 0.4s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

export default function PageStorageDemo() {
  const [pages, setPages] = useState<PageData[]>([
    { id: 1, rows: [], splitting: false, appearing: false },
  ])
  const [rowCounter, setRowCounter] = useState(0)
  const [showPageReads, setShowPageReads] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [splitMsg, setSplitMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastInsertedId, setLastInsertedId] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef(pages)

  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [pages.length])

  const lastPage = pages[pages.length - 1]
  const freeSpace = lastPage
    ? Math.max(0, ((MAX_ROWS - lastPage.rows.length) / MAX_ROWS) * 100)
    : 0

  const selectedPageId =
    selectedRowId !== null
      ? pages.find(p =>
          Array.isArray(p.rows) && p.rows.some(r => r.id === selectedRowId)
        )?.id ?? null
      : null

  const selectedPage =
    selectedPageId !== null
      ? pages.find(p => p.id === selectedPageId) ?? null
      : null

  const otherRowCount = selectedPage ? selectedPage.rows.length - 1 : 0

  const handleRowClick = useCallback((rowId: number) => {
    setSelectedRowId(prev => (prev === rowId ? null : rowId))
  }, [])

  const insertRow = useCallback(() => {
    if (busy) return

    const current = pagesRef.current
    const last = current[current.length - 1]
    const counter = rowCounter

    if (last.rows.length >= MAX_ROWS) {
      setBusy(true)
      setSplitMsg(null)

      setPages(prev =>
        prev.map((p, i) =>
          i === prev.length - 1 ? { ...p, splitting: true } : p
        )
      )

      setTimeout(() => {
        const rowId = counter + 1
        const newRow: RowData = {
          id: rowId,
          name: NAMES[counter % NAMES.length],
          color: ROW_COLORS[counter % ROW_COLORS.length],
        }
        setRowCounter(counter + 1)

        const newPageId = current.length + 1

        setPages(prev => {
          const lp = prev[prev.length - 1]
          const allRows = [...lp.rows, newRow]
          const mid = Math.ceil(allRows.length / 2)

          return [
            ...prev.slice(0, -1),
            { ...lp, rows: allRows.slice(0, mid), splitting: false },
            {
              id: newPageId,
              rows: allRows.slice(mid),
              splitting: false,
              appearing: true,
            },
          ]
        })

        setSplitMsg(`Page Split! Created page ${newPageId}`)

        setTimeout(() => {
          setPages(prev => prev.map(p => ({ ...p, appearing: false })))
          setBusy(false)
          setTimeout(() => setSplitMsg(null), 2500)
        }, 800)
      }, 800)
    } else {
      const rowId = counter + 1
      const row: RowData = {
        id: rowId,
        name: NAMES[counter % NAMES.length],
        color: ROW_COLORS[counter % ROW_COLORS.length],
      }
      setRowCounter(counter + 1)
      setLastInsertedId(rowId)

      setTimeout(() => setLastInsertedId(null), 50)

      setPages(prev =>
        prev.map((p, i) =>
          i === prev.length - 1 ? { ...p, rows: [...p.rows, row] } : p
        )
      )
    }
  }, [busy, rowCounter])

  return (
    <DemoBoundary name="Page Storage">
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: s.text,
      }}>
        <div style={{
          display: 'flex',
          gap: 24,
          padding: '10px 16px',
          background: s.bg2,
          borderRadius: 8,
          border: `1px solid ${s.border}`,
          marginBottom: 16,
          fontFamily: s.mono,
          fontSize: 13,
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ color: s.text3 }}>Total pages: </span>
            <span style={{ color: s.text, fontWeight: 600 }}>
              {pages.length}
            </span>
          </div>
          <div>
            <span style={{ color: s.text3 }}>Rows per page: </span>
            <span style={{ color: s.text, fontWeight: 600 }}>{MAX_ROWS}</span>
          </div>
          <div>
            <span style={{ color: s.text3 }}>Free space: </span>
            <span style={{
              color: freeSpace > 30 ? s.green : freeSpace > 0 ? s.yellow : s.red,
              fontWeight: 600,
            }}>
              {freeSpace.toFixed(0)}%
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={insertRow}
            disabled={busy}
            style={{
              padding: '8px 20px',
              background: busy ? s.bg3 : s.accent,
              color: busy ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            {busy ? 'Splitting...' : 'Insert Row'}
          </button>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 13,
            color: s.text2,
            userSelect: 'none',
          }}>
            <div
              onClick={() => setShowPageReads(prev => !prev)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: showPageReads ? s.accent : s.bg3,
                border: `1px solid ${showPageReads ? s.accent : s.border}`,
                position: 'relative',
                transition: 'background 0.2s, border-color 0.2s',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: showPageReads ? '#fff' : s.text3,
                position: 'absolute',
                top: 1,
                left: showPageReads ? 17 : 1,
                transition: 'left 0.2s, background 0.2s',
              }} />
            </div>
            Show page reads
          </label>

          {splitMsg && (
            <div style={{
              padding: '6px 14px',
              background: 'rgba(232, 93, 93, 0.1)',
              border: `1px solid ${s.red}`,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: s.mono,
              color: s.red,
              fontWeight: 600,
            }}>
              {splitMsg}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          paddingBottom: 8,
        }}>
          {Array.isArray(pages)
            ? pages.map(page => (
                <PageCard
                  key={page.id}
                  page={page}
                  isSelected={selectedPageId === page.id}
                  showPageReads={showPageReads}
                  selectedRowId={selectedRowId}
                  onRowClick={handleRowClick}
                  lastInsertedId={lastInsertedId}
                />
              ))
            : null}
          <div ref={endRef} />
        </div>

        {showPageReads && selectedRowId !== null && selectedPageId !== null && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'rgba(91, 141, 239, 0.06)',
            border: `1px solid ${s.accent}`,
            borderRadius: 8,
            fontSize: 13,
            color: s.text2,
            lineHeight: 1.6,
          }}>
            <span style={{ color: s.accent, fontWeight: 600 }}>
              Row {selectedRowId}
            </span>{' '}
            is stored in{' '}
            <span style={{ color: s.accent, fontWeight: 600 }}>
              Page {selectedPageId}
            </span>
            . To read this single row, the database must load the{' '}
            <span style={{ color: s.yellow, fontWeight: 600 }}>
              entire 4 KB page
            </span>{' '}
            from disk into memory. The other{' '}
            {otherRowCount}{' '}
            row{otherRowCount !== 1 ? 's' : ''} on this page come along for
            the ride.
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
