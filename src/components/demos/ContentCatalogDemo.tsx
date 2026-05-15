import { useState } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const schemaDDL = `CREATE TABLE videos (
  id            UUID PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  release_year  INTEGER,
  rating        TEXT CHECK(rating IN ('G','PG','PG-13','R','TV-MA')),
  duration_min  INTEGER,
  poster_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE genres (
  id   UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE actors (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL,
  birth_year INTEGER
);

CREATE TABLE video_genres (
  video_id UUID REFERENCES videos(id),
  genre_id UUID REFERENCES genres(id),
  PRIMARY KEY (video_id, genre_id)
);

CREATE TABLE video_actors (
  video_id  UUID REFERENCES videos(id),
  actor_id  UUID REFERENCES actors(id),
  role_name TEXT,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (video_id, actor_id)
);

CREATE TABLE user_ratings (
  user_id    UUID NOT NULL,
  video_id   UUID NOT NULL,
  rating     INTEGER CHECK(rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);`

const schemaHtml = Prism.highlight(schemaDDL, Prism.languages.typescript, 'typescript')

interface TableRow {
  [key: string]: string | number | null
}

interface TableDef {
  name: string
  color: string
  columns: { name: string; type: string }[]
  rows: TableRow[]
  x: number
  y: number
  w: number
  h: number
}

const tables: TableDef[] = [
  {
    name: 'videos', color: s.accent,
    columns: [
      { name: 'id', type: 'UUID (PK)' },
      { name: 'title', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'release_year', type: 'INTEGER' },
      { name: 'rating', type: 'TEXT' },
      { name: 'duration_min', type: 'INTEGER' },
    ],
    rows: [
      { id: 'v1', title: 'Stranger Things', release_year: 2016, rating: 'TV-MA', duration_min: 52 },
      { id: 'v2', title: 'The Witcher', release_year: 2019, rating: 'TV-MA', duration_min: 48 },
      { id: 'v3', title: 'Bridgerton', release_year: 2020, rating: 'TV-MA', duration_min: 55 },
      { id: 'v4', title: 'Squid Game', release_year: 2021, rating: 'TV-MA', duration_min: 50 },
    ],
    x: 10, y: 10, w: 240, h: 140,
  },
  {
    name: 'genres', color: s.green,
    columns: [
      { name: 'id', type: 'UUID (PK)' },
      { name: 'name', type: 'TEXT UNIQUE' },
    ],
    rows: [
      { id: 'g1', name: 'Sci-Fi' },
      { id: 'g2', name: 'Horror' },
      { id: 'g3', name: 'Fantasy' },
      { id: 'g4', name: 'Action' },
      { id: 'g5', name: 'Romance' },
      { id: 'g6', name: 'Drama' },
      { id: 'g7', name: 'Thriller' },
    ],
    x: 280, y: 10, w: 180, h: 80,
  },
  {
    name: 'video_genres', color: s.yellow,
    columns: [
      { name: 'video_id', type: 'UUID (FK)' },
      { name: 'genre_id', type: 'UUID (FK)' },
    ],
    rows: [
      { video_id: 'v1', genre_id: 'g1' },
      { video_id: 'v1', genre_id: 'g2' },
      { video_id: 'v2', genre_id: 'g3' },
      { video_id: 'v2', genre_id: 'g4' },
      { video_id: 'v3', genre_id: 'g5' },
    ],
    x: 280, y: 110, w: 180, h: 80,
  },
  {
    name: 'actors', color: s.purple,
    columns: [
      { name: 'id', type: 'UUID (PK)' },
      { name: 'name', type: 'TEXT' },
      { name: 'birth_year', type: 'INTEGER' },
    ],
    rows: [
      { id: 'a1', name: 'Millie Brown', birth_year: 2004 },
      { id: 'a2', name: 'Henry Cavill', birth_year: 1983 },
      { id: 'a3', name: 'Lee Jung-jae', birth_year: 1972 },
    ],
    x: 490, y: 10, w: 200, h: 80,
  },
  {
    name: 'video_actors', color: s.orange,
    columns: [
      { name: 'video_id', type: 'UUID (FK)' },
      { name: 'actor_id', type: 'UUID (FK)' },
      { name: 'role_name', type: 'TEXT' },
    ],
    rows: [
      { video_id: 'v1', actor_id: 'a1', role_name: 'Eleven' },
      { video_id: 'v2', actor_id: 'a2', role_name: 'Geralt' },
      { video_id: 'v4', actor_id: 'a3', role_name: 'Gi-hun' },
    ],
    x: 490, y: 110, w: 200, h: 80,
  },
  {
    name: 'user_ratings', color: s.red,
    columns: [
      { name: 'user_id', type: 'UUID (PK)' },
      { name: 'video_id', type: 'UUID (PK)' },
      { name: 'rating', type: 'INTEGER' },
    ],
    rows: [
      { user_id: 'u1', video_id: 'v1', rating: 5 },
      { user_id: 'u1', video_id: 'v2', rating: 4 },
      { user_id: 'u2', video_id: 'v1', rating: 4 },
      { user_id: 'u3', video_id: 'v3', rating: 5 },
    ],
    x: 280, y: 215, w: 180, h: 80,
  },
]

