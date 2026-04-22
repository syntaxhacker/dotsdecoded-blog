import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-json'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type AppMode = 'full' | 'api'

interface Feature {
  name: string
  inFull: boolean
  inApi: boolean
  desc: string
}

const features: Feature[] = [
  { name: 'ActionController', inFull: true, inApi: true, desc: 'Core request handling, routing, params' },
  { name: 'ActiveRecord', inFull: true, inApi: true, desc: 'Database ORM and models' },
  { name: 'ActionMailer', inFull: true, inApi: false, desc: 'Email sending templates' },
  { name: 'ActionPack (Views)', inFull: true, inApi: false, desc: 'ERB templates, layouts, partials' },
  { name: 'Helpers', inFull: true, inApi: false, desc: 'View helper methods' },
  { name: 'Asset Pipeline', inFull: true, inApi: false, desc: 'Sprockets for CSS/JS bundling' },
  { name: 'Cookies', inFull: true, inApi: false, desc: 'Encrypted cookie jar' },
  { name: 'Flash Messages', inFull: true, inApi: false, desc: 'Temp messages between requests' },
  { name: 'CSRF Protection', inFull: true, inApi: false, desc: 'Cross-site request forgery tokens' },
  { name: 'Jbuilder', inFull: true, inApi: true, desc: 'JSON template views' },
  { name: 'ActiveModel::Serializers', inFull: false, inApi: true, desc: 'JSON serialization layer' },
  { name: 'Rack::CORS', inFull: false, inApi: true, desc: 'Cross-origin resource sharing' },
  { name: 'API Versioning', inFull: false, inApi: true, desc: 'Namespace-based version headers' },
]

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/posts',
    response: `{
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Rails",
      "body": "Rails is a web framework...",
      "author": { "id": 1, "name": "Alice" },
      "comments_count": 5,
      "created_at": "2026-04-01T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "per_page": 20
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/posts',
    request: `{
  "post": {
    "title": "New Post",
    "body": "Content here...",
    "author_id": 1
  }
}`,
    response: `{
  "data": {
    "id": 42,
    "title": "New Post",
    "body": "Content here...",
    "author": { "id": 1, "name": "Alice" },
    "comments_count": 0,
    "created_at": "2026-04-05T14:00:00Z"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/posts/42',
    response: `{
  "data": {
    "id": 42,
    "title": "New Post",
    "body": "Content here...",
    "author": { "id": 1, "name": "Alice" },
    "comments": [
      {
        "id": 10,
        "body": "Great post!",
        "author": { "name": "Bob" }
      }
    ]
  }
}`,
  },
]

const methodColors: Record<string, string> = {
  GET: s.green,
  POST: s.accent,
  PUT: s.yellow,
  DELETE: s.red,
}

const serializers = {
  jbuilder: `# app/views/api/v1/posts/index.json.jbuilder
json.array! @posts do |post|
  json.id post.id
  json.title post.title
  json.body post.body
  json.author do
    json.id post.author.id
    json.name post.author.name
  end
  json.comments_count post.comments.size
  json.created_at post.created_at.iso8601
end

json.meta do
  json.current_page @posts.current_page
  json.total_pages @posts.total_pages
end`,

  ams: `# app/serializers/post_serializer.rb
class PostSerializer
  include FastJsonapi::ObjectSerializer
  attributes :title, :body,
    :created_at

  belongs_to :author
  has_many :comments
  attribute :comments_count do |post|
    post.comments.size
  end
end

# In controller:
render json: PostSerializer
  .new(@posts)
  .serialized_json`,

  blueprinter: `# app/blueprints/post_blueprint.rb
class PostBlueprint < Blueprinter::Base
  identifier :id
  fields :title, :body, :created_at

  association :author,
    blueprint: UserBlueprint
  association :comments,
    blueprint: CommentBlueprint

  field :comments_count do |post|
    post.comments.size
  end
end

# In controller:
render json: PostBlueprint
  .render(@posts)`,
}

