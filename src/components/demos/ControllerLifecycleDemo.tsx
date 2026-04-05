import { useState, useRef, useEffect, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

const lifecycleSteps = [
  {
    label: 'Routing',
    desc: 'Rails router matches the incoming request URL to a controller and action',
    code: '# config/routes.rb\nget "/posts/:id", to: "posts#show"',
    timing: '~0.1ms',
    color: s.accent,
  },
  {
    label: 'Before Filters',
    desc: 'Callbacks run before the action: authentication, authorization, set variables',
    code: '# app/controllers/application_controller.rb\nbefore_action :authenticate_user!\nbefore_action :set_post, only: [:show, :edit, :update]',
    timing: '~5-50ms',
    color: s.orange,
  },
  {
    label: 'Controller Action',
    desc: 'The action method executes: queries the database, processes business logic',
    code: '# app/controllers/posts_controller.rb\ndef show\n  @post = Post.find(params[:id])\n  @comments = @post.comments.recent\nend',
    timing: '~10-200ms',
    color: s.green,
  },
  {
    label: 'After Filters',
    desc: 'Callbacks run after the action: logging, cleanup, analytics',
    code: '# app/controllers/application_controller.rb\nafter_action :log_request\ndef log_request\n  Rails.logger.info "Request completed"\nend',
    timing: '~1-5ms',
    color: s.yellow,
  },
  {
    label: 'Rendering',
    desc: 'Rails renders the view template with instance variables from the action',
    code: '# app/views/posts/show.html.erb\n<h1><%= @post.title %></h1>\n<p><%= @post.body %></p>',
    timing: '~5-50ms',
    color: s.purple,
  },
  {
    label: 'Response',
    desc: 'Complete HTML response sent back to the browser with status 200',
    code: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html>...</html>',
    timing: 'Total: ~50-500ms',
    color: s.green,
  },
]

const stepCodeHtml = lifecycleSteps.map(st => Prism.highlight(st.code, Prism.languages.ruby, 'ruby'))

export default function ControllerLifecycleDemo() {
  const [step, setStep] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(false)
  const stepRef = useRef(-1)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      stepRef.current++
      setStep(stepRef.current)
      if (stepRef.current >= lifecycleSteps.length - 1) {
        setRunning(false)
      }
    }, getStepDelay(1400, speed))
    return () => clearInterval(id)
  }, [running, speed])

  const startAutoplay = () => {
    stepRef.current = -1
    setStep(-1)
    setRunning(true)
  }

  return (
    <DemoBoundary name="Controller Lifecycle">
    <div className="clc" style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Request Lifecycle</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Every request travels through the same pipeline. Click "Send Request" to watch a GET /posts/42 flow through each phase of the controller lifecycle.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { if (step >= lifecycleSteps.length - 1) setStep(-1); else setStep(p => p + 1) }}
            style={{
              background: step >= lifecycleSteps.length - 1 ? s.border2 : s.accent, border: 'none',
              borderRadius: 8, padding: '8px 20px', color: step >= lifecycleSteps.length - 1 ? s.text2 : '#fff',
              cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
            }}
          >
            {step >= lifecycleSteps.length - 1 ? 'Reset' : 'Send Request'}
          </button>
          <button
            onClick={startAutoplay}
            disabled={running}
            style={{
              background: 'transparent', border: `1px solid ${s.border}`,
              borderRadius: 8, padding: '8px 16px', color: running ? s.text3 : s.text2,
              cursor: running ? 'not-allowed' : 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}
          >
            Auto-play
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          {step >= 0 && (
            <span style={{ ...M, fontSize: 12, color: s.text3 }}>Step {Math.min(step + 1, lifecycleSteps.length)} / {lifecycleSteps.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {lifecycleSteps.map((item, i) => {
            const active = i === step
            const done = i < step
            const pending = i > step
            return (
              <div key={i} style={{ display: 'flex', gap: 14, opacity: pending ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: done ? s.green : active ? item.color : s.bg3,
                    border: `2px solid ${done ? s.green : active ? item.color : s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: (done || active) ? '#fff' : s.text3,
                    transition: 'all 0.3s', flexShrink: 0,
                  }}>
                    {done ? String.fromCharCode(10003) : String(i + 1)}
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 16, background: done ? s.green : s.border, transition: 'background 0.3s' }} />
                  )}
                </div>
                <div style={{ paddingBottom: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: done ? s.green : active ? item.color : s.text2, transition: 'color 0.3s' }}>
                      {item.label}
                    </span>
                    <span style={{ ...M, fontSize: 10, color: s.text3 }}>{item.timing}</span>
                  </div>
                  <div style={{ fontSize: 12, color: s.text2, marginBottom: active ? 6 : 0, lineHeight: 1.5 }}>{item.desc}</div>
                  {active && (
                    <div style={{
                      background: s.bg, border: `1px solid ${s.border2}`, borderRadius: 8,
                      padding: '10px 14px', ...M, fontSize: 12,
                      transition: 'all 0.25s', whiteSpace: 'pre', lineHeight: 1.5,
                    }}>
                      <code dangerouslySetInnerHTML={{ __html: stepCodeHtml[i] }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
    <style>{`
      .clc code .token.keyword { color: #f92672; }
      .clc code .token.string, .clc code .token.char, .clc code .token.builtin, .clc code .token.inserted { color: #e6db74; }
      .clc code .token.number, .clc code .token.constant, .clc code .token.symbol, .clc code .token.property, .clc code .token.tag, .clc code .token.boolean, .clc code .token.deleted { color: #ae81ff; }
      .clc code .token.selector, .clc code .token.attr-name { color: #f92672; }
      .clc code .token.attr-value, .clc code .token.atrule { color: #e6db74; }
      .clc code .token.function, .clc code .token.class-name { color: #a6e22e; }
      .clc code .token.operator, .clc code .token.entity, .clc code .token.url, .clc code .token.punctuation { color: #f8f8f2; }
      .clc code .token.comment, .clc code .token.prolog, .clc code .token.doctype, .clc code .token.cdata { color: #75715e; font-style: italic; }
      .clc code .token.parameter, .clc code .token.variable, .clc code .token.regex, .clc code .token.important { color: #fd971f; }
    `}</style>
    </DemoBoundary>
  )
}
