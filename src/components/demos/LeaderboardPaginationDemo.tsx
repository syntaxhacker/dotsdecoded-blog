import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const heroNames = [
  'ShadowStrike','PixelWarden','NeonFury','CyberViper','ThunderAxe',
  'BladeDancer','FrostByte','StormChaser','VoidWalker','EmberLord',
  'IcePhoenix','QuantumWolf','SonicDash','BlazeFury','DarkKnight',
  'ArcaneMage','StormBreaker','VenomStrike','GhostReaper','IronClad',
  'LunarEcho','SolarFlare','CrystalMoth','ThunderClaw','WildFang',
  'SteelViper','ShadowHawk','BlitzKrieg','FrostGiant','EmberWing',
  'VoidSeeker','StarDust','NovaBlast','OmegaForce','DeltaSquad',
  'RuneWarden','FlameLord','StormBringer','NightShade','DuskWalker',
  'CyberKnight','PixelFury','DataViper','NeonStorm','ByteReaper',
  'QuantumAxe','SonicWave','BladeStorm','FrostWolf','ShadowBlade',
]

const perPage = 20

function randScore() {
  const base = Math.floor(Math.random() * 2500) + 500
  const change = Math.floor(Math.random() * 400) - 200
  return { score: base, change }
}

function generatePlayers(count: number) {
  const result: { id: number; name: string; score: number; change: number }[] = []
  for (let i = 0; i < count; i++) {
    const { score, change } = randScore()
    const name = heroNames[i % heroNames.length] + (i >= heroNames.length ? `_${i}` : '')
    result.push({ id: i + 1, name, score, change })
  }
  result.sort((a, b) => b.score - a.score)
  result.forEach((pl, i) => { pl.id = i + 1 })
  return result
}

export default function LeaderboardPaginationDemo() {
  const [players] = useState(() => generatePlayers(1000))
  const [page, setPage] = useState(0)
  const [animDir, setAnimDir] = useState<'left' | 'right' | null>(null)
  const [animating, setAnimating] = useState(false)
  const [inputPage, setInputPage] = useState('')
  const [myRank, setMyRank] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(players.length / perPage)

  const changePage = useCallback((newPage: number, dir: 'left' | 'right') => {
    if (newPage < 0 || newPage >= totalPages || animating) return
    setAnimDir(dir)
    setAnimating(true)
    setTimeout(() => {
      setPage(newPage)
      setAnimDir(null)
      setAnimating(false)
      if (containerRef.current) containerRef.current.scrollTop = 0
    }, 200)
  }, [totalPages, animating])

  const goTop100 = useCallback(() => {
    changePage(0, 'right')
  }, [changePage])

  const goMyRank = useCallback(() => {
    const rank = parseInt(myRank, 10)
    if (isNaN(rank) || rank < 1 || rank > players.length) return
    const p = Math.floor((rank - 1) / perPage)
    changePage(p, 'right')
  }, [myRank, players.length, changePage])

  const goPage = useCallback(() => {
    const p = parseInt(inputPage, 10)
    if (isNaN(p) || p < 1 || p > totalPages) return
    changePage(p - 1, 'right')
  }, [inputPage, totalPages, changePage])

  const pagePlayers = useMemo(() => {
    const start = page * perPage
    return players.slice(start, start + perPage)
  }, [players, page])

  return (
    <DemoBoundary name="Leaderboard Pagination">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={goTop100} style={{
            padding: '6px 14px', fontSize: 12, fontFamily: s.mono, borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${page === 0 ? s.accent : s.border}`,
            background: page === 0 ? 'rgba(91,141,239,0.15)' : 'transparent',
            color: page === 0 ? s.accent : s.text2,
          }}>Top 100</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
            <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>My Rank</span>
            <input value={myRank} onChange={e => setMyRank(e.target.value)} placeholder="e.g. 342"
              style={{
                width: 70, padding: '5px 8px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${s.border}`, background: s.bg, color: s.text,
              }} />
            <button onClick={goMyRank} style={{
              padding: '5px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${s.border}`, background: s.bg3, color: s.text2,
            }}>Go</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
            <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>Page</span>
            <input value={inputPage} onChange={e => setInputPage(e.target.value)} placeholder={`1-${totalPages}`}
              style={{
                width: 60, padding: '5px 8px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${s.border}`, background: s.bg, color: s.text,
              }} />
            <button onClick={goPage} style={{
              padding: '5px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${s.border}`, background: s.bg3, color: s.text2,
            }}>Go</button>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => changePage(page - 1, 'left')} disabled={page === 0}
              style={{
                padding: '5px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 5, cursor: page === 0 ? 'not-allowed' : 'pointer',
                border: `1px solid ${s.border}`, background: s.bg3, color: page === 0 ? s.text3 : s.text2,
                opacity: page === 0 ? 0.4 : 1,
              }}>Prev</button>
            <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, padding: '5px 8px' }}>
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => changePage(page + 1, 'right')} disabled={page >= totalPages - 1}
              style={{
                padding: '5px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 5, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                border: `1px solid ${s.border}`, background: s.bg3, color: page >= totalPages - 1 ? s.text3 : s.text2,
                opacity: page >= totalPages - 1 ? 0.4 : 1,
              }}>Next</button>
          </div>
        </div>

        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '50px 1fr 80px 60px',
            padding: '8px 16px', background: s.bg3, fontSize: 11, fontFamily: s.mono,
            color: s.text3, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${s.border}`,
          }}>
            <span>Rank</span><span>Player</span><span style={{ textAlign: 'right' }}>Score</span><span style={{ textAlign: 'right' }}>Change</span>
          </div>
          <div ref={containerRef} style={{
            transition: animDir ? 'transform 0.2s, opacity 0.2s' : 'none',
            transform: animDir === 'left' ? 'translateX(-30px)' : animDir === 'right' ? 'translateX(30px)' : 'translateX(0)',
            opacity: animDir ? 0.5 : 1,
          }}>
            {pagePlayers.map((pl, i) => {
              const rank = page * perPage + i + 1
              const isMe = parseInt(myRank, 10) === rank
              return (
                <div key={pl.id} style={{
                  display: 'grid', gridTemplateColumns: '50px 1fr 80px 60px', padding: '7px 16px',
                  borderBottom: i < pagePlayers.length - 1 ? `1px solid ${s.border}22` : 'none',
                  background: isMe ? `${s.accent}12` : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <span style={{ color: rank <= 3 ? s.yellow : s.text3, fontFamily: s.mono, fontSize: 13, fontWeight: rank <= 3 ? 700 : 400 }}>
                    {rank}
                  </span>
                  <span style={{ color: s.text, fontSize: 13, fontWeight: isMe ? 600 : 400 }}>
                    {pl.name}
                    {isMe && <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 10, marginLeft: 6 }}>(you)</span>}
                  </span>
                  <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                    {pl.score.toLocaleString()}
                  </span>
                  <span style={{
                    fontFamily: s.mono, fontSize: 12, textAlign: 'right',
                    color: pl.change > 0 ? s.green : pl.change < 0 ? s.red : s.text3,
                  }}>
                    {pl.change > 0 ? `+${pl.change}` : pl.change < 0 ? pl.change : '0'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '10px 16px', borderTop: `1px solid ${s.border}`, display: 'flex', gap: 16, fontSize: 11, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
          <span>{players.length.toLocaleString()} total players</span>
          <span style={{ color: s.yellow }}>Gold = top 3</span>
          <span style={{ color: s.accent }}>Blue row = your rank</span>
          <span style={{ color: s.green }}>+N = improved</span>
          <span style={{ color: s.red }}>-N = declined</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
