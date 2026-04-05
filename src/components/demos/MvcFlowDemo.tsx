import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const steps = [
  {
    label: 'Browser',
    desc: 'User clicks a link or types a URL into the browser address bar.',
    code: 'GET /articles HTTP/1.1',
    color: s.accent,
  },
  {
    label: 'Router',
    desc: 'Rails routes.rb matches GET /articles to the Articles controller, index action.',
    code: "get '/articles', to: 'articles#index'",
    color: s.orange,
  },
  {
    label: 'Controller',
    desc: 'The controller action calls the model to fetch all articles from the database.',
    code: '@articles = Article.all',
    color: s.purple,
  },
  {
    label: 'Model',
    desc: 'The Article model inherits from ApplicationRecord. It translates the Ruby call into SQL.',
    code: 'SELECT * FROM articles',
    color: s.green,
  },
  {
    label: 'Database',
    desc: 'PostgreSQL (or SQLite, MySQL) executes the query and returns rows of data.',
    code: 'Returns: [{id:1, title:"..."}, ...]',
    color: s.yellow,
  },
  {
    label: 'View',
    desc: 'The controller passes @articles to the ERB template. Rails renders it into HTML.',
    code: '<%= render @articles %>',
    color: s.red,
  },
  {
    label: 'Response',
    desc: 'The rendered HTML travels back through the stack to the browser. The page loads.',
    code: 'HTTP/1.1 200 OK\nContent-Type: text/html',
    color: s.accent,
  },
]

export default function MvcFlowDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!running) return
    let step = -1
    const delay = getStepDelay(1200, speed)
    const iv = setInterval(() => {
      step++
      if (step >= steps.length) {
        clearInterval(iv)
        setRunning(false)
        return
      }
      setActiveStep(step)
    }, delay)
    return () => clearInterval(iv)
  }, [running, speed])

  const handleRun = () => {
    setActiveStep(-1)
    setRunning(true)
  }

  return (
    <DemoBoundary name="MVC Flow Demo">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              background: running ? s.bg3 : s.accent,
              border: 'none', borderRadius: 8,
              padding: '8px 20px', color: '#fff',
              fontFamily: s.mono, fontSize: 13,
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            Send Request
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 2, position: 'relative',
        }}>
          {steps.map((st, i) => {
            const isActive = activeStep === i
            const isDone = activeStep > i
            return (
              <div key={st.label}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 16px', borderRadius: 8,
                  background: isActive ? st.color + '18' : isDone ? s.bg3 + '80' : s.bg2,
                  border: `1px solid ${isActive ? st.color : s.border}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isActive ? st.color : isDone ? s.green : s.bg3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: s.mono, fontSize: 11, color: isActive ? '#fff' : s.text3,
                    fontWeight: 700, flexShrink: 0, transition: 'all 0.3s',
                  }}>
                    {isDone ? '\u2713' : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: isActive ? st.color : s.text,
                      transition: 'color 0.3s',
                    }}>
                      {st.label}
                    </div>
                    <div style={{
                      fontSize: 12, color: s.text2, marginTop: 2,
                      maxHeight: isActive ? 60 : 0, overflow: 'hidden',
                      transition: 'all 0.3s', opacity: isActive ? 1 : 0,
                    }}>
                      {st.desc}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: s.mono, fontSize: 11,
                    color: isActive ? st.color : s.text3,
                    background: s.bg, borderRadius: 6,
                    padding: '4px 10px', maxWidth: 280,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    opacity: isActive || isDone ? 1 : 0.3,
                    transition: 'all 0.3s',
                  }}>
                    {st.code}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    width: 2, height: 2, marginLeft: 29,
                    background: isDone ? s.green : s.border,
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DemoBoundary>
  )
}
