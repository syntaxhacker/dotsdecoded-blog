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

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  points: number
  explanation?: string
}

interface QuizDemoProps {
  questions: QuizQuestion[]
}

interface QuizAnswer {
  selected: number
  correct: boolean
}

export default function QuizDemo({ questions }: QuizDemoProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [quizComplete, setQuizComplete] = useState(false)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [retryKey, setRetryKey] = useState(0)

  const totalPossible = useMemo(
    () => questions.reduce((sum, q) => sum + q.points, 0),
    [questions]
  )

  const current = questions[currentQuestion]
  const isCorrect = selectedOption === current.correctIndex
  const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0

  function handleSubmit() {
    if (selectedOption === null) return
    setShowFeedback(true)
    const correct = selectedOption === current.correctIndex
    if (correct) {
      setScore(prev => prev + current.points)
    }
    setAnswers(prev => [...prev, { selected: selectedOption, correct }])
  }

  function handleNext() {
    if (currentQuestion + 1 >= questions.length) {
      setQuizComplete(true)
      saveProgress(score + (isCorrect ? current.points : 0))
    } else {
      setCurrentQuestion(prev => prev + 1)
      setSelectedOption(null)
      setShowFeedback(false)
    }
  }

  function handleRetry() {
    setCurrentQuestion(0)
    setSelectedOption(null)
    setShowFeedback(false)
    setScore(0)
    setQuizComplete(false)
    setAnswers([])
    setRetryKey(k => k + 1)
  }

  function saveProgress(finalScore: number) {
    try {
      const slug = window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, '')
      if (!slug) return
      const raw = localStorage.getItem('blogProgress')
      const data: Record<string, { completed: boolean; score: number; maxScore: number; lastVisited: string }> = raw ? JSON.parse(raw) : {}
      data[slug] = {
        completed: true,
        score: finalScore,
        maxScore: totalPossible,
        lastVisited: new Date().toISOString(),
      }
      localStorage.setItem('blogProgress', JSON.stringify(data))
    } catch {}
  }

  function getResultBanner() {
    if (percentage >= 90) {
      return {
        ascii: [
          '  ███████╗██╗   ██╗███████╗██╗      ██████╗ ███████╗██╗  ██╗',
          '  ██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔═══██╗██╔════╝██║  ██║',
          '  █████╗   ╚████╔╝ █████╗  ██║     ██║   ██║███████╗███████║',
          '  ██╔══╝    ╚██╔╝  ██╔══╝  ██║     ██║   ██║╚════██║██╔══██║',
          '  ███████╗   ██║   ███████╗███████╗╚██████╔╝███████║██║  ██║',
          '  ╚══════╝   ╚═╝   ╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝',
        ],
        color: s.green,
        label: 'EXCELLENT',
        face: '(^_^)',
        message: 'Outstanding performance! You have a strong grasp of this topic.',
      }
    }
    if (percentage >= 70) {
      return {
        ascii: [
          '   ██████╗ ██╗   ██╗███████╗',
          '  ██╔═══██╗██║   ██║██╔════╝',
          '  ██║   ██║██║   ██║███████╗',
          '  ██║   ██║██║   ██║╚════██║',
          '  ╚██████╔╝╚██████╔╝███████║',
          '   ╚═════╝  ╚═════╝ ╚══════╝',
        ],
        color: s.yellow,
        label: 'GOOD',
        face: ':-)',
        message: 'Nice work! A solid understanding with room to grow.',
      }
    }
    return {
      ascii: [
        '  ██╗  ██╗██╗████████╗███████╗',
        '  ██║  ██║██║╚══██╔══╝██╔════╝',
        '  ███████║██║   ██║   ███████╗',
        '  ██╔══██║██║   ██║   ╚════██║',
        '  ██║  ██║██║   ██║   ███████║',
        '  ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝',
      ],
      color: s.orange,
      label: 'KEEP LEARNING',
      face: ':-/',
      message: 'Every expert was once a beginner. Keep going!',
    }
  }

  const key = retryKey

  if (quizComplete) {
    const result = getResultBanner()
    return (
      <DemoBoundary name="Quiz">
        <div
          key={key}
          style={{
            maxWidth: 820,
            margin: '0 auto',
            padding: 24,
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          <div style={{
            fontFamily: s.mono,
            fontSize: 11,
            lineHeight: 1.4,
            color: result.color,
            marginBottom: 16,
            whiteSpace: 'pre',
            overflowX: 'auto',
          }}>
            {result.ascii.join('\n')}
          </div>
          <div style={{ color: result.color, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {result.label} {result.face}
          </div>
          <div style={{ color: s.text2, fontSize: 14, marginBottom: 20 }}>
            {result.message}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 24,
          }}>
            <span style={{ color: s.text, fontSize: 36, fontWeight: 700, fontFamily: s.mono }}>
              {score}
            </span>
            <span style={{ color: s.text3, fontSize: 16 }}>
              / {totalPossible} points ({percentage}%)
            </span>
          </div>
          <div style={{
            borderTop: `1px solid ${s.border}`,
            paddingTop: 16,
            marginBottom: 20,
          }}>
            <div style={{ color: s.text2, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Answer Review
            </div>
            {questions.map((q, i) => {
              const a = answers[i]
              if (!a) return null
              return (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 6,
                    borderRadius: 6,
                    background: a.correct ? 'rgba(61, 214, 140, 0.08)' : 'rgba(232, 93, 93, 0.08)',
                    border: `1px solid ${a.correct ? 'rgba(61, 214, 140, 0.2)' : 'rgba(232, 93, 93, 0.2)'}`,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: a.correct ? s.green : s.red, fontWeight: 600, marginRight: 8 }}>
                    {a.correct ? 'Correct' : 'Wrong'}
                  </span>
                  <span style={{ color: s.text2 }}>
                    Q{i + 1}: {q.question.length > 60 ? q.question.slice(0, 60) + '...' : q.question}
                  </span>
                </div>
              )
            })}
          </div>
          <button
            onClick={handleRetry}
            style={{
              background: s.bg,
              border: `1px solid ${s.border2}`,
              borderRadius: 6,
              padding: '10px 24px',
              color: s.text,
              fontFamily: s.mono,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.accent
              e.currentTarget.style.color = s.accent
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = s.border2
              e.currentTarget.style.color = s.text
            }}
          >
            Retry Quiz
          </button>
        </div>
      </DemoBoundary>
    )
  }

  return (
    <DemoBoundary name="Quiz">
      <div
        key={key}
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: 24,
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 10,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <span style={{ color: s.text2, fontSize: 13 }}>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span style={{ color: s.accent, fontSize: 13, fontFamily: s.mono }}>
            {current.points} {current.points === 1 ? 'pt' : 'pts'}
          </span>
        </div>
        <div style={{
          height: 4,
          background: s.bg3,
          borderRadius: 2,
          marginBottom: 20,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            background: s.accent,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ color: s.text, fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>
          {current.question}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {current.options.map((opt, i) => {
            const isSelected = selectedOption === i
            const isCorrectOption = i === current.correctIndex
            let borderColor = s.border
            let bgColor = s.bg
            if (showFeedback && isCorrectOption) {
              borderColor = s.green
              bgColor = 'rgba(61, 214, 140, 0.08)'
            } else if (showFeedback && isSelected && !isCorrectOption) {
              borderColor = s.red
              bgColor = 'rgba(232, 93, 93, 0.08)'
            } else if (isSelected) {
              borderColor = s.accent
              bgColor = 'rgba(91, 141, 239, 0.08)'
            }
            return (
              <button
                key={i}
                onClick={() => {
                  if (!showFeedback) setSelectedOption(i)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  cursor: showFeedback ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                  fontFamily: "inherit",
                  fontSize: 14,
                  color: s.text,
                }}
                onMouseEnter={e => {
                  if (!showFeedback && !isSelected) {
                    e.currentTarget.style.borderColor = s.border2
                  }
                }}
                onMouseLeave={e => {
                  if (!showFeedback && !isSelected) {
                    e.currentTarget.style.borderColor = s.border
                  }
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: showFeedback
                    ? isCorrectOption ? s.green : isSelected ? s.red : s.bg3
                    : isSelected ? s.accent : s.bg3,
                  color: showFeedback
                    ? isCorrectOption || isSelected ? s.bg : s.text2
                    : isSelected ? s.bg : s.text2,
                  fontFamily: s.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{opt}</span>
                {showFeedback && isCorrectOption && (
                  <span style={{ color: s.green, fontSize: 16, fontWeight: 700 }}>&#10003;</span>
                )}
                {showFeedback && isSelected && !isCorrectOption && (
                  <span style={{ color: s.red, fontSize: 16, fontWeight: 700 }}>&#10007;</span>
                )}
              </button>
            )
          })}
        </div>
        {showFeedback && current.explanation && isCorrect && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(61, 214, 140, 0.06)',
            border: `1px solid rgba(61, 214, 140, 0.15)`,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            color: s.text2,
            lineHeight: 1.6,
          }}>
            <span style={{ color: s.green, fontWeight: 600, marginRight: 6 }}>Explanation:</span>
            {current.explanation}
          </div>
        )}
        {showFeedback && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: isCorrect ? 'rgba(61, 214, 140, 0.06)' : 'rgba(232, 93, 93, 0.06)',
            border: `1px solid ${isCorrect ? 'rgba(61, 214, 140, 0.15)' : 'rgba(232, 93, 93, 0.15)'}`,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            color: isCorrect ? s.green : s.red,
          }}>
            {isCorrect ? 'Correct! +' + current.points + ' pts' : 'Incorrect'}
          </div>
        )}
        {!showFeedback ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            style={{
              background: selectedOption === null ? s.bg3 : s.accent,
              border: 'none',
              borderRadius: 6,
              padding: '10px 24px',
              color: selectedOption === null ? s.text3 : s.bg,
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 600,
              cursor: selectedOption === null ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              background: s.accent,
              border: 'none',
              borderRadius: 6,
              padding: '10px 24px',
              color: s.bg,
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {currentQuestion + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </button>
        )}
        <div style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${s.border}`,
          paddingTop: 12,
        }}>
          <span style={{ color: s.text3, fontSize: 12 }}>
            Score: {score} / {totalPossible}
          </span>
          <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>
            {percentage}%
          </span>
        </div>
      </div>
    </DemoBoundary>
  )
}
