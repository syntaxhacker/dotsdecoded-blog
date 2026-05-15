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

const users = [
  { id: 'user_001', name: 'Alice', plan: 'enterprise', region: 'us-east', beta: false },
  { id: 'user_042', name: 'Bob', plan: 'enterprise', region: 'us-west', beta: true },
  { id: 'user_099', name: 'Charlie', plan: 'free', region: 'eu-west', beta: false },
  { id: 'user_150', name: 'Diana', plan: 'pro', region: 'ap-southeast', beta: true },
  { id: 'user_203', name: 'Eve', plan: 'enterprise', region: 'us-east', beta: false },
]

const rules = [
  { priority: 1, name: 'Internal Beta', condition: 'beta == true', result: true, color: s.green },
  { priority: 2, name: 'Enterprise GA', condition: 'plan == "enterprise"', result: true, color: s.accent },
  { priority: 3, name: 'Region Pause', condition: 'region == "eu-west"', result: false, color: s.red },
  { priority: 4, name: 'Pro Rollout', condition: 'plan == "pro" AND rollout == 50%', result: 'hash(user) < 50', color: s.yellow },
  { priority: 5, name: 'Default Fallback', condition: 'no match', result: false, color: s.orange },
]

const ruleExplanations: Record<number, string> = {
  1: 'Highest priority. If the user is in the beta group, the flag returns true immediately. No need to check further rules.',
  2: 'Enterprise plan users get the feature regardless of region (except where overridden by higher-priority rules).',
  3: 'EU users explicitly blocked. Even enterprise EU users get false — but priority rules above may override this.',
  4: 'Pro plan users get the feature based on a deterministic hash. The rollout slider controls the percentage threshold.',
  5: 'No rule matched. Return the fallback default value (false). The feature is off for this user.',
}

type PipelineStage = 'request' | 'evaluate' | 'match' | 'result'

