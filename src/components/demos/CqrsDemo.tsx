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

interface Product {
  id: number
  name: string
  price: number
  category: string
  stock: number
}

interface WriteRecord {
  id: number
  name: string
  price: number
  category_id: number
  stock: number
}

interface ReadRecord {
  id: number
  name: string
  price: number
  category_name: string
  in_stock: boolean
  search_text: string
}

let productIdCounter = 3

export default function CqrsDemo() {
  const [writeDb, setWriteDb] = useState<WriteRecord[]>([
    { id: 1, name: 'Mechanical Keyboard', price: 149, category_id: 1, stock: 45 },
    { id: 2, name: 'Wireless Mouse', price: 79, category_id: 1, stock: 120 },
    { id: 3, name: 'USB-C Hub', price: 49, category_id: 2, stock: 0 },
  ])

  const [readDb, setReadDb] = useState<ReadRecord[]>([
    { id: 1, name: 'Mechanical Keyboard', price: 149, category_name: 'Peripherals', in_stock: true, search_text: 'mechanical keyboard peripherals' },
    { id: 2, name: 'Wireless Mouse', price: 79, category_name: 'Peripherals', in_stock: true, search_text: 'wireless mouse peripherals' },
    { id: 3, name: 'USB-C Hub', price: 49, category_name: 'Accessories', in_stock: false, search_text: 'usb-c hub accessories' },
  ])

  const [eventLog, setEventLog] = useState<{ event: string; detail: string }[]>([])
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [readLatency, setReadLatency] = useState(2)
  const [writeLatency, setWriteLatency] = useState(5)
  const [tab, setTab] = useState<'write' | 'read' | 'event'>('write')

  const addProduct = () => {
    productIdCounter++
    const categories = ['Peripherals', 'Accessories', 'Monitors', 'Audio']
    const catId = Math.floor(Math.random() * categories.length) + 1
    const names = ['Gaming Headset', '4K Monitor', 'Webcam HD', 'Desk Lamp', 'Ergonomic Chair', 'Standing Desk', 'Microphone', 'Speaker Set']
    const name = names[Math.floor(Math.random() * names.length)]
    const price = 29 + Math.floor(Math.random() * 270)
    const stock = Math.floor(Math.random() * 100)

    const writeRec: WriteRecord = { id: productIdCounter, name, price, category_id: catId, stock }
    setWriteDb(prev => [...prev, writeRec])
    setWriteLatency(3 + Math.floor(Math.random() * 8))

    setEventLog(prev => [...prev.slice(-15), {
      event: 'ProductCreated',
      detail: `id=${productIdCounter}, name="${name}", price=$${price}`,
    }])

    setSyncing(true)
    setTimeout(() => {
      const catName = categories[catId - 1] || 'Other'
      const readRec: ReadRecord = {
        id: productIdCounter, name, price,
        category_name: catName,
        in_stock: stock > 0,
        search_text: `${name.toLowerCase()} ${catName.toLowerCase()}`,
      }
      setReadDb(prev => [...prev, readRec])
      setReadLatency(1 + Math.floor(Math.random() * 3))
      setSyncing(false)
      setEventLog(prev => [...prev.slice(-15), {
        event: 'ReadModelUpdated',
        detail: `Denormalized product #${productIdCounter} synced to read DB`,
      }])
    }, 600)
  }

  const updatePrice = (id: number) => {
    const newPrice = Math.floor(Math.random() * 300) + 20
    setWriteDb(prev => prev.map(r => r.id === id ? { ...r, price: newPrice } : r))
    setWriteLatency(2 + Math.floor(Math.random() * 6))

    setEventLog(prev => [...prev.slice(-15), {
      event: 'PriceUpdated',
      detail: `product=${id}, old_price=$${writeDb.find(r => r.id === id)?.price}, new_price=$${newPrice}`,
    }])

    setSyncing(true)
    setTimeout(() => {
      setReadDb(prev => prev.map(r => r.id === id ? { ...r, price: newPrice } : r))
      setSyncing(false)
      setEventLog(prev => [...prev.slice(-15), {
        event: 'ReadModelUpdated',
        detail: `Price for product #${id} synced`,
      }])
    }, 500)
  }

  const filteredReads = searchQuery
    ? readDb.filter(r => r.search_text.includes(searchQuery.toLowerCase()) || r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : readDb

  const filteredWrites = searchQuery
    ? writeDb.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : writeDb

  return (
    <DemoBoundary name="CQRS">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['write', 'read', 'event'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 16px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
            border: `1px solid ${tab === t ? s.accent : s.border}`, borderRadius: 6,
            background: tab === t ? 'rgba(91,141,239,0.12)' : 'transparent',
            color: tab === t ? s.accent : s.text3,
          }}>
            {t === 'write' ? 'Write Side' : t === 'read' ? 'Read Side' : 'Event Log'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {syncing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow, animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow }}>Syncing read model...</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={tab === 'read' ? 'Search products (read DB)...' : 'Filter by name...'}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 12, fontFamily: s.mono,
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            color: s.text, outline: 'none',
          }}
        />
        <button onClick={addProduct} style={{
          padding: '8px 14px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
          border: `1px solid ${s.green}`, borderRadius: 6, background: 'rgba(61,214,140,0.12)', color: s.green,
        }}>
          + Product
        </button>
      </div>

      {tab === 'write' && (
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.purple }}>WRITE DATABASE (normalized)</span>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{writeLatency}ms avg</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filteredWrites.map(rec => (
              <div key={rec.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                borderBottom: `1px solid ${s.bg3}`,
              }}>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, minWidth: 24 }}>#{rec.id}</span>
                <span style={{ fontSize: 12, color: s.text, flex: 1, fontFamily: s.mono }}>{rec.name}</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.accent }}>${rec.price}</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>cat:{rec.category_id}</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: rec.stock > 0 ? s.green : s.red }}>
                  stock:{rec.stock}
                </span>
                <button onClick={() => updatePrice(rec.id)} style={{
                  padding: '3px 8px', fontSize: 10, fontFamily: s.mono, cursor: 'pointer',
                  border: `1px solid ${s.border}`, borderRadius: 4, background: s.bg3, color: s.text3,
                }}>
                  Update Price
                </button>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 14px', fontSize: 11, fontFamily: s.mono, color: s.text3, borderTop: `1px solid ${s.border}` }}>
            Normalized: category_id requires JOIN to get category name. Fast writes, complex reads.
          </div>
        </div>
      )}

      {tab === 'read' && (
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.green }}>READ DATABASE (denormalized)</span>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{readLatency}ms avg</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filteredReads.map(rec => (
              <div key={rec.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                borderBottom: `1px solid ${s.bg3}`,
              }}>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, minWidth: 24 }}>#{rec.id}</span>
                <span style={{ fontSize: 12, color: s.text, flex: 1, fontFamily: s.mono }}>{rec.name}</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.accent }}>${rec.price}</span>
                <span style={{
                  fontSize: 10, fontFamily: s.mono, padding: '2px 8px', borderRadius: 4,
                  background: `${s.purple}15`, color: s.purple, border: `1px solid ${s.purple}40`,
                }}>
                  {rec.category_name}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: s.mono, padding: '2px 8px', borderRadius: 4,
                  background: rec.in_stock ? 'rgba(61,214,140,0.1)' : 'rgba(232,93,93,0.1)',
                  color: rec.in_stock ? s.green : s.red,
                }}>
                  {rec.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 14px', fontSize: 11, fontFamily: s.mono, color: s.text3, borderTop: `1px solid ${s.border}` }}>
            Denormalized: category_name pre-computed. Full-text search on search_text field. Slow writes (needs sync), instant reads.
          </div>
        </div>
      )}

      {tab === 'event' && (
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.orange }}>
            EVENT STORE
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {eventLog.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: s.text3 }}>
                Add or update a product to see events
              </div>
            )}
            {eventLog.slice().reverse().map((ev, i) => {
              const isUpdate = ev.event === 'ReadModelUpdated'
              return (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '8px 14px',
                  borderBottom: `1px solid ${s.bg3}`,
                  borderLeft: `3px solid ${isUpdate ? s.green : s.orange}`,
                }}>
                  <span style={{
                    fontSize: 10, fontFamily: s.mono, padding: '2px 6px', borderRadius: 3,
                    background: isUpdate ? 'rgba(61,214,140,0.1)' : 'rgba(232,148,90,0.1)',
                    color: isUpdate ? s.green : s.orange, fontWeight: 600, flexShrink: 0,
                  }}>
                    {ev.event}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, flex: 1 }}>{ev.detail}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, background: s.bg3, borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>DATA FLOW</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: s.mono, flexWrap: 'wrap' }}>
          <span style={{ color: s.purple, background: 'rgba(155,123,234,0.1)', padding: '3px 8px', borderRadius: 4 }}>Write Command</span>
          <span style={{ color: s.text3 }}>{'->'}</span>
          <span style={{ color: s.purple, background: 'rgba(155,123,234,0.1)', padding: '3px 8px', borderRadius: 4 }}>Write DB</span>
          <span style={{ color: s.text3 }}>{'->'}</span>
          <span style={{ color: s.orange, background: 'rgba(232,148,90,0.1)', padding: '3px 8px', borderRadius: 4 }}>Event Published</span>
          <span style={{ color: s.text3 }}>{'->'}</span>
          <span style={{ color: s.green, background: 'rgba(61,214,140,0.1)', padding: '3px 8px', borderRadius: 4 }}>Read DB Updated</span>
          <span style={{ color: s.text3 }}>{'->'}</span>
          <span style={{ color: s.green, background: 'rgba(61,214,140,0.1)', padding: '3px 8px', borderRadius: 4 }}>Query Result</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
