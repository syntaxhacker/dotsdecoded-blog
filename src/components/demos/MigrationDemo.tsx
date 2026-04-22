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

type Step = 'idle' | 'generated' | 'ran' | 'rolled'

const migrationFile = `class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string   :name, null: false
      t.string   :email, null: false
      t.integer  :age
      t.boolean  :admin, default: false
      t.datetime :created_at
      t.datetime :updated_at
    end

    add_index :users, :email, unique: true
  end
end`

const sqlCreate = `CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR NOT NULL,
  email      VARCHAR NOT NULL,
  age        INTEGER,
  admin      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE UNIQUE INDEX index_users_on_email
  ON users (email);`

const sqlDrop = `DROP TABLE IF EXISTS users;`

const migrationFileHtml = Prism.highlight(migrationFile, Prism.languages.ruby, 'ruby')
const sqlCreateHtml = Prism.highlight(sqlCreate, Prism.languages.sql, 'sql')
const sqlDropHtml = Prism.highlight(sqlDrop, Prism.languages.sql, 'sql')

const idleMigrationMsg = '// Run "rails generate migration" to create the file...'
const idleSqlMsg = '-- Waiting for migration...'
const generatedSqlMsg = '-- Migration ready, run "rails db:migrate"'

export default function MigrationDemo() {
  const [step, setStep] = useState<Step>('idle')
  const [logs, setLogs] = useState<string[]>([])

  const reset = () => {
    setStep('idle')
    setLogs([])
  }

  const runStep = (next: Step, ...logLines: string[]) => {
    setLogs(prev => [...prev, ...logLines])
    setStep(next)
  }

  const btn = (label: string, onClick: () => void, disabled: boolean, color: string) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? s.bg3 : color,
        border: `1px solid ${disabled ? s.border : color}`,
        borderRadius: 6,
        padding: '8px 16px',
        color: disabled ? s.text3 : s.bg,
        fontFamily: s.mono,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )

  return (
    <DemoBoundary name="Migration Demo">
      <div className="mdc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {btn('rails generate migration', () => runStep('generated', '$ rails generate migration CreateUsers name:string email:string age:integer admin:boolean'), step !== 'idle', s.accent)}
          {btn('rails db:migrate', () => runStep('ran', '== 20260405120000 CreateUsers: migrating ==========', '-- create_table(:users)', '   -> 0.0032s', '-- add_index(:users, :email, {:unique=>true})', '   -> 0.0011s', '== 20260405120000 CreateUsers: migrated (0.0048s) ===='), step !== 'generated', s.green)}
          {btn('rails db:rollback', () => runStep('rolled', '== 20260405120000 CreateUsers: reverting ==========', '-- drop_table(:users)', '   -> 0.0018s', '== 20260405120000 CreateUsers: reverted (0.0023s) ===='), step !== 'ran', s.red)}
          {btn('Reset', reset, step === 'idle', s.text3)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Migration File</div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 12,
              fontFamily: s.mono,
              fontSize: 11,
              lineHeight: 1.6,
              color: step === 'idle' ? s.text3 : undefined,
              whiteSpace: 'pre' as const,
              minHeight: 180,
            }}>
              {step === 'idle' ? <span style={{ color: s.text3 }}>{idleMigrationMsg}</span> : <code dangerouslySetInnerHTML={{ __html: migrationFileHtml }} />}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              {step === 'ran' ? 'SQL Executed' : step === 'rolled' ? 'SQL Reverted' : 'Generated SQL'}
            </div>
            <div style={{
              background: s.bg,
              border: `1px solid ${step === 'ran' ? s.green : step === 'rolled' ? s.red : s.border}`,
              borderRadius: 8,
              padding: 12,
              fontFamily: s.mono,
              fontSize: 11,
              lineHeight: 1.6,
              whiteSpace: 'pre' as const,
              minHeight: 180,
            }}>
              {step === 'idle' ? <span style={{ color: s.text3 }}>{idleSqlMsg}</span> : step === 'generated' ? <span style={{ color: s.text3 }}>{generatedSqlMsg}</span> : step === 'ran' ? <code dangerouslySetInnerHTML={{ __html: sqlCreateHtml }} /> : <code dangerouslySetInnerHTML={{ __html: sqlDropHtml }} />}
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Terminal Output</div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 12,
              fontFamily: s.mono,
              fontSize: 11,
              lineHeight: 1.6,
              color: s.text2,
              maxHeight: 160,
              overflowY: 'auto' as const,
            }}>
              {logs.map((line, i) => (
                <div key={i} style={{
                  color: line.startsWith('$') ? s.accent : line.startsWith('==') ? s.yellow : line.startsWith('--') ? s.purple : s.text2,
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: step === 'idle' ? s.text3 : step === 'generated' ? s.yellow : step === 'ran' ? s.green : s.red,
          }} />
          <span style={{ fontSize: 12, color: s.text3 }}>
            {step === 'idle' ? 'No migration applied' : step === 'generated' ? 'Migration file created' : step === 'ran' ? 'Migration applied -- table exists' : 'Migration rolled back -- table dropped'}
          </span>
        </div>
      </div>
      <style>{`
        .mdc code .token.keyword { color: #f92672; }
        .mdc code .token.string, .mdc code .token.char, .mdc code .token.builtin, .mdc code .token.inserted { color: #e6db74; }
        .mdc code .token.number, .mdc code .token.constant, .mdc code .token.symbol, .mdc code .token.property, .mdc code .token.tag, .mdc code .token.boolean, .mdc code .token.deleted { color: #ae81ff; }
        .mdc code .token.selector, .mdc code .token.attr-name { color: #f92672; }
        .mdc code .token.attr-value, .mdc code .token.atrule { color: #e6db74; }
        .mdc code .token.function, .mdc code .token.class-name { color: #a6e22e; }
        .mdc code .token.operator, .mdc code .token.entity, .mdc code .token.url, .mdc code .token.punctuation { color: #f8f8f2; }
        .mdc code .token.comment, .mdc code .token.prolog, .mdc code .token.doctype, .mdc code .token.cdata { color: #75715e; font-style: italic; }
        .mdc code .token.parameter, .mdc code .token.variable, .mdc code .token.regex, .mdc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}