export default function FlagEvaluationDemo() {
  const [selectedUserIdx, setSelectedUserIdx] = useState(0)
  const [rolloutPct, setRolloutPct] = useState(50)
  const [stage, setStage] = useState<PipelineStage>('request')
  const [matchedRule, setMatchedRule] = useState<number | null>(null)
  const [result, setResult] = useState<boolean | null>(null)
  const [running, setRunning] = useState(false)

  const user = users[selectedUserIdx]

  const simpleHash = (id: string): number => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash) % 100
  }

  const evaluate = useCallback(() => {
    if (running) return
    setRunning(true)
    setStage('request')
    setMatchedRule(null)
    setResult(null)

    setTimeout(() => {
      setStage('evaluate')
      setTimeout(() => {
        const u = users[selectedUserIdx]
        let matched: number | null = null
        let val: boolean | null = null

        if (u.beta) {
          matched = 0
          val = true
        } else if (u.plan === 'enterprise') {
          matched = 1
          val = true
        } else if (u.region === 'eu-west') {
          matched = 2
          val = false
        } else if (u.plan === 'pro') {
          const h = simpleHash(u.id)
          if (h < rolloutPct) {
            matched = 3
            val = true
          } else {
            matched = 3
            val = false
          }
        } else {
          matched = 4
          val = false
        }

        setStage('match')
        setMatchedRule(matched)

        setTimeout(() => {
          setStage('result')
          setResult(val)
          setRunning(false)
        }, 600)
      }, 600)
    }, 600)
  }, [selectedUserIdx, rolloutPct, running])

  const stageBg = (st: PipelineStage): string => {
    if (stage === st) return s.accent
    const order: PipelineStage[] = ['request', 'evaluate', 'match', 'result']
    return order.indexOf(stage) >= order.indexOf(st) ? s.green : s.bg3
  }

  const stageLabel = (st: PipelineStage): string => {
    const labels: Record<PipelineStage, string> = {
      request: 'Request Incoming',
      evaluate: 'Checking Rules',
      match: 'Rule Matched',
      result: 'Flag Returned',
    }
    return labels[st]
  }

  return (
    <DemoBoundary name="Flag Evaluation Pipeline">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          background: s.bg2, borderRadius: 12, padding: '20px 24px',
          border: `1px solid ${s.border}`,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 16,
            letterSpacing: -0.3,
          }}>
            Flag: new-checkout
          </div>

          <div style={{
            display: 'flex', gap: 16, marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Select User
              </div>
              <select
                value={selectedUserIdx}
                onChange={e => { setSelectedUserIdx(Number(e.target.value)); setStage('request'); setMatchedRule(null); setResult(null) }}
                style={{
                  width: '100%', background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 8, padding: '8px 12px',
                  color: s.text, fontSize: 13, fontFamily: s.mono,
                }}
              >
                {users.map((u, i) => (
                  <option key={u.id} value={i}>{u.name} ({u.plan}, {u.region}){u.beta ? ' [beta]' : ''}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Rollout %
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range" min={0} max={100} value={rolloutPct}
                  onChange={e => setRolloutPct(Number(e.target.value))}
                  style={{ flex: 1, accentColor: s.accent }}
                />
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13, minWidth: 30, textAlign: 'right' }}>
                  {rolloutPct}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['request', 'evaluate', 'match', 'result'] as PipelineStage[]).map(st => {
              const completed = stage !== st
              const isActive = stage === st
              return (
                <div
                  key={st}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12,
                    fontWeight: 600,
                    background: isActive ? s.accent : completed ? `${s.green}25` : s.bg3,
                    color: isActive ? '#fff' : completed ? s.green : s.text3,
                    border: `1px solid ${isActive ? s.accent : completed ? s.green : s.border}`,
                    transition: 'all 0.3s',
                  }}
                >
                  {isActive && <>&#x25B6; </>}
                  {completed && !isActive && <>&#x2713; </>}
                  {stageLabel(st)}
                </div>
              )
            })}
          </div>

          <div style={{
            display: 'flex', gap: 16, marginBottom: 20,
            flexDirection: 'column' as const,
          }}>
            <div style={{
              background: s.bg, borderRadius: 8, padding: '12px 16px',
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                User Context
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Name', value: user.name },
                  { label: 'Plan', value: user.plan },
                  { label: 'Region', value: user.region },
                  { label: 'Beta', value: user.beta ? 'true' : 'false' },
                  { label: 'Hash', value: `${simpleHash(user.id)}%` },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: s.text3, fontSize: 11 }}>{f.label}:</span>
                    <span style={{
                      color: f.value === 'true' ? s.green : f.value === 'false' ? s.red : s.text,
                      fontFamily: s.mono, fontSize: 13, fontWeight: 600,
                    }}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {rules.map((rule, i) => {
                const isMatched = matchedRule === i
                const showActive = stage === 'evaluate' || (isMatched && (stage === 'match' || stage === 'result')) || (stage === 'result' && matchedRule !== null && i <= matchedRule)
                const isSkipped = stage === 'match' && matchedRule !== null && i < matchedRule
                return (
                  <div
                    key={rule.priority}
                    style={{
                      flex: '1 1 160px', minWidth: 140,
                      padding: '10px 12px', borderRadius: 8,
                      background: isMatched ? `${rule.color}20` : showActive ? s.bg : s.bg,
                      border: `1px solid ${
                        isMatched ? rule.color : showActive ? s.border2 : s.border
                      }`,
                      opacity: isSkipped ? 0.5 : 1,
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 4,
                    }}>
                      <span style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        P{rule.priority}
                      </span>
                      {isMatched && (
                        <span style={{ color: rule.color, fontSize: 11, fontWeight: 600 }}>
                          &#x2713; MATCH
                        </span>
                      )}
                    </div>
                    <div style={{ color: s.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {rule.name}
                    </div>
                    <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
                      {rule.condition}
                    </div>
                    {isMatched && (
                      <div style={{
                        marginTop: 8, padding: '4px 8px', borderRadius: 4,
                        background: `${rule.color}15`,
                        color: rule.color, fontSize: 14, fontWeight: 700,
                      }}>
                        &#x2192; {String(rule.result)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={evaluate}
              disabled={running}
              style={{
                background: running ? s.bg3 : s.accent,
                border: 'none', borderRadius: 8, padding: '10px 24px',
                color: '#fff', cursor: running ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              {running ? 'Evaluating...' : 'Evaluate Flag'}
            </button>

            {result !== null && (
              <div style={{
                padding: '10px 20px', borderRadius: 8,
                background: result ? `${s.green}20` : `${s.red}20`,
                border: `1px solid ${result ? s.green : s.red}`,
                fontSize: 14, fontWeight: 700,
                color: result ? s.green : s.red,
              }}>
                Flag new-checkout = {String(result)}
                {matchedRule !== null && (
                  <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 8, color: s.text3 }}>
                    (matched: {rules[matchedRule].name})
                  </span>
                )}
              </div>
            )}
          </div>

          {matchedRule !== null && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: s.bg, borderRadius: 8,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{
                color: s.text3, fontSize: 11, marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                Rule Detail
              </div>
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>
                {ruleExplanations[matchedRule]}
              </div>
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
