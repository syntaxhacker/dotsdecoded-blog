import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface PageTableEntry {
  vpn: number
  pfn: number | null
  valid: boolean
  dirty?: boolean
  accessed?: boolean
}

const pageTable: PageTableEntry[] = [
  { vpn: 0, pfn: 7, valid: true, dirty: false, accessed: true },
  { vpn: 1, pfn: 4, valid: true, dirty: true, accessed: true },
  { vpn: 2, pfn: null, valid: false },
  { vpn: 3, pfn: 9, valid: true, dirty: false, accessed: false },
  { vpn: 4, pfn: null, valid: false },
  { vpn: 5, pfn: 2, valid: true, dirty: false, accessed: true },
  { vpn: 6, pfn: null, valid: false },
  { vpn: 7, pfn: 6, valid: true, dirty: false, accessed: false },
]

const physicalFrames = [
  { pfn: 0, label: 'Free' }, { pfn: 1, label: 'Free' }, { pfn: 2, label: 'P5 data', owner: 5 },
  { pfn: 3, label: 'Free' }, { pfn: 4, label: 'P1 heap', owner: 1 },
  { pfn: 5, label: 'Free' }, { pfn: 6, label: 'P7 text', owner: 7 },
  { pfn: 7, label: 'P0 text', owner: 0 },
  { pfn: 8, label: 'Free' }, { pfn: 9, label: 'P3 stack', owner: 3 },
]

interface TLBEntry {
  vpn: number
  pfn: number
}

export default function OsVirtualMemoryDemo() {
  const [accessVpn, setAccessVpn] = useState<number | null>(null)
  const [tlb, setTlb] = useState<TLBEntry[]>([
    { vpn: 0, pfn: 7 },
    { vpn: 5, pfn: 2 },
  ])
  const [result, setResult] = useState<{ hit: boolean; pfn: number | null; fault: boolean } | null>(null)

  const accessPage = (vpn: number) => {
    setAccessVpn(vpn)
    const tlbEntry = tlb.find(t => t.vpn === vpn)
    const pte = pageTable[vpn]
    if (tlbEntry) {
      setTlb(prev => prev.filter(t => t.vpn !== vpn).concat({ vpn, pfn: tlbEntry.pfn }))
      setResult({ hit: true, pfn: tlbEntry.pfn, fault: false })
    } else if (pte.valid) {
      const newTlb = tlb.length >= 4 ? tlb.slice(1) : tlb
      setTlb([...newTlb, { vpn, pfn: pte.pfn! }])
      setResult({ hit: false, pfn: pte.pfn, fault: false })
    } else {
      setResult({ hit: false, pfn: null, fault: true })
    }
    setTimeout(() => {
      setAccessVpn(null)
      setResult(null)
    }, 2500)
  }

  return (
    <DemoBoundary name="Virtual Memory Mapping">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Virtual Memory & Page Tables</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Each process sees a contiguous virtual address space. The MMU translates virtual pages to physical frames
          using the page table. The TLB caches recent translations for speed.
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Virtual Address Space</div>
            <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
              {[
                { label: 'Stack', vpn: '7', color: s.orange, size: '25%' },
                { label: 'Heap', vpn: '4-5', color: s.yellow, size: '25%' },
                { label: 'Data', vpn: '2-3', color: s.accent, size: '15%' },
                { label: 'Text', vpn: '0-1', color: s.green, size: '35%' },
              ].map(seg => (
                <div key={seg.label} style={{
                  height: 36, background: seg.color + '22',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 14px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ color: seg.color, fontSize: 12, fontWeight: 600 }}>{seg.label}</span>
                  <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>VPN {seg.vpn}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1.5, minWidth: 280 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Page Table</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {pageTable.map(entry => (
                <div key={entry.vpn} onClick={() => accessPage(entry.vpn)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: accessVpn === entry.vpn ? `${s.accent}25` : s.bg,
                  border: `1px solid ${accessVpn === entry.vpn ? s.accent : s.border}`,
                  borderRadius: 6, padding: '6px 12px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, minWidth: 40 }}>VPN {entry.vpn}</span>
                  <span style={{
                    color: entry.valid ? s.green : s.red,
                    fontSize: 10, fontWeight: 600, minWidth: 36,
                  }}>
                    {entry.valid ? 'VALID' : 'INVALID'}
                  </span>
                  <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11, minWidth: 50 }}>
                    {entry.valid ? `PFN ${entry.pfn}` : '---'}
                  </span>
                  {entry.valid && (
                    <>
                      <span style={{ color: entry.dirty ? s.yellow : s.text3, fontSize: 10 }}>
                        {entry.dirty ? 'D' : '-'}
                      </span>
                      <span style={{ color: entry.accessed ? s.accent : s.text3, fontSize: 10 }}>
                        {entry.accessed ? 'A' : '-'}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div style={{
            background: s.bg, borderRadius: 10, border: `1px solid ${result.fault ? s.red : result.hit ? s.green : s.yellow}`,
            padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                background: result.fault ? s.red : result.hit ? s.green : s.yellow,
                borderRadius: 4, padding: '2px 8px',
                fontSize: 11, fontWeight: 700, fontFamily: s.mono,
                color: '#000',
              }}>
                {result.fault ? 'PAGE FAULT' : result.hit ? 'TLB HIT' : 'TLB MISS'}
              </span>
              <span style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>
                VPN accessed -&gt; {result.fault ? 'Disk I/O needed' : `PFN ${result.pfn}`}
              </span>
            </div>
            {result.fault && (
              <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.5 }}>
                1. MMU detects invalid PTE. 2. Trap to kernel. 3. Page fault handler finds free frame.
                4. Disk read scheduled. 5. Process blocked. 6. Page table updated on completion.
              </div>
            )}
            {result.hit && (
              <div style={{ color: s.green, fontSize: 11 }}>Translation in TLB: ~1-2 cycles. No memory access needed for page table walk.</div>
            )}
            {!result.hit && !result.fault && (
              <div style={{ color: s.yellow, fontSize: 11 }}>TLB miss: hardware walked page table (4-level on x86-64, ~4 memory accesses). Added to TLB.</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Physical Frames</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {physicalFrames.map(f => (
                <div key={f.pfn} style={{
                  background: accessVpn !== null && pageTable[accessVpn]?.pfn === f.pfn ? `${s.green}25` : s.bg,
                  border: `1px solid ${accessVpn !== null && pageTable[accessVpn]?.pfn === f.pfn ? s.green : s.border}`,
                  borderRadius: 4, padding: '6px 4px', textAlign: 'center',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono }}>PFN {f.pfn}</div>
                  <div style={{
                    color: f.owner !== undefined ? s.text2 : s.text3,
                    fontSize: 8, fontFamily: s.mono,
                  }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>TLB (Translation Lookaside Buffer)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tlb.map((t, i) => (
                <div key={i} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '6px 12px', display: 'flex', justifyContent: 'space-between',
                  fontFamily: s.mono, fontSize: 11,
                }}>
                  <span style={{ color: s.text3 }}>VPN {t.vpn}</span>
                  <span style={{ color: s.green }}>PFN {t.pfn}</span>
                </div>
              ))}
              {tlb.length === 0 && <span style={{ color: s.text3, fontSize: 11 }}>Empty</span>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.green }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Click any PTE to access</span>
            </div>
            <span style={{ color: s.text3, fontSize: 11 }}>D = Dirty, A = Accessed</span>
            <span style={{ color: s.text3, fontSize: 11 }}>TLB caches last 4 translations (LRU)</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
