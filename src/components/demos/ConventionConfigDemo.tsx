import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Aspect = 'routing' | 'database' | 'views' | 'naming'

const aspects: { key: Aspect; label: string }[] = [
  { key: 'routing', label: 'Routing' },
  { key: 'database', label: 'Database' },
  { key: 'views', label: 'Views' },
  { key: 'naming', label: 'Naming' },
]

const railsWay: Record<Aspect, string> = {
  routing: "resources :articles",
  database: "class CreateArticles < ActiveRecord::Migration[7.1]\n  def change\n    create_table :articles do |t|\n      t.string :title\n      t.text :body\n      t.timestamps\n    end\n  end\nend",
  views: '# app/views/articles/index.html.erb\n<%= render @articles %>',
  naming: 'Model: Article (singular)\nTable: articles (plural)\nController: ArticlesController\nFile: article.rb',
}

const manualConfig: Record<Aspect, string> = {
  routing: "app = Rack::Builder.new do\n  map '/articles' do\n    run ArticlesHandler.new\n  end\n  map '/articles/:id' do\n    run ArticleShowHandler.new\n  end\n  map '/articles/new' do\n    run ArticleNewHandler.new\n  end\n  # ... 4 more routes\nend",
  database: "DB = Sequel.connect('postgres://...')\n\nDB.create_table :articles do\n  primary_key :id\n  String :title, null: false\n  Text :body\n  DateTime :created_at\n  DateTime :updated_at\n  index :title\nend\n\n# Manual model class\nclass Article\n  def self.all\n    DB[:articles].all\n  end\n  def save\n    DB[:articles].insert(...)\n  end\nend",
  views: "# Manual template resolver\nrequire 'erb'\n\nclass ArticleView\n  TEMPLATE_DIR = 'app/views/articles'\n\n  def self.render(articles)\n    template = File.read(\n      File.join(TEMPLATE_DIR, 'index.erb')\n    )\n    ERB.new(template).result(binding)\n  end\nend\n\n# app/views/articles/index.erb\n<% articles.each do |a| %>\n  <h2><%= a[:title] %></h2>\n<% end %>",
  naming: 'Model: ArticleModel\nTable: tbl_articles\nController: ArticleHandler\nFile: article_model.rb\n\n# You must configure:\n# - Table name mapping\n# - Primary key column\n# - Timestamp columns\n# - Association foreign keys',
}

export default function ConventionConfigDemo() {
  const [aspect, setAspect] = useState<Aspect>('routing')

  const railsWayHtml = useMemo(() => Prism.highlight(railsWay[aspect], Prism.languages.ruby, 'ruby'), [aspect])
  const manualConfigHtml = useMemo(() => Prism.highlight(manualConfig[aspect], Prism.languages.ruby, 'ruby'), [aspect])

  return (
    <DemoBoundary name="Convention vs Configuration Demo">
      <div className="ccc" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {aspects.map((a) => (
            <button
              key={a.key}
              onClick={() => setAspect(a.key)}
              style={{
                background: aspect === a.key ? s.accent : s.bg2,
                border: `1px solid ${aspect === a.key ? s.accent : s.border}`,
                borderRadius: 6, padding: '6px 14px',
                color: aspect === a.key ? '#fff' : s.text2,
                fontFamily: s.mono, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <div style={{
            flex: 1, background: s.bg2, borderRadius: 10,
            border: `1px solid ${s.green}40`, overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px', background: s.green + '15',
              borderBottom: `1px solid ${s.green}30`,
              fontSize: 12, fontWeight: 600, color: s.green,
              fontFamily: s.mono,
            }}>
              Rails Way
            </div>
            <div style={{
              padding: 14,
              fontFamily: s.mono, fontSize: 12, lineHeight: 1.7,
              whiteSpace: 'pre',
              minHeight: 180,
            }}>
              <code dangerouslySetInnerHTML={{ __html: railsWayHtml }} />
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', color: s.text3, fontSize: 20, fontWeight: 300,
          }}>
            vs
          </div>

          <div style={{
            flex: 1, background: s.bg2, borderRadius: 10,
            border: `1px solid ${s.red}40`, overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px', background: s.red + '15',
              borderBottom: `1px solid ${s.red}30`,
              fontSize: 12, fontWeight: 600, color: s.red,
              fontFamily: s.mono,
            }}>
              Manual Config
            </div>
            <div style={{
              padding: 14,
              fontFamily: s.mono, fontSize: 12, lineHeight: 1.7,
              whiteSpace: 'pre',
              minHeight: 180,
            }}>
              <code dangerouslySetInnerHTML={{ __html: manualConfigHtml }} />
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 12, padding: '8px 14px', borderRadius: 6,
          background: s.accent + '10', border: `1px solid ${s.accent}30`,
          fontSize: 12, color: s.accent, lineHeight: 1.5,
        }}>
          Rails conventions eliminate the boilerplate on the right. One line of routing generates seven RESTful endpoints. The framework infers table names, view paths, and controller actions from the model name.
        </div>
      </div>
      <style>{`
        .ccc code .token.keyword { color: #f92672; }
        .ccc code .token.string, .ccc code .token.char, .ccc code .token.builtin, .ccc code .token.inserted { color: #e6db74; }
        .ccc code .token.number, .ccc code .token.constant, .ccc code .token.symbol, .ccc code .token.property, .ccc code .token.tag, .ccc code .token.boolean, .ccc code .token.deleted { color: #ae81ff; }
        .ccc code .token.selector, .ccc code .token.attr-name { color: #f92672; }
        .ccc code .token.attr-value, .ccc code .token.atrule { color: #e6db74; }
        .ccc code .token.function, .ccc code .token.class-name { color: #a6e22e; }
        .ccc code .token.operator, .ccc code .token.entity, .ccc code .token.url, .ccc code .token.punctuation { color: #f8f8f2; }
        .ccc code .token.comment, .ccc code .token.prolog, .ccc code .token.doctype, .ccc code .token.cdata { color: #75715e; font-style: italic; }
        .ccc code .token.parameter, .ccc code .token.variable, .ccc code .token.regex, .ccc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}