export default function RailsApiDemo() {
  const [mode, setMode] = useState<AppMode>('api')
  const [selectedEndpoint, setSelectedEndpoint] = useState(0)
  const [selectedSerializer, setSelectedSerializer] = useState<'jbuilder' | 'ams' | 'blueprinter'>('jbuilder')
  const [showRequest, setShowRequest] = useState(false)

  const ep = endpoints[selectedEndpoint]

  const responseHtml = useMemo(() => {
    const code = showRequest && ep.request ? ep.request : ep.response
    return Prism.highlight(code, Prism.languages.json, 'json')
  }, [ep, showRequest])

  const serializerHtml = useMemo(() => {
    return Prism.highlight(serializers[selectedSerializer], Prism.languages.ruby, 'ruby')
  }, [selectedSerializer])

  return (
    <DemoBoundary name="Rails API Demo">
      <div className="rapc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
.rapc code .token.keyword { color: #f92672; }
.rapc code .token.string, .rapc code .token.char, .rapc code .token.builtin, .rapc code .token.inserted { color: #e6db74; }
.rapc code .token.number, .rapc code .token.constant, .rapc code .token.symbol, .rapc code .token.property, .rapc code .token.tag, .rapc code .token.boolean, .rapc code .token.deleted { color: #ae81ff; }
.rapc code .token.selector, .rapc code .token.attr-name { color: #f92672; }
.rapc code .token.attr-value, .rapc code .token.atrule { color: #e6db74; }
.rapc code .token.function, .rapc code .token.class-name { color: #a6e22e; }
.rapc code .token.operator, .rapc code .token.entity, .rapc code .token.url, .rapc code .token.punctuation { color: #f8f8f2; }
.rapc code .token.comment, .rapc code .token.prolog, .rapc code .token.doctype, .rapc code .token.cdata { color: #75715e; font-style: italic; }
.rapc code .token.parameter, .rapc code .token.variable, .rapc code .token.regex, .rapc code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setMode('full')}
            style={{
              background: mode === 'full' ? s.accent : s.bg2,
              border: `1px solid ${mode === 'full' ? s.accent : s.border}`,
              borderRadius: 6,
              padding: '5px 14px',
              color: mode === 'full' ? '#fff' : s.text2,
              fontFamily: s.mono,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Full Rails App
          </button>
          <button
            onClick={() => setMode('api')}
            style={{
              background: mode === 'api' ? s.accent : s.bg2,
              border: `1px solid ${mode === 'api' ? s.accent : s.border}`,
              borderRadius: 6,
              padding: '5px 14px',
              color: mode === 'api' ? '#fff' : s.text2,
              fontFamily: s.mono,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            API Mode
          </button>
        </div>

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: mode === 'full' ? s.yellow : s.green }} />
            <span style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>
              {mode === 'full' ? 'rails new myapp' : 'rails new myapp --api'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <div style={{ padding: '6px 14px', background: s.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, width: 100 }}>INCLUDED</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {features.filter((f) => mode === 'full' ? f.inFull : f.inApi).map((f) => (
                  <span key={f.name} style={{
                    padding: '2px 8px', borderRadius: 4, background: `${s.green}22`,
                    color: s.green, fontSize: 9, fontFamily: s.mono,
                  }}>
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ padding: '6px 14px', background: s.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, width: 100 }}>EXCLUDED</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {features.filter((f) => mode === 'full' ? !f.inApi : !f.inFull).map((f) => (
                  <span key={f.name} style={{
                    padding: '2px 8px', borderRadius: 4, background: `${s.red}22`,
                    color: s.red, fontSize: 9, fontFamily: s.mono,
                  }}>
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12 }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              API Endpoints
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {endpoints.map((e, idx) => (
                <div
                  key={idx}
                  onClick={() => { setSelectedEndpoint(idx); setShowRequest(false) }}
                  style={{
                    padding: '8px 10px',
                    background: selectedEndpoint === idx ? s.bg3 : s.bg2,
                    border: `1px solid ${selectedEndpoint === idx ? s.accent : s.border}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ color: methodColors[e.method], fontSize: 11, fontFamily: s.mono, fontWeight: 700 }}>
                    {e.method}
                  </span>
                  <span style={{ color: s.text, fontSize: 11, fontFamily: s.mono, marginLeft: 6 }}>
                    {e.path}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Serialization
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(['jbuilder', 'ams', 'blueprinter'] as const).map((ser) => (
                <button
                  key={ser}
                  onClick={() => setSelectedSerializer(ser)}
                  style={{
                    padding: '6px 10px',
                    background: selectedSerializer === ser ? s.bg3 : s.bg2,
                    border: `1px solid ${selectedSerializer === ser ? s.accent : s.border}`,
                    borderRadius: 6,
                    color: selectedSerializer === ser ? s.accent : s.text2,
                    fontFamily: s.mono,
                    fontSize: 11,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  {ser === 'jbuilder' ? 'Jbuilder' : ser === 'ams' ? 'Fast_JSONAPI' : 'Blueprinter'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {ep.method} {ep.path}
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowRequest(false)}
                  style={{
                    background: !showRequest ? s.bg3 : 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 10px',
                    color: !showRequest ? s.text : s.text3,
                    fontFamily: s.mono,
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  Response
                </button>
                {ep.request && (
                  <button
                    onClick={() => setShowRequest(true)}
                    style={{
                      background: showRequest ? s.bg3 : 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 10px',
                      color: showRequest ? s.text : s.text3,
                      fontFamily: s.mono,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    Request
                  </button>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.6, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: responseHtml }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {selectedSerializer === 'jbuilder' ? 'Jbuilder' : selectedSerializer === 'ams' ? 'Fast_JSONAPI (AMS)' : 'Blueprinter'} Code
              </div>
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.6, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: serializerHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
