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

type Policy = 'LRU' | 'LFU' | 'FIFO' | 'TTL'

interface CacheItem {
  key: string
  value: string
  lastAccess: number
  accessCount: number
  insertedAt: number
  ttl: number
}

const adjectives = ['red', 'blue', 'green', 'swift', 'calm', 'dark', 'bright', 'cold', 'warm', 'soft', 'bold', 'crisp']
const nouns = ['fox', 'dog', 'cat', 'bird', 'fish', 'wolf', 'bear', 'deer', 'hawk', 'owl', 'bat', 'bee']
let nameIdx = 0

function nextName(): string {
  const a = adjectives[nameIdx % adjectives.length]
  const n = nouns[Math.floor(nameIdx / adjectives.length) % nouns.length]
  nameIdx++
  return `${a}-${n}`
}

function generateAccessPattern(pattern: string, items: CacheItem[]): string | null {
  if (items.length === 0) return null
  if (pattern === 'recent') {
    return items[items.length - 1].key
  }
  if (pattern === 'frequent') {
    const sorted = [...items].sort((a, b) => b.accessCount - a.accessCount)
    return sorted[0].key
  }
  if (pattern === 'burst') {
    const idx = Math.floor(Math.random() * Math.min(2, items.length))
    return items[idx].key
  }
  return items[Math.floor(Math.random() * items.length)].key
}

