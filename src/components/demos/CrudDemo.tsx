import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-sql'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Record {
  id: number
  title: string
  author: string
}

const initialData: Record[] = [
  { id: 1, title: 'Getting Started with Rails', author: 'Alice' },
  { id: 2, title: 'Active Record Deep Dive', author: 'Bob' },
  { id: 3, title: 'Testing Rails Applications', author: 'Carol' },
]

let nextId = 4

type Action = 'none' | 'create' | 'update' | 'delete'

export default function CrudDemo() {
  const [data, setData] = useState<Record[]>(initialData)
  const [action, setAction] = useState<Action>('none')
  const [formTitle, setFormTitle] = useState('')
  const [formAuthor, setFormAuthor] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [log, setLog] = useState<{ action: string; sql: string; controller: string }[]>([])

  const addLog = (entry: { action: string; sql: string; controller: string }) => {
    setLog((prev) => [entry, ...prev].slice(0, 8))
  }

  const handleCreate = () => {
    if (!formTitle.trim() || !formAuthor.trim()) return
    const newRecord = { id: nextId++, title: formTitle.trim(), author: formAuthor.trim() }
    setData((prev) => [...prev, newRecord])
    addLog({
      action: 'CREATE',
      sql: `INSERT INTO articles (title, author, created_at, updated_at)\nVALUES ('${newRecord.title}', '${newRecord.author}', NOW(), NOW())`,
      controller: `def create\n  @article = Article.new(article_params)\n  @article.save\n  redirect_to @article\nend`,
    })
    setFormTitle('')
    setFormAuthor('')
    setAction('none')
  }

  const startEdit = (record: Record) => {
    setEditId(record.id)
    setFormTitle(record.title)
    setFormAuthor(record.author)
    setAction('update')
  }

  const handleUpdate = () => {
    if (editId === null) return
    const old = data.find((r) => r.id === editId)
    setData((prev) => prev.map((r) => r.id === editId ? { ...r, title: formTitle.trim(), author: formAuthor.trim() } : r))
    addLog({
      action: 'UPDATE',
      sql: `UPDATE articles\nSET title = '${formTitle.trim()}', author = '${formAuthor.trim()}', updated_at = NOW()\nWHERE id = ${editId}`,
      controller: `def update\n  @article = Article.find(${editId})\n  @article.update(article_params)\n  redirect_to @article\nend`,
    })
    setEditId(null)
    setFormTitle('')
    setFormAuthor('')
    setAction('none')
  }

  const handleDelete = (id: number) => {
    const record = data.find((r) => r.id === id)
    setData((prev) => prev.filter((r) => r.id !== id))
    addLog({
      action: 'DELETE',
      sql: `DELETE FROM articles WHERE id = ${id}`,
      controller: `def destroy\n  @article = Article.find(${id})\n  @article.destroy\n  redirect_to articles_url\nend`,
    })
    setDeleteId(null)
  }

  const handleRead = (record: Record) => {
    addLog({
      action: 'READ',
      sql: `SELECT * FROM articles WHERE id = ${record.id}`,
      controller: `def show\n  @article = Article.find(${record.id})\n  render :show\nend`,
    })
  }

  const cancel = () => {
    setAction('none')
    setEditId(null)
    setDeleteId(null)
    setFormTitle('')
    setFormAuthor('')
  }

  const logHtml = useMemo(() => log.map(entry => ({
    sql: Prism.highlight(entry.sql, Prism.languages.sql, 'sql'),
    controller: Prism.highlight(entry.controller, Prism.languages.ruby, 'ruby'),
  })), [log])

  return (
    <DemoBoundary name="CRUD Demo">
      <div className="cdc" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px', minWidth: 320 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>
                articles
              </div>
              {action === 'none' && (
                <button
                  onClick={() => { setAction('create'); setFormTitle(''); setFormAuthor('') }}
                  style={{
                    background: s.green, border: 'none', borderRadius: 6,
                    padding: '5px 12px', color: '#fff', fontFamily: s.mono,
                    fontSize: 11, cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  + New
                </button>
              )}
            </div>

            {action === 'create' || action === 'update' ? (
              <div style={{
                background: s.bg2, borderRadius: 8, padding: 12,
                border: `1px solid ${s.accent}40`, marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.accent, marginBottom: 8 }}>
                  {action === 'create' ? 'Create Article' : `Edit Article #${editId}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Title"
                    style={{
                      background: s.bg, border: `1px solid ${s.border}`,
                      borderRadius: 6, padding: '6px 10px', color: s.text,
                      fontFamily: s.mono, fontSize: 12, outline: 'none',
                    }}
                  />
                  <input
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Author"
                    style={{
                      background: s.bg, border: `1px solid ${s.border}`,
                      borderRadius: 6, padding: '6px 10px', color: s.text,
                      fontFamily: s.mono, fontSize: 12, outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={action === 'create' ? handleCreate : handleUpdate}
                      style={{
                        background: s.accent, border: 'none', borderRadius: 6,
                        padding: '6px 16px', color: '#fff', fontFamily: s.mono,
                        fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      {action === 'create' ? 'Save' : 'Update'}
                    </button>
                    <button
                      onClick={cancel}
                      style={{
                        background: s.bg3, border: `1px solid ${s.border}`,
                        borderRadius: 6, padding: '6px 16px', color: s.text2,
                        fontFamily: s.mono, fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {data.length === 0 ? (
              <div style={{
                padding: 30, textAlign: 'center', color: s.text3, fontSize: 12,
                background: s.bg2, borderRadius: 8, border: `1px dashed ${s.border}`,
              }}>
                No records. Click + New to create one.
              </div>
            ) : (
              <div style={{
                borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden',
              }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontFamily: s.mono, fontSize: 12,
                }}>
                  <thead>
                    <tr style={{ background: s.bg2 }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: s.text3, fontWeight: 600, borderBottom: `1px solid ${s.border}` }}>ID</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: s.text3, fontWeight: 600, borderBottom: `1px solid ${s.border}` }}>Title</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: s.text3, fontWeight: 600, borderBottom: `1px solid ${s.border}` }}>Author</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: s.text3, fontWeight: 600, borderBottom: `1px solid ${s.border}` }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.id} style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}>
                        <td style={{ padding: '8px 12px', color: s.text3 }}>{r.id}</td>
                        <td style={{ padding: '8px 12px', color: s.text }}>{r.title}</td>
                        <td style={{ padding: '8px 12px', color: s.text2 }}>{r.author}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {deleteId === r.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(r.id)}
                                  style={{
                                    background: s.red, border: 'none', borderRadius: 4,
                                    padding: '3px 8px', color: '#fff', fontFamily: s.mono,
                                    fontSize: 10, cursor: 'pointer',
                                  }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteId(null)}
                                  style={{
                                    background: s.bg3, border: `1px solid ${s.border}`,
                                    borderRadius: 4, padding: '3px 8px', color: s.text3,
                                    fontFamily: s.mono, fontSize: 10, cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRead(r)}
                                  style={{
                                    background: 'transparent', border: `1px solid ${s.border}`,
                                    borderRadius: 4, padding: '3px 8px', color: s.text3,
                                    fontFamily: s.mono, fontSize: 10, cursor: 'pointer',
                                  }}
                                >
                                  Show
                                </button>
                                <button
                                  onClick={() => startEdit(r)}
                                  style={{
                                    background: 'transparent', border: `1px solid ${s.border}`,
                                    borderRadius: 4, padding: '3px 8px', color: s.yellow,
                                    fontFamily: s.mono, fontSize: 10, cursor: 'pointer',
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteId(r.id)}
                                  style={{
                                    background: 'transparent', border: `1px solid ${s.border}`,
                                    borderRadius: 4, padding: '3px 8px', color: s.red,
                                    fontFamily: s.mono, fontSize: 10, cursor: 'pointer',
                                  }}
                                >
                                  Del
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 350px', minWidth: 280 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 8 }}>
              Action Log
            </div>
            {log.length === 0 ? (
              <div style={{
                padding: 20, textAlign: 'center', color: s.text3, fontSize: 11,
                background: s.bg2, borderRadius: 8, border: `1px dashed ${s.border}`,
              }}>
                Click Show, Edit, Del, or + New to see the Rails controller and SQL
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {log.map((entry, i) => {
                  const actionColor = entry.action === 'CREATE' ? s.green : entry.action === 'READ' ? s.accent : entry.action === 'UPDATE' ? s.yellow : s.red
                  return (
                    <div key={i} style={{
                      background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderBottom: `1px solid ${s.border}`,
                        background: s.bg3,
                      }}>
                        <span style={{
                          fontFamily: s.mono, fontSize: 10, fontWeight: 700,
                          color: actionColor, padding: '1px 6px', borderRadius: 3,
                          background: actionColor + '20',
                        }}>
                          {entry.action}
                        </span>
                      </div>
                      <div style={{ padding: 10 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 600, color: s.text3,
                          marginBottom: 4, fontFamily: s.mono,
                        }}>
                          SQL
                        </div>
                        <div style={{
                          fontFamily: s.mono, fontSize: 11, lineHeight: 1.5,
                          whiteSpace: 'pre',
                        }}>
                          <code dangerouslySetInnerHTML={{ __html: logHtml[i].sql }} />
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 600, color: s.text3,
                          marginTop: 8, marginBottom: 4, fontFamily: s.mono,
                        }}>
                          Controller
                        </div>
                        <div style={{
                          fontFamily: s.mono, fontSize: 11, lineHeight: 1.5,
                          whiteSpace: 'pre',
                        }}>
                          <code dangerouslySetInnerHTML={{ __html: logHtml[i].controller }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .cdc code .token.keyword { color: #f92672; }
        .cdc code .token.string, .cdc code .token.char, .cdc code .token.builtin, .cdc code .token.inserted { color: #e6db74; }
        .cdc code .token.number, .cdc code .token.constant, .cdc code .token.symbol, .cdc code .token.property, .cdc code .token.tag, .cdc code .token.boolean, .cdc code .token.deleted { color: #ae81ff; }
        .cdc code .token.selector, .cdc code .token.attr-name { color: #f92672; }
        .cdc code .token.attr-value, .cdc code .token.atrule { color: #e6db74; }
        .cdc code .token.function, .cdc code .token.class-name { color: #a6e22e; }
        .cdc code .token.operator, .cdc code .token.entity, .cdc code .token.url, .cdc code .token.punctuation { color: #f8f8f2; }
        .cdc code .token.comment, .cdc code .token.prolog, .cdc code .token.doctype, .cdc code .token.cdata { color: #75715e; font-style: italic; }
        .cdc code .token.parameter, .cdc code .token.variable, .cdc code .token.regex, .cdc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}
