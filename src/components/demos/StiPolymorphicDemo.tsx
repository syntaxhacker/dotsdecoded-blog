import { useState } from 'react'
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

type StiRole = 'Admin' | 'Moderator' | 'Member'

const stiRoles: StiRole[] = ['Admin', 'Moderator', 'Member']

const stiFields = {
  Admin: {
    color: s.red,
    shared: ['id', 'name', 'email', 'created_at', 'updated_at'],
    specific: ['permission_level', 'can_delete_users', 'dashboard_access'],
  },
  Moderator: {
    color: s.yellow,
    shared: ['id', 'name', 'email', 'created_at', 'updated_at'],
    specific: ['can_ban_users', 'can_edit_posts', 'moderated_categories'],
  },
  Member: {
    color: s.green,
    shared: ['id', 'name', 'email', 'created_at', 'updated_at'],
    specific: ['subscription_tier', 'avatar_url', 'bio'],
  },
}

const stiCode = `# One table: users
# type column determines the class

class User < ApplicationRecord
  # Common behavior for all user types
  validates :name, :email, presence: true
end

class Admin < User
  has_many :audit_logs
  def dashboard_access
    true
  end
end

class Moderator < User
  def can_edit_post?(post)
    post.category.in?(moderated_categories)
  end
end

class Member < User
  belongs_to :subscription
end`

const stiQueryCode = `# Rails automatically filters by type
Admin.all
# SELECT * FROM users WHERE type = 'Admin'

Moderator.where(can_ban: true)
# SELECT * FROM users WHERE type = 'Moderator'
#   AND can_ban = true

# Common queries work across all types
User.where("created_at > ?", 1.week.ago)
# Returns Admins, Moderators, and Members`

const stiCodeHtml = Prism.highlight(stiCode, Prism.languages.ruby, 'ruby')

type PolyTarget = 'Post' | 'Photo'

const polyTargets: PolyTarget[] = ['Post', 'Photo']

const polyData = {
  Post: { color: s.accent, icon: 'P', exampleId: 42 },
  Photo: { color: s.purple, icon: 'Ph', exampleId: 17 },
}

const polyCode = `# Comments can belong to Post OR Photo

class Comment < ApplicationRecord
  belongs_to :commentable, polymorphic: true
end

class Post < ApplicationRecord
  has_many :comments, as: :commentable
end

class Photo < ApplicationRecord
  has_many :comments, as: :commentable
end`

const polyQueryCode = `# Fetch comments for a specific post
post = Post.find(42)
post.comments
# SELECT * FROM comments
#   WHERE commentable_type = 'Post'
#   AND commentable_id = 42

# Fetch the parent from a comment
comment = Comment.find(7)
comment.commentable
# Returns the Post OR Photo record

# All comments across all types
Comment.last(10)`

const polyCodeHtml = Prism.highlight(polyCode, Prism.languages.ruby, 'ruby')

