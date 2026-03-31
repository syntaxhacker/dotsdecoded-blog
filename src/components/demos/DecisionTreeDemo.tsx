import { useState } from 'react'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const questions = [
  { id: 0, text: 'Is your data structure fixed and predictable?' },
  { id: 1, text: 'Do you need complex JOINs between entities?' },
  { id: 2, text: 'Is ACID compliance critical (financial, healthcare)?' },
  { id: 3, text: 'Will you need to scale writes across multiple servers?' },
  { id: 4, text: 'Does your data shape change frequently during development?' },
]

const sqlAnswers = new Set([0, 1, 2])
const nosqlAnswers = new Set([3, 4])

export default function DecisionTreeDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(5).fill(null))
  const [done, setDone] = useState(false)

  const handleAnswer = (value: boolean) => {
    const next = [...answers]
    next[currentStep] = value
    setAnswers(next)
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      setDone(true)
    }
  }

  const reset = () => {
    setCurrentStep(0)
    setAnswers(Array(5).fill(null))
    setDone(false)
  }

  const getSqlScore = () => {
    let score = 0
    answers.forEach((a, i) => {
      if (a === null) return
      if (sqlAnswers.has(i) && a === true) score++
      if (nosqlAnswers.has(i) && a === false) score++
    })
    return score
  }

  const getNosqlScore = () => {
    let score = 0
    answers.forEach((a, i) => {
      if (a === null) return
      if (sqlAnswers.has(i) && a === false) score++
      if (nosqlAnswers.has(i) && a === true) score++
    })
    return score
  }

  const sqlScore = getSqlScore()
  const nosqlScore = getNosqlScore()
  const confidence = done ? Math.round((Math.abs(sqlScore - nosqlScore) / 5) * 100) : 0

  const getRecommendation = () => {
    if (sqlScore >= 4) {
      return {
        label: 'SQL (PostgreSQL)',
        color: s.accent,
        explanation:
          'Your requirements strongly align with a relational database. PostgreSQL offers a mature query planner, strong ACID guarantees, and a rich ecosystem for structured data with complex relationships.',
      }
    }
    if (nosqlScore >= 4) {
      return {
        label: 'NoSQL (MongoDB)',
        color: s.green,
        explanation:
          'Your workload benefits from a flexible schema and horizontal scalability. MongoDB\'s document model adapts to changing data shapes and distributes writes across shards naturally.',
      }
    }
    return {
      label: 'Depends on the feature',
      color: s.yellow,
      explanation:
          'Your needs are split. Use PostgreSQL for transactional data, user accounts, and anything requiring JOINs or consistency. Use MongoDB for logs, sessions, content management, and rapidly-evolving schemas.',
    }
  }

  const nodeStatus = (idx: number) => {
    if (answers[idx] !== null) return 'visited'
    if (idx === currentStep && !done) return 'current'
    return 'future'
  }

  const getNodeColor = (status: string) => {
    if (status === 'visited') return s.accent
    if (status === 'current') return s.green
    return s.text3
  }

  const getNodeBg = (status: string) => {
    if (status === 'visited') return s.bg3
    if (status === 'current') return `${s.green}18`
    return s.bg2
  }

  const getConnectorColor = (idx: number) => {
    if (answers[idx] !== null) return s.accent
    if (idx === currentStep && !done) return `${s.green}80`
    return s.border
  }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '24px 0' }}>
      {!done ? (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {questions.map((q, idx) => {
              const status = nodeStatus(idx)
              const isActive = status === 'current'
              const isVisited = status === 'visited'
              const nodeColor = getNodeColor(status)
              const nodeBg = getNodeBg(status)

              return (
                <div key={q.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: nodeBg,
                      border: `1.5px solid ${isVisited ? `${s.accent}60` : isActive ? `${s.green}60` : s.border}`,
                      opacity: status === 'future' ? 0.4 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isVisited ? s.accent : isActive ? s.green : s.border,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        color: isVisited || isActive ? s.bg : s.text3,
                        flexShrink: 0,
                        marginTop: 2,
                        fontFamily: s.mono,
                      }}
                    >
                      {isVisited ? '\u2713' : idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: nodeColor, lineHeight: 1.4 }}>
                        {q.text}
                      </div>
                      {isActive && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button
                            onClick={() => handleAnswer(true)}
                            style={{
                              padding: '8px 28px',
                              borderRadius: 6,
                              border: `1.5px solid ${s.accent}`,
                              background: 'transparent',
                              color: s.accent,
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = s.accent
                              e.currentTarget.style.color = s.bg
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = s.accent
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleAnswer(false)}
                            style={{
                              padding: '8px 28px',
                              borderRadius: 6,
                              border: `1.5px solid ${s.green}`,
                              background: 'transparent',
                              color: s.green,
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = s.green
                              e.currentTarget.style.color = s.bg
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = s.green
                            }}
                          >
                            No
                          </button>
                        </div>
                      )}
                      {isVisited && (
                        <div style={{ marginTop: 8, fontSize: 13, color: s.text2 }}>
                          Answer:{' '}
                          <span style={{ color: answers[idx] ? s.accent : s.green, fontWeight: 600 }}>
                            {answers[idx] ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {idx < 4 && (
                    <div
                      style={{
                        width: 2,
                        height: 20,
                        background: getConnectorColor(idx),
                        margin: '0 0 0 35px',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {answers.some(a => a !== null) && !done && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button
                onClick={reset}
                style={{
                  padding: '6px 18px',
                  borderRadius: 6,
                  border: `1px solid ${s.border}`,
                  background: 'transparent',
                  color: s.text3,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: s.mono,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = s.text2
                  e.currentTarget.style.color = s.text2
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = s.border
                  e.currentTarget.style.color = s.text3
                }}
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 28 }}>
            {questions.map((q, idx) => {
              const connColor = idx < 4 ? getConnectorColor(idx) : s.accent
              return (
                <div key={q.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      borderRadius: 8,
                      background: s.bg3,
                      border: `1.5px solid ${s.accent}40`,
                      opacity: 0.7,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: s.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: s.bg,
                        flexShrink: 0,
                        fontFamily: s.mono,
                      }}
                    >
                      {'\u2713'}
                    </div>
                    <span style={{ fontSize: 13, color: s.text2, flex: 1 }}>{q.text}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: answers[idx] ? s.accent : s.green,
                        fontFamily: s.mono,
                      }}
                    >
                      {answers[idx] ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {idx < 4 && (
                    <div style={{ width: 2, height: 10, background: connColor, margin: '0 0 0 27px' }} />
                  )}
                </div>
              )
            })}
          </div>

          {(() => {
            const rec = getRecommendation()
            return (
              <div
                style={{
                  borderRadius: 12,
                  border: `2px solid ${rec.color}60`,
                  background: `${rec.color}08`,
                  padding: '24px 28px',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: rec.color, marginBottom: 8 }}>
                  Recommendation
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: rec.color, marginBottom: 12, fontFamily: s.mono }}>
                  {rec.label}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: s.text2 }}>
                  {rec.explanation}
                </div>
              </div>
            )
          })()}

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3 }}>
                Confidence
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: confidence >= 60 ? s.green : confidence >= 30 ? s.yellow : s.red, fontFamily: s.mono }}>
                {confidence}%
              </span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: s.bg3 }}>
              <div
                style={{
                  width: `${confidence}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: confidence >= 60 ? s.green : confidence >= 30 ? s.yellow : s.red,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: s.text3 }}>Uncertain</span>
              <span style={{ fontSize: 11, color: s.text3 }}>Clear winner</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 32px',
                borderRadius: 8,
                border: `1.5px solid ${s.accent}`,
                background: 'transparent',
                color: s.accent,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = s.accent
                e.currentTarget.style.color = s.bg
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = s.accent
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
