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

type Category = 'auth' | 'pagination' | 'search' | 'soft_delete'

const categories: { key: Category; label: string; color: string; icon: string }[] = [
  { key: 'auth', label: 'Authentication', color: s.accent, icon: 'Au' },
  { key: 'pagination', label: 'Pagination', color: s.green, icon: 'Pg' },
  { key: 'search', label: 'Searchable', color: s.purple, icon: 'Se' },
  { key: 'soft_delete', label: 'Soft Delete', color: s.orange, icon: 'Sd' },
]

const fullModelCode = `class Article < ApplicationRecord
  belongs_to :author, class_name: 'User'
  has_many :comments, dependent: :destroy

  validates :title, presence: true, length: { maximum: 200 }
  validates :body, presence: true

  scope :published, -> { where(published: true) }
  scope :recent, -> { order(created_at: :desc) }

  # --- Authentication ---
  def owned_by?(user)
    author_id == user&.id
  end

  def editable_by?(user)
    user&.admin? || owned_by?(user)
  end

  # --- Pagination ---
  def self.page_number(per_page: 10)
    (count.to_f / per_page).ceil
  end

  def self.paginate(page: 1, per_page: 10)
    offset = (page - 1) * per_page
    limit(per_page).offset(offset)
  end

  # --- Searchable ---
  def self.search(query)
    where(
      'title ILIKE ? OR body ILIKE ?',
      "%#{query}%", "%#{query}%"
    )
  end

  def self.search_by_tag(tag_name)
    joins(:tags).where(tags: { name: tag_name })
  end

  # --- Soft Delete ---
  def soft_delete
    update!(deleted_at: Time.current, published: false)
  end

  def restore
    update!(deleted_at: nil)
  end

  def deleted?
    deleted_at.present?
  end

  scope :not_deleted, -> { where(deleted_at: nil) }
end`

const concernCode: Record<Category, { file: string; code: string }> = {
  auth: {
    file: 'app/models/concerns/authenticatable.rb',
    code: `module Authenticatable
  extend ActiveSupport::Concern

  included do
    belongs_to :author, class_name: 'User'
  end

  def owned_by?(user)
    author_id == user&.id
  end

  def editable_by?(user)
    user&.admin? || owned_by?(user)
  end
end`,
  },
  pagination: {
    file: 'app/models/concerns/paginatable.rb',
    code: `module Paginatable
  extend ActiveSupport::Concern

  class_methods do
    def page_number(per_page: 10)
      (count.to_f / per_page).ceil
    end

    def paginate(page: 1, per_page: 10)
      offset = (page - 1) * per_page
      limit(per_page).offset(offset)
    end
  end
end`,
  },
  search: {
    file: 'app/models/concerns/searchable.rb',
    code: `module Searchable
  extend ActiveSupport::Concern

  class_methods do
    def search(query)
      where(
        'title ILIKE ? OR body ILIKE ?',
        "%#{query}%", "%#{query}%"
      )
    end

    def search_by_tag(tag_name)
      joins(:tags).where(tags: { name: tag_name })
    end
  end
end`,
  },
  soft_delete: {
    file: 'app/models/concerns/soft_deletable.rb',
    code: `module SoftDeletable
  extend ActiveSupport::Concern

  included do
    scope :not_deleted, -> { where(deleted_at: nil) }
  end

  def soft_delete
    update!(deleted_at: Time.current, published: false)
  end

  def restore
    update!(deleted_at: nil)
  end

  def deleted?
    deleted_at.present?
  end
end`,
  },
}

const cleanedModelCode = `class Article < ApplicationRecord
  include Authenticatable
  include Paginatable
  include Searchable
  include SoftDeletable

  has_many :comments, dependent: :destroy

  validates :title, presence: true, length: { maximum: 200 }
  validates :body, presence: true

  scope :published, -> { where(published: true) }
  scope :recent, -> { order(created_at: :desc) }
end`

const fullModelHtml = Prism.highlight(fullModelCode, Prism.languages.ruby, 'ruby')
const cleanedModelHtml = Prism.highlight(cleanedModelCode, Prism.languages.ruby, 'ruby')
const concernHtmlMap: Record<Category, string> = {
  auth: Prism.highlight(concernCode.auth.code, Prism.languages.ruby, 'ruby'),
  pagination: Prism.highlight(concernCode.pagination.code, Prism.languages.ruby, 'ruby'),
  search: Prism.highlight(concernCode.search.code, Prism.languages.ruby, 'ruby'),
  soft_delete: Prism.highlight(concernCode.soft_delete.code, Prism.languages.ruby, 'ruby'),
}