export default function EvictionPolicyDemo() {
  const [policy, setPolicy] = useState<Policy>('LRU')
  const [capacity] = useState(10)
  const [items, setItems] = useState<CacheItem[]>([])
  const [evicted, setEvicted] = useState<string | null>(null)
  const [hitCount, setHitCount] = useState(0)
  const [missCount, setMissCount] = useState(0)
  const [accessedKey, setAccessedKey] = useState<string | null>(null)
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const [accessPattern, setAccessPattern] = useState<'random' | 'recent' | 'frequent' | 'burst'>('random')
  const [itemTTL] = useState(15000)

  const reset = useCallback(() => {
    setItems([])
    setEvicted(null)
    setHitCount(0)
    setMissCount(0)
    setAccessedKey(null)
    setAddedKey(null)
    nameIdx = 0
  }, [])

  const addItem = useCallback(() => {
    const key = nextName()
    const now = Date.now()
    const newItem: CacheItem = {
      key,
      value: `val_${Math.random().toString(36).slice(2, 6)}`,
      lastAccess: now,
      accessCount: 1,
      insertedAt: now,
      ttl: itemTTL,
    }

    setItems(prev => {
      let next: CacheItem[]
      const existingIdx = prev.findIndex(i => i.key === key)
      if (existingIdx >= 0) {
        next = [...prev]
        next[existingIdx] = newItem
      } else {
        next = [...prev, newItem]
      }

      if (next.length > capacity) {
        const itemToRemove = selectEviction(next, policy)
        setEvicted(itemToRemove.key)
        setTimeout(() => setEvicted(null), 800)
        next = next.filter(i => i.key !== itemToRemove.key)
      }

      setAddedKey(key)
      setTimeout(() => setAddedKey(null), 600)
      return next
    })
  }, [capacity, policy, itemTTL])

  const accessItem = useCallback(() => {
    setItems(prev => {
      if (prev.length === 0) {
        setMissCount(c => c + 1)
        setAccessedKey(null)
        return prev
      }

      const targetKey = generateAccessPattern(accessPattern, prev)
      if (!targetKey) return prev

      const idx = prev.findIndex(i => i.key === targetKey)
      if (idx < 0) {
        setMissCount(c => c + 1)
        return prev
      }

      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        lastAccess: Date.now(),
        accessCount: updated[idx].accessCount + 1,
      }

      setHitCount(c => c + 1)
      setAccessedKey(targetKey)
      setTimeout(() => setAccessedKey(null), 400)
      return updated
    })
  }, [accessPattern])

  const expiredCount = items.filter(i => Date.now() - i.insertedAt > i.ttl).length
  const hitRate = hitCount + missCount > 0
    ? Math.round((hitCount / (hitCount + missCount)) * 100)
    : 0

  return (
    <DemoBoundary name="Eviction Policy">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Eviction Policy: {policy}
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Capacity: {capacity} items. Click "Add Item" to fill the cache, then "Access Item" to trigger reads.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['LRU', 'LFU', 'FIFO', 'TTL'] as Policy[]).map(p => (
          <button
            key={p}
            onClick={() => setPolicy(p)}
            style={{
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              background: policy === p ? s.accent : s.bg3,
              border: `1px solid ${policy === p ? s.accent : s.border}`,
              color: policy === p ? '#fff' : s.text2,
              fontSize: 12, fontWeight: policy === p ? 600 : 400,
            }}
          >
            {p}
            <span style={{
              display: 'block', fontSize: 9, color: policy === p ? '#fffa' : s.text3, fontWeight: 400, marginTop: 1,
            }}>
              {p === 'LRU' ? 'least recent used' : p === 'LFU' ? 'least frequent used' : p === 'FIFO' ? 'first in first out' : 'time-to-live'}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: s.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
            Access Pattern
          </label>
          <select
            value={accessPattern}
            onChange={e => setAccessPattern(e.target.value as typeof accessPattern)}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 6,
              background: s.bg3, color: s.text, border: `1px solid ${s.border}`,
              fontSize: 12,
            }}
          >
            <option value="random">Random</option>
            <option value="recent">Recent (latest item)</option>
            <option value="frequent">Frequent (most popular)</option>
            <option value="burst">Burst (first 2 items)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={addItem} style={{
          flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
          background: s.accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          Add Item
        </button>
        <button onClick={accessItem} style={{
          flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
          background: s.green, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          Access Item
        </button>
        <button onClick={reset} style={{
          padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
          background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, fontSize: 13,
        }}>
          Clear
        </button>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 10, padding: 12, marginBottom: 16,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${capacity}, 1fr)`, gap: 4,
        }}>
          {Array.from({ length: capacity }).map((_, i) => {
            const item = items[i]
            const isEvicted = evicted === item?.key
            const isAccessed = accessedKey === item?.key
            const isAdded = addedKey === item?.key
            const isExpired = item ? (Date.now() - item.insertedAt > item.ttl) : false

            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 8,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: !item ? s.bg3
                  : isEvicted ? `${s.red}30`
                  : isAccessed ? `${s.green}30`
                  : isAdded ? `${s.accent}30`
                  : isExpired ? `${s.yellow}20`
                  : s.bg,
                border: `1px solid ${
                  isEvicted ? s.red
                  : isAccessed ? s.green
                  : isAdded ? s.accent
                  : isExpired ? s.yellow
                  : item ? s.border2
                  : s.border
                }`,
                transition: 'all 0.3s ease',
                fontSize: 9, color: s.text2, fontFamily: s.mono,
                overflow: 'hidden', padding: 2,
              }}>
                {item ? (
                  <>
                    <div style={{
                      color: isEvicted ? s.red : isAccessed ? s.green : isAdded ? s.accent : s.text,
                      fontWeight: 600, fontSize: 9, lineHeight: 1.2, textAlign: 'center',
                    }}>
                      {item.key}
                    </div>
                    <div style={{ color: s.text3, fontSize: 7, marginTop: 1 }}>
                      {item.accessCount}x
                    </div>
                  </>
                ) : (
                  <span style={{ color: s.text3, fontSize: 8 }}>empty</span>
                )}
              </div>
            )
          })}
        </div>
        <div style={{
          marginTop: 6, display: 'flex', justifyContent: 'space-between',
          color: s.text3, fontSize: 10,
        }}>
          <span>{items.length}/{capacity} slots filled</span>
          <span>{expiredCount > 0 ? `${expiredCount} expired` : ''}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 14px', textAlign: 'center', flex: 1,
        }}>
          <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{hitCount}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>Hits</div>
        </div>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 14px', textAlign: 'center', flex: 1,
        }}>
          <div style={{ color: s.red, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{missCount}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>Misses</div>
        </div>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 14px', textAlign: 'center', flex: 1,
        }}>
          <div style={{
            color: hitRate > 70 ? s.green : hitRate > 30 ? s.yellow : s.red,
            fontFamily: s.mono, fontSize: 18, fontWeight: 700,
          }}>
            {hitRate}%
          </div>
          <div style={{ color: s.text3, fontSize: 10 }}>Hit Rate</div>
        </div>
        {evicted && (
          <div style={{
            background: `${s.red}12`, border: `1px solid ${s.red}`, borderRadius: 8,
            padding: '8px 14px', textAlign: 'center', flex: 1,
          }}>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 11, fontWeight: 600 }}>{evicted}</div>
            <div style={{ color: s.text3, fontSize: 10 }}>Evicted</div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}

function selectEviction(items: CacheItem[], policy: Policy): CacheItem {
  const now = Date.now()
  switch (policy) {
    case 'LRU': {
      const sorted = [...items].sort((a, b) => a.lastAccess - b.lastAccess)
      return sorted[0]
    }
    case 'LFU': {
      const sorted = [...items].sort((a, b) => a.accessCount - b.accessCount || a.lastAccess - b.lastAccess)
      return sorted[0]
    }
    case 'FIFO': {
      const sorted = [...items].sort((a, b) => a.insertedAt - b.insertedAt)
      return sorted[0]
    }
    case 'TTL': {
      const expired = items.filter(i => now - i.insertedAt > i.ttl)
      if (expired.length > 0) {
        return expired.sort((a, b) => (now - a.insertedAt) - (now - b.insertedAt))[0]
      }
      const sorted = [...items].sort((a, b) => (now - a.insertedAt) - (now - b.insertedAt))
      return sorted[sorted.length - 1]
    }
  }
}