export default function StiPolymorphicDemo() {
  const [stiRole, setStiRole] = useState<StiRole>('Admin')
  const [polyTarget, setPolyTarget] = useState<PolyTarget>('Post')
  const [showQuery, setShowQuery] = useState(false)

  const role = stiFields[stiRole]

  return (
    <DemoBoundary name="STI & Polymorphic Associations">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setShowQuery(false)} style={{
          padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${!showQuery ? s.accent : s.border}`,
          background: !showQuery ? `${s.accent}18` : s.bg2,
          color: !showQuery ? s.accent : s.text3,
          fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
        }}>
          Single Table Inheritance
        </button>
        <button onClick={() => setShowQuery(true)} style={{
          padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${showQuery ? s.purple : s.border}`,
          background: showQuery ? `${s.purple}18` : s.bg2,
          color: showQuery ? s.purple : s.text3,
          fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
        }}>
          Polymorphic Associations
        </button>
      </div>

      {!showQuery && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              fontSize: 11, fontFamily: s.mono, color: s.text3,
              marginBottom: 8, fontWeight: 600,
            }}>
              users table
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {stiRoles.map(r => (
                <button key={r} onClick={() => setStiRole(r)} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${stiRole === r ? stiFields[r].color : s.border}`,
                  background: stiRole === r ? `${stiFields[r].color}18` : s.bg2,
                  color: stiRole === r ? stiFields[r].color : s.text3,
                  fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
                }}>
                  {r}
                </button>
              ))}
            </div>

            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px', borderBottom: `1px solid ${s.border}`,
                fontSize: 11, fontFamily: s.mono, color: s.text3, fontWeight: 600,
              }}>
                Shared columns (all types)
              </div>
              {role.shared.map((f, i) => (
                <div key={f} style={{
                  padding: '6px 14px', fontFamily: s.mono, fontSize: 12,
                  color: s.text2, background: i % 2 === 0 ? s.bg : 'transparent',
                  borderBottom: '1px solid #1a1f25',
                }}>
                  {f} <span style={{ color: s.text3, marginLeft: 8 }}>{f === 'type' ? '' : f === 'id' ? 'integer' : f.includes('at') ? 'timestamp' : 'string'}</span>
                </div>
              ))}
              <div style={{
                padding: '8px 14px', borderBottom: `1px solid ${s.border}`,
                borderTop: `1px solid ${role.color}30`,
                fontSize: 11, fontFamily: s.mono, color: role.color, fontWeight: 600,
              }}>
                {stiRole}-specific columns
              </div>
              {role.specific.map((f, i) => (
                <div key={f} style={{
                  padding: '6px 14px', fontFamily: s.mono, fontSize: 12,
                  color: role.color, background: i % 2 === 0 ? s.bg : 'transparent',
                  borderBottom: '1px solid #1a1f25',
                  opacity: 0.85,
                }}>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              fontSize: 11, fontFamily: s.mono, color: s.text3,
              marginBottom: 8, fontWeight: 600,
            }}>
              {stiRole === 'Admin' ? 'app/models/admin.rb' : stiRole === 'Moderator' ? 'app/models/moderator.rb' : 'app/models/member.rb'}
            </div>
            <div className="spdc" style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
              padding: '14px 16px', fontFamily: s.mono, fontSize: 11.5,
              lineHeight: 1.65, whiteSpace: 'pre', overflow: 'auto',
            }}>
              <style>{`
.spdc code .token.keyword { color: #f92672; }
.spdc code .token.string, .spdc code .token.char, .spdc code .token.builtin, .spdc code .token.inserted { color: #e6db74; }
.spdc code .token.number, .spdc code .token.constant, .spdc code .token.symbol, .spdc code .token.property, .spdc code .token.tag, .spdc code .token.boolean, .spdc code .token.deleted { color: #ae81ff; }
.spdc code .token.selector, .spdc code .token.attr-name { color: #f92672; }
.spdc code .token.attr-value, .spdc code .token.atrule { color: #e6db74; }
.spdc code .token.function, .spdc code .token.class-name { color: #a6e22e; }
.spdc code .token.operator, .spdc code .token.entity, .spdc code .token.url, .spdc code .token.punctuation { color: #f8f8f2; }
.spdc code .token.comment, .spdc code .token.prolog, .spdc code .token.doctype, .spdc code .token.cdata { color: #75715e; font-style: italic; }
.spdc code .token.parameter, .spdc code .token.variable, .spdc code .token.regex, .spdc code .token.important { color: #fd971f; }
`}</style>
              <code dangerouslySetInnerHTML={{ __html: stiCodeHtml }} />
            </div>

            <div style={{
              marginTop: 12, padding: '10px 14px', background: s.bg2,
              borderRadius: 8, border: `1px solid ${s.border}`,
              fontSize: 12, color: s.text2, lineHeight: 1.5,
            }}>
              <span style={{ color: s.yellow, fontFamily: s.mono, fontWeight: 600 }}>Tradeoff:</span>{' '}
              Unused columns are NULL for other types. Works well when types share most fields.
            </div>
          </div>
        </div>
      )}

      {showQuery && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              fontSize: 11, fontFamily: s.mono, color: s.text3,
              marginBottom: 8, fontWeight: 600,
            }}>
              comments table
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {polyTargets.map(t => (
                <button key={t} onClick={() => setPolyTarget(t)} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${polyTarget === t ? polyData[t].color : s.border}`,
                  background: polyTarget === t ? `${polyData[t].color}18` : s.bg2,
                  color: polyTarget === t ? polyData[t].color : s.text3,
                  fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
                }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px', borderBottom: `1px solid ${s.border}`,
                fontSize: 11, fontFamily: s.mono, color: s.text3, fontWeight: 600,
              }}>
                Schema
              </div>
              {[
                { name: 'id', type: 'integer' },
                { name: 'body', type: 'text' },
                { name: 'author_id', type: 'integer' },
                { name: 'commentable_id', type: 'integer' },
                { name: 'commentable_type', type: 'string' },
                { name: 'created_at', type: 'timestamp' },
              ].map((col, i) => (
                <div key={col.name} style={{
                  padding: '6px 14px', fontFamily: s.mono, fontSize: 12,
                  background: i % 2 === 0 ? s.bg : 'transparent',
                  borderBottom: '1px solid #1a1f25',
                }}>
                  <span style={{
                    color: col.name.includes('commentable') ? polyData[polyTarget].color : s.text2,
                    fontWeight: col.name.includes('commentable') ? 600 : 400,
                  }}>
                    {col.name}
                  </span>
                  <span style={{ color: s.text3, marginLeft: 8 }}>{col.type}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 12, padding: '12px 16px', background: s.bg,
              border: `1px solid ${polyData[polyTarget].color}30`, borderRadius: 10,
              fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, color: s.text2,
            }}>
              <div style={{ color: polyData[polyTarget].color, fontWeight: 600, marginBottom: 4 }}>
                Comment on {polyTarget}
              </div>
              <div>commentable_id: <span style={{ color: s.yellow }}>{polyData[polyTarget].exampleId}</span></div>
              <div>commentable_type: <span style={{ color: s.yellow }}>"{polyTarget}"</span></div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              fontSize: 11, fontFamily: s.mono, color: s.text3,
              marginBottom: 8, fontWeight: 600,
            }}>
              app/models/comment.rb
            </div>
            <div className="spdc" style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
              padding: '14px 16px', fontFamily: s.mono, fontSize: 11.5,
              lineHeight: 1.65, whiteSpace: 'pre', overflow: 'auto',
            }}>
              <code dangerouslySetInnerHTML={{ __html: polyCodeHtml }} />
            </div>

            <div style={{
              marginTop: 12, padding: '10px 14px', background: s.bg2,
              borderRadius: 8, border: `1px solid ${s.border}`,
              fontSize: 12, color: s.text2, lineHeight: 1.5,
            }}>
              <span style={{ color: s.yellow, fontFamily: s.mono, fontWeight: 600 }}>Tradeoff:</span>{' '}
              No foreign key constraint. Cannot add DB-level indexes on the polymorphic reference. Use when the set of possible types is small and stable.
            </div>
          </div>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
