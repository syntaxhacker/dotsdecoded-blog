import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Endpoint {
  method: string
  path: string
  description: string
  request: string
  response: string
  notes: string
}

const endpoints: Record<string, Endpoint[]> = {
  Upload: [
    {
      method: 'POST',
      path: '/api/media/upload',
      description: 'Upload a photo or video with metadata',
      request: `POST /api/media/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

--boundary
Content-Disposition: form-data; name="media"
Content-Type: image/jpeg
<binary data>
--boundary
Content-Disposition: form-data; name="caption"
Sunset at the beach
--boundary--`,
      response: `HTTP 201 Created
{
  "id": "post_abc123",
  "media_url": "https://cdn.example.com/media/post_abc123.jpg",
  "thumbnail_url": "https://cdn.example.com/media/post_abc123_thumb.jpg",
  "caption": "Sunset at the beach",
  "created_at": "2026-04-22T14:30:00Z"
}`,
      notes: 'Large files use presigned S3 URL. Client uploads directly to S3, then confirms with API.',
    },
    {
      method: 'POST',
      path: '/api/media/upload/initiate',
      description: 'Get a presigned URL for direct upload',
      request: `POST /api/media/upload/initiate
Authorization: Bearer <jwt_token>
{
  "file_name": "vacation.mp4",
  "file_size": 52428800,
  "content_type": "video/mp4"
}`,
      response: `HTTP 200 OK
{
  "upload_id": "upl_xyz789",
  "presigned_url": "https://s3.amazonaws.com/bucket/...",
  "expires_in": 3600
}`,
      notes: 'Avoids proxying large files through API servers. Reduces load on app servers.',
    },
  ],
  Feed: [
    {
      method: 'GET',
      path: '/api/feed',
      description: 'Fetch paginated news feed',
      request: `GET /api/feed?cursor=eyJwayI6MTB9&limit=10
Authorization: Bearer <jwt_token>`,
      response: `HTTP 200 OK
{
  "posts": [
    {
      "id": "post_abc123",
      "user": { "id": "usr_1", "username": "alice" },
      "media_url": "https://cdn.example.com/media/post_abc123.jpg",
      "caption": "Sunset at the beach",
      "likes_count": 42,
      "comments_count": 7,
      "liked_by_me": false,
      "created_at": "2026-04-22T14:30:00Z"
    }
  ],
  "next_cursor": "eyJwayI6MjB9",
  "has_more": true
}`,
      notes: 'Cursor-based pagination (not offset). Uses created_at + post_id as cursor for stable ordering.',
    },
  ],
  Social: [
    {
      method: 'POST',
      path: '/api/media/{id}/like',
      description: 'Like or unlike a post',
      request: `POST /api/media/post_abc123/like
Authorization: Bearer <jwt_token>
{
  "action": "like"
}`,
      response: `HTTP 200 OK
{
  "post_id": "post_abc123",
  "liked": true,
  "likes_count": 43
}`,
      notes: 'Idempotent: sending "like" twice returns same result. Uses distributed counter for likes_count.',
    },
    {
      method: 'POST',
      path: '/api/media/{id}/comments',
      description: 'Add a comment to a post',
      request: `POST /api/media/post_abc123/comments
Authorization: Bearer <jwt_token>
{
  "text": "Beautiful shot!",
  "parent_id": null
}`,
      response: `HTTP 201 Created
{
  "id": "cmt_def456",
  "post_id": "post_abc123",
  "user": { "id": "usr_2", "username": "bob" },
  "text": "Beautiful shot!",
  "created_at": "2026-04-22T15:00:00Z"
}`,
      notes: 'Threaded replies via parent_id. First-level comments cached, deeper levels loaded on demand.',
    },
    {
      method: 'POST',
      path: '/api/users/{id}/follow',
      description: 'Follow or unfollow a user',
      request: `POST /api/users/usr_1/follow
Authorization: Bearer <jwt_token>
{
  "action": "follow"
}`,
      response: `HTTP 200 OK
{
  "target_user_id": "usr_1",
  "following": true,
  "followers_count": 1523
}`,
      notes: 'Triggers async fan-out job to update feed cache. Celebrity follows use pull-based approach.',
    },
  ],
  Search: [
    {
      method: 'GET',
      path: '/api/search',
      description: 'Search posts, users, and hashtags',
      request: `GET /api/search?q=sunset+beach&type=posts&page=1
Authorization: Bearer <jwt_token>`,
      response: `HTTP 200 OK
{
  "results": [
    {
      "id": "post_abc123",
      "type": "post",
      "caption": "Sunset at the beach",
      "user": { "username": "alice" },
      "score": 0.94
    }
  ],
  "total": 1523,
  "page": 1,
  "facets": {
    "top_tags": ["sunset", "beach", "travel"]
  }
}`,
      notes: 'Powered by Elasticsearch. Results ranked by relevance (TF-IDF + recency).',
    },
  ],
}

const methodColor: Record<string, string> = {
  GET: s.green,
  POST: s.accent,
  PUT: s.yellow,
  DELETE: s.red,
}

export default function MediaApiDemo() {
  const [tab, setTab] = useState('Upload')
  const [selected, setSelected] = useState(0)
  const tabs = Object.keys(endpoints)

  const ep = endpoints[tab][selected]

  const reqLines = useMemo(() => ep.request.split('\n'), [ep])
  const resLines = useMemo(() => ep.response.split('\n'), [ep])

  return (
    <DemoBoundary name="Media API Explorer">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => { setTab(t); setSelected(0) }} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: `1px solid ${tab === t ? s.accent : s.border}`,
              background: tab === t ? `${s.accent}20` : s.bg2, color: tab === t ? s.accent : s.text3,
              fontFamily: s.mono, fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
            }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {endpoints[tab].map((e, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding: '5px 10px', borderRadius: 4, border: `1px solid ${selected === i ? s.accent : s.border}`,
              background: selected === i ? `${s.accent}15` : s.bg, color: selected === i ? s.accent : s.text3,
              fontFamily: s.mono, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: methodColor[e.method], fontWeight: 600 }}>{e.method}</span>
              <span>{e.path.length > 30 ? e.path.slice(0, 28) + '..' : e.path}</span>
            </button>
          ))}
        </div>

        <div style={{ background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: s.text, marginBottom: 8 }}>{ep.description}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono }}>REQUEST</div>
              <div style={{ background: s.bg, borderRadius: 6, padding: 12, overflowX: 'auto' }}>
                <div style={{ whiteSpace: 'pre', fontSize: 11, lineHeight: 1.6, fontFamily: s.mono }}>
                  {reqLines.map((line, i) => (
                    <div key={i} style={{
                      color: i === 0 ? methodColor[ep.method] : line.startsWith('Authorization') || line.startsWith('Content-Type') ? s.purple : s.text2,
                    }}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono }}>RESPONSE</div>
              <div style={{ background: s.bg, borderRadius: 6, padding: 12, overflowX: 'auto' }}>
                <div style={{ whiteSpace: 'pre', fontSize: 11, lineHeight: 1.6, fontFamily: s.mono }}>
                  {resLines.map((line, i) => (
                    <div key={i} style={{ color: line.startsWith('HTTP') ? s.green : s.text2 }}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: `${s.yellow}10`, border: `1px solid ${s.yellow}30`, borderRadius: 6, padding: '10px 14px', fontSize: 12, color: s.yellow, lineHeight: 1.5 }}>
          {ep.notes}
        </div>
      </div>
    </DemoBoundary>
  )
}