export default function ConcernDemo() {
  const [extracted, setExtracted] = useState<Category[]>([])
  const [focus, setFocus] = useState<Category | null>(null)

  const toggle = (cat: Category) => {
    setExtracted(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const cat = focus ? categories.find(c => c.key === focus)! : null

  const modelHtml = useMemo(() => {
    return extracted.length === 0 ? fullModelHtml : cleanedModelHtml
  }, [extracted.length])

  return (
    <DemoBoundary name="Concerns">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 13, color: s.text2, marginBottom: 16 }}>
        Click a category to extract it into a concern:
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c.key} onClick={() => toggle(c.key)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${extracted.includes(c.key) ? c.color : s.border}`,
            background: extracted.includes(c.key) ? `${c.color}18` : s.bg2,
            color: extracted.includes(c.key) ? c.color : s.text3,
            fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
          }}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1.2, minWidth: 280 }}>
          <div style={{
            fontSize: 11, fontFamily: s.mono, color: s.text3,
            marginBottom: 8, fontWeight: 600,
          }}>
            app/models/article.rb
          </div>
          <div className="cnc" style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
            padding: '14px 16px', fontFamily: s.mono, fontSize: 11.5,
            lineHeight: 1.65, whiteSpace: 'pre', overflow: 'auto',
          }}>
            <style>{`
.cnc code .token.keyword { color: #f92672; }
.cnc code .token.string, .cnc code .token.char, .cnc code .token.builtin, .cnc code .token.inserted { color: #e6db74; }
.cnc code .token.number, .cnc code .token.constant, .cnc code .token.symbol, .cnc code .token.property, .cnc code .token.tag, .cnc code .token.boolean, .cnc code .token.deleted { color: #ae81ff; }
.cnc code .token.selector, .cnc code .token.attr-name { color: #f92672; }
.cnc code .token.attr-value, .cnc code .token.atrule { color: #e6db74; }
.cnc code .token.function, .cnc code .token.class-name { color: #a6e22e; }
.cnc code .token.operator, .cnc code .token.entity, .cnc code .token.url, .cnc code .token.punctuation { color: #f8f8f2; }
.cnc code .token.comment, .cnc code .token.prolog, .cnc code .token.doctype, .cnc code .token.cdata { color: #75715e; font-style: italic; }
.cnc code .token.parameter, .cnc code .token.variable, .cnc code .token.regex, .cnc code .token.important { color: #fd971f; }
`}</style>
            <code dangerouslySetInnerHTML={{ __html: modelHtml }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          {extracted.length > 0 ? (
            <>
              <div style={{
                fontSize: 11, fontFamily: s.mono, color: s.text3,
                marginBottom: 8, fontWeight: 600,
              }}>
                Extracted concerns
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {extracted.map(key => {
                  const c = categories.find(ct => ct.key === key)!
                  return (
                    <div key={key} onClick={() => setFocus(focus === key ? null : key)} style={{
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      background: focus === key ? s.bg : s.bg2,
                      border: `1px solid ${focus === key ? c.color : s.border}`,
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 5,
                          background: `${c.color}20`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontFamily: s.mono, fontSize: 10, color: c.color, fontWeight: 700,
                        }}>
                          {c.icon}
                        </div>
                        <span style={{ fontSize: 12, color: c.color, fontFamily: s.mono, fontWeight: 600 }}>
                          {c.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {cat && (
                <div style={{ marginTop: 12 }}>
                  <div style={{
                    fontSize: 11, fontFamily: s.mono, color: cat.color,
                    marginBottom: 8, fontWeight: 600,
                  }}>
                    {concernCode[cat.key].file}
                  </div>
                  <div className="cnc" style={{
                    background: s.bg, border: `1px solid ${cat.color}30`, borderRadius: 10,
                    padding: '12px 14px', fontFamily: s.mono, fontSize: 11,
                    lineHeight: 1.6, whiteSpace: 'pre', overflow: 'auto',
                  }}>
                    <code dangerouslySetInnerHTML={{ __html: concernHtmlMap[cat.key] }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              color: s.text3, fontSize: 13,
            }}>
              Select categories above to see them extracted into concerns
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