const tableRelationships: { from: string; to: string }[] = [
  { from: 'video_genres', to: 'videos' },
  { from: 'video_genres', to: 'genres' },
  { from: 'video_actors', to: 'videos' },
  { from: 'video_actors', to: 'actors' },
  { from: 'user_ratings', to: 'videos' },
]

export default function ContentCatalogDemo() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const selTable = tables.find(t => t.name === selectedTable)

  return (
    <DemoBoundary name="Content Catalog Schema">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>Content Catalog Schema</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            The catalog is a relational schema with many-to-many relationships. Videos link to genres and actors through junction tables.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {tables.map(t => {
              const isSelected = selectedTable === t.name
              const related = tableRelationships.filter(r => r.from === t.name || r.to === t.name)
              return (
                <div key={t.name} onClick={() => setSelectedTable(isSelected ? null : t.name)} style={{
                  background: s.bg, borderRadius: 8, border: `1px solid ${isSelected ? t.color : s.border}`,
                  padding: 12, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isSelected ? `0 0 12px ${t.color}30` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                    <div style={{ fontSize: 12, fontFamily: s.mono, color: t.color, fontWeight: 600, textTransform: 'uppercase' }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono }}>({t.columns.length} cols)</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {t.columns.map(col => (
                      <div key={col.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: s.mono }}>
                        <span style={{ color: s.text }}>{col.name}</span>
                        <span style={{ color: s.text3, fontSize: 9 }}>{col.type}</span>
                      </div>
                    ))}
                  </div>
                  {isSelected && t.rows.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${s.border}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono, marginBottom: 4 }}>SAMPLE DATA</div>
                      {t.rows.slice(0, 3).map((row, i) => (
                        <div key={i} style={{ fontSize: 9, color: s.text2, fontFamily: s.mono, display: 'flex', gap: 6 }}>
                          {Object.values(row).slice(0, 3).map((v, j) => (
                            <span key={j} style={{ color: j === 0 ? t.color : s.text3 }}>{String(v)}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {related.length > 0 && isSelected && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {related.map(r => (
                        <span key={r.from + r.to} style={{
                          fontSize: 8, padding: '1px 6px', borderRadius: 3,
                          background: `${s.accent}15`, color: s.text3, fontFamily: s.mono,
                        }}>
                          {r.from === t.name ? '->' : '<-'} {r.from === t.name ? r.to : r.from}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>CATALOG SCHEMA (DDL)</div>
              <button onClick={() => setSelectedTable(null)} style={{
                marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: s.bg3, border: `1px solid ${s.border}`, color: s.text3, cursor: 'pointer', fontFamily: s.mono,
              }}>Deselect</button>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
              <style>{`
                code .token.keyword { color: #f92672; } code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; } code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; } code .token.selector, code .token.attr-name { color: #f92672; } code .token.attr-value, code .token.atrule { color: #e6db74; } code .token.function, code .token.class-name { color: #a6e22e; } code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; } code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; } code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
              `}</style>
              <code style={{ fontSize: 10, lineHeight: 1.4, whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: schemaHtml }} />
            </div>
          </div>

          <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 12, fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: s.text2 }}>Scale considerations:</span> At Netflix scale, the catalog is served from a read-replica cluster. Videos table is cached in Redis with TTL. The junction tables (video_genres, video_actors) are denormalized into a single document store per video for faster reads. User ratings use Cassandra with (user_id, video_id) as the composite key.
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
