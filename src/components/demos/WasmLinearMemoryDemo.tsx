import { useState, useRef, useCallback, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const PAGE_SIZE = 64
const ROWS = 8
const COLS = 8

function formatByte(v: number): string {
  return v.toString(16).padStart(2, '0').toUpperCase()
}

function randomByte(): number {
  return Math.floor(Math.random() * 256)
}

function createPage(): number[] {
  return Array.from({ length: PAGE_SIZE }, () => Math.floor(Math.random() * 200))
}

export default function WasmLinearMemoryDemo() {
  const [pages, setPages] = useState<number[][]>([createPage()])
  const [activeCell, setActiveCell] = useState<{ page: number; offset: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [readHighlight, setReadHighlight] = useState<{ page: number; offset: number; value: number } | null>(null)
  const [writeHighlight, setWriteHighlight] = useState<{ page: number; offset: number } | null>(null)
  const [pointerAddr, setPointerAddr] = useState(0)
  const [pointerVal, setPointerVal] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalMemory = pages.length * PAGE_SIZE

  const readByte = useCallback((page: number, offset: number) => {
    const val = pages[page][offset]
    setReadHighlight({ page, offset, value: val })
    setTimeout(() => setReadHighlight(null), 500)
    return val
  }, [pages])

  const writeByte = useCallback((page: number, offset: number, value: number) => {
    setPages(prev => {
      const next = prev.map(p => [...p])
      next[page][offset] = value & 0xFF
      return next
    })
    setWriteHighlight({ page, offset })
    setTimeout(() => setWriteHighlight(null), 500)
  }, [])

  const handleCellClick = (page: number, offset: number) => {
    setActiveCell({ page, offset })
    setEditValue(formatByte(pages[page][offset]))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleEditSubmit = () => {
    if (activeCell && editValue) {
      const val = parseInt(editValue, 16)
      if (!isNaN(val) && val >= 0 && val <= 255) {
        writeByte(activeCell.page, activeCell.offset, val)
      }
    }
    setEditing(false)
    setActiveCell(null)
  }

  const growMemory = () => {
    setPages(prev => [...prev, createPage()])
  }

  const allocatePointer = () => {
    const addr = Math.floor(Math.random() * (totalMemory - 4))
    setPointerAddr(addr)
    const val = Math.floor(Math.random() * 256)
    setPointerVal(val)
    writeByte(Math.floor(addr / PAGE_SIZE), addr % PAGE_SIZE, val)
  }

  const writeViaPointer = () => {
    if (pointerAddr >= totalMemory) return
    writeByte(Math.floor(pointerAddr / PAGE_SIZE), pointerAddr % PAGE_SIZE, pointerVal)
  }

  const readViaPointer = () => {
    if (pointerAddr >= totalMemory) return
    readByte(Math.floor(pointerAddr / PAGE_SIZE), pointerAddr % PAGE_SIZE)
  }

  const clearMemory = () => {
    setPages([Array.from({ length: PAGE_SIZE }, () => 0)])
    setActiveCell(null)
    setEditing(false)
    setReadHighlight(null)
    setWriteHighlight(null)
    setPointerAddr(0)
    setPointerVal(0)
  }

  return (
    <DemoBoundary name="WASM Linear Memory">
    <div style={{
      background: s.bg, padding: '24px 20px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>
        WASM Linear Memory
      </div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.5 }}>
        WASM has a flat linear memory space. Memory is divided into 64 KB pages. JS and WASM share the same memory buffer. Click a byte to edit it.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}`, flex: 1, minWidth: 120 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Pages</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{pages.length}</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}`, flex: 1, minWidth: 120 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Total Memory</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{totalMemory}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>bytes</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}`, flex: 1, minWidth: 120 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Pointer</div>
          <div style={{ color: pointerAddr > 0 ? s.accent : s.text3, fontFamily: s.mono, fontSize: 13 }}>
            {pointerAddr > 0 ? `0x${pointerAddr.toString(16).toUpperCase().padStart(4, '0')}` : 'not set'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Memory (hex view)
        </div>
        <div style={{
          background: s.bg2, borderRadius: 12, padding: 12,
          border: `1px solid ${s.border}`,
          maxHeight: 350, overflowY: 'auto',
        }}>
          {pages.map((page, pageIdx) => (
            <div key={pageIdx}>
              {pageIdx > 0 && (
                <div style={{
                  color: s.text3, fontSize: 10, fontFamily: s.mono,
                  padding: '4px 8px', background: s.bg3,
                  borderRadius: 4, marginBottom: 6, textAlign: 'center',
                }}>
                  Page {pageIdx + 1} (offset 0x{(pageIdx * PAGE_SIZE).toString(16).toUpperCase()})
                </div>
              )}
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {Array.from({ length: ROWS }).map((_, row) => (
                    <tr key={row}>
                      <td style={{
                        fontFamily: s.mono, fontSize: 10, color: s.text3,
                        padding: '2px 6px', textAlign: 'right', userSelect: 'none',
                        width: 60,
                      }}>
                        0x{((pageIdx * PAGE_SIZE) + row * COLS).toString(16).toUpperCase().padStart(3, '0')}
                      </td>
                      {Array.from({ length: COLS }).map((_, col) => {
                        const offset = row * COLS + col
                        const val = page[offset]
                        const isActive = activeCell?.page === pageIdx && activeCell?.offset === offset
                        const isRead = readHighlight?.page === pageIdx && readHighlight?.offset === offset
                        const isWrite = writeHighlight?.page === pageIdx && writeHighlight?.offset === offset
                        const isPointer = pointerAddr > 0 && (pageIdx * PAGE_SIZE + offset) === pointerAddr
                        return (
                          <td key={col} onClick={() => handleCellClick(pageIdx, offset)} style={{
                            fontFamily: s.mono, fontSize: 11,
                            padding: '3px 4px', textAlign: 'center',
                            cursor: 'pointer', borderRadius: 3,
                            background: isPointer
                              ? `${s.yellow}30`
                              : isWrite
                                ? `${s.green}30`
                                : isRead
                                  ? `${s.accent}30`
                                  : isActive
                                    ? `${s.accent}20`
                                    : 'transparent',
                            color: isPointer
                              ? s.yellow
                              : isWrite
                                ? s.green
                                : isRead
                                  ? s.accent
                                  : val === 0 ? s.text3 : s.text,
                            transition: 'all 0.15s',
                            fontWeight: isPointer ? 700 : 400,
                          }}>
                            {formatByte(val)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {editing && activeCell && (
        <div style={{
          background: s.bg2, borderRadius: 8, padding: '10px 14px',
          border: `1px solid ${s.accent}`, marginBottom: 12,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ color: s.text2, fontSize: 13 }}>
            Edit byte at 0x{((activeCell.page * PAGE_SIZE) + activeCell.offset).toString(16).toUpperCase().padStart(3, '0')}:
          </span>
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => {
              const v = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 2)
              setEditValue(v)
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') { setEditing(false); setActiveCell(null) } }}
            style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4,
              padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 14,
              width: 50, textAlign: 'center', outline: 'none',
            }}
          />
          <button onClick={handleEditSubmit} style={{
            background: s.accent, border: 'none', borderRadius: 4,
            padding: '4px 12px', color: '#fff', fontSize: 12, cursor: 'pointer',
          }}>
            Write
          </button>
          <button onClick={() => { setEditing(false); setActiveCell(null) }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 4,
            padding: '4px 12px', color: s.text2, fontSize: 12, cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      )}

      {readHighlight && (
        <div style={{
          background: `${s.accent}15`, borderRadius: 6, padding: '6px 12px',
          border: `1px solid ${s.accent}40`, marginBottom: 12,
          fontSize: 12, color: s.accent, fontFamily: s.mono,
        }}>
          Read byte at 0x{((readHighlight.page * PAGE_SIZE) + readHighlight.offset).toString(16).toUpperCase().padStart(3, '0')}: 0x{formatByte(readHighlight.value)} ({readHighlight.value})
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={growMemory} style={{
          background: s.accent, border: 'none', borderRadius: 8,
          padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600,
        }}>
          Grow Memory (+1 page)
        </button>
        <button onClick={allocatePointer} style={{
          background: s.yellow, border: 'none', borderRadius: 8,
          padding: '8px 16px', color: '#000', fontSize: 13, cursor: 'pointer', fontWeight: 600,
        }}>
          Alloc Pointer
        </button>
        <button onClick={readViaPointer} disabled={pointerAddr === 0} style={{
          background: s.accent, border: 'none', borderRadius: 8,
          padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          opacity: pointerAddr === 0 ? 0.5 : 1,
        }}>
          Read via Pointer
        </button>
        <button onClick={writeViaPointer} disabled={pointerAddr === 0} style={{
          background: s.green, border: 'none', borderRadius: 8,
          padding: '8px 16px', color: '#000', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          opacity: pointerAddr === 0 ? 0.5 : 1,
        }}>
          Write via Pointer
        </button>
        <button onClick={clearMemory} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 16px', color: s.text2, fontSize: 13, cursor: 'pointer',
        }}>
          Clear
        </button>
      </div>

      <div style={{
        marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 12,
        color: s.text3, fontSize: 11, lineHeight: 1.5,
      }}>
        Click any memory cell to edit its value. The pointer simulates how WASM passes memory addresses between JS and WASM — both share the same linear memory buffer, so a pointer (integer offset) gives direct access.
      </div>
    </div>
    </DemoBoundary>
  )
}
