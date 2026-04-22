import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

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

type FlashType = 'notice' | 'alert' | 'success'

interface FlashAction {
  label: string
  flashType: FlashType
  message: string
  code: string
}

const flashActions: FlashAction[] = [
  {
    label: 'Create Post',
    flashType: 'notice',
    message: 'Post was successfully created.',
    code: 'def create\n  @post = Post.new(post_params)\n  if @post.save\n    redirect_to @post, notice: "Post was successfully created."\n  end\nend',
  },
  {
    label: 'Delete Post',
    flashType: 'alert',
    message: 'Post was successfully destroyed.',
    code: 'def destroy\n  @post.destroy\n  redirect_to posts_url, alert: "Post was successfully destroyed."\nend',
  },
  {
    label: 'Login',
    flashType: 'success',
    message: 'Welcome back, Alice!',
    code: 'def create\n  user = User.authenticate(params)\n  if user\n    session[:user_id] = user.id\n    redirect_to dashboard, success: "Welcome back, #{user.name}!"\n  end\nend',
  },
  {
    label: 'Validation Error',
    flashType: 'alert',
    message: 'Title cannot be blank.',
    code: 'def create\n  @post = Post.new(post_params)\n  if @post.save\n    redirect_to @post, notice: "Created!"\n  else\n    flash.now[:alert] = "Title cannot be blank."\n    render :new\n  end\nend',
  },
]

const flashColors: Record<FlashType, { bg: string; border: string; text: string }> = {
  notice: { bg: `${s.accent}15`, border: `${s.accent}44`, text: s.accent },
  alert: { bg: `${s.red}15`, border: `${s.red}44`, text: s.red },
  success: { bg: `${s.green}15`, border: `${s.green}44`, text: s.green },
}

const defaultControllerCode = 'class PostsController < ApplicationController\n  def index\n    @posts = Post.all\n  end\nend'

export default function FlashMessageDemo() {
  const [flashMode, setFlashMode] = useState<'flash' | 'flash.now'>('flash')
  const [currentFlash, setCurrentFlash] = useState<FlashAction | null>(null)
  const [requestCount, setRequestCount] = useState(1)
  const [flashVisible, setFlashVisible] = useState(false)

  const controllerHtml = useMemo(() => {
    const code = currentFlash ? currentFlash.code : defaultControllerCode
    return Prism.highlight(code, Prism.languages.ruby, 'ruby')
  }, [currentFlash])

  const simulateAction = (action: FlashAction) => {
    if (flashMode === 'flash') {
      setCurrentFlash(action)
      setFlashVisible(true)
      setRequestCount(1)
    } else {
      setCurrentFlash(action)
      setFlashVisible(true)
      setRequestCount(1)
    }
  }

  const nextRequest = () => {
    setRequestCount(prev => prev + 1)
    if (flashMode === 'flash' && requestCount >= 1) {
      setFlashVisible(false)
    }
  }

  const reset = () => {
    setCurrentFlash(null)
    setFlashVisible(false)
    setRequestCount(1)
  }

  return (
    <DemoBoundary name="Flash Messages">
    <div className="fmc" style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Flash Messages</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Flash messages survive one redirect. Toggle between flash and flash.now to see the difference in behavior.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => { setFlashMode('flash'); reset() }}
            style={{
              background: flashMode === 'flash' ? s.accent : s.bg3,
              border: `1px solid ${flashMode === 'flash' ? s.accent : s.border}`,
              borderRadius: 8, padding: '6px 16px',
              color: flashMode === 'flash' ? '#fff' : s.text2,
              ...M, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            flash
          </button>
          <button
            onClick={() => { setFlashMode('flash.now'); reset() }}
            style={{
              background: flashMode === 'flash.now' ? s.orange : s.bg3,
              border: `1px solid ${flashMode === 'flash.now' ? s.orange : s.border}`,
              borderRadius: 8, padding: '6px 16px',
              color: flashMode === 'flash.now' ? '#fff' : s.text2,
              ...M, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            flash.now
          </button>
          <span style={{ fontSize: 12, color: s.text3, lineHeight: '30px' }}>
            {flashMode === 'flash'
              ? 'Survives one redirect (available on the NEXT request)'
              : 'Available only on the CURRENT request (render, not redirect)'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {flashActions.map(action => (
            <button
              key={action.label}
              onClick={() => simulateAction(action)}
              style={{
                background: s.bg3, border: `1px solid ${s.border}`,
                borderRadius: 8, padding: '8px 16px',
                color: s.text2, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {action.label}
            </button>
          ))}
          {currentFlash && (
            <button
              onClick={nextRequest}
              style={{
                background: s.accent, border: 'none',
                borderRadius: 8, padding: '8px 16px',
                color: '#fff', fontSize: 13, cursor: 'pointer',
                fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              Next Request ({requestCount} {'->'} {requestCount + 1})
            </button>
          )}
          {currentFlash && (
            <button
              onClick={reset}
              style={{
                background: 'transparent', border: `1px solid ${s.border}`,
                borderRadius: 8, padding: '8px 16px',
                color: s.text3, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Reset
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Browser (Request #{requestCount})
            </div>
            <div style={{
              background: s.bg3, borderRadius: 10, padding: 20,
              border: `1px solid ${s.border}`, minHeight: 120,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, ...M }}>GET /posts</div>
              {flashVisible && currentFlash ? (
                <div style={{
                  background: flashColors[currentFlash.flashType].bg,
                  border: `1px solid ${flashColors[currentFlash.flashType].border}`,
                  borderRadius: 8, padding: '12px 16px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: flashColors[currentFlash.flashType].text, marginBottom: 4 }}>
                    {currentFlash.flashType}
                  </div>
                  <div style={{ fontSize: 13, color: flashColors[currentFlash.flashType].text }}>
                    {currentFlash.message}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: s.text3, padding: '12px 0' }}>
                  {currentFlash
                    ? `${flashMode === 'flash' && requestCount > 1 ? 'Flash message cleared -- it only lasted one request' : 'No flash message'}`
                    : 'Simulate an action to see a flash message'}
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Controller
            </div>
            <div style={{
              background: s.bg3, borderRadius: 10, padding: 16,
              border: `1px solid ${s.border}`,
              ...M, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre',
              minHeight: 120,
            }}>
              <code dangerouslySetInnerHTML={{ __html: controllerHtml }} />
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>{`
      .fmc code .token.keyword { color: #f92672; }
      .fmc code .token.string, .fmc code .token.char, .fmc code .token.builtin, .fmc code .token.inserted { color: #e6db74; }
      .fmc code .token.number, .fmc code .token.constant, .fmc code .token.symbol, .fmc code .token.property, .fmc code .token.tag, .fmc code .token.boolean, .fmc code .token.deleted { color: #ae81ff; }
      .fmc code .token.selector, .fmc code .token.attr-name { color: #f92672; }
      .fmc code .token.attr-value, .fmc code .token.atrule { color: #e6db74; }
      .fmc code .token.function, .fmc code .token.class-name { color: #a6e22e; }
      .fmc code .token.operator, .fmc code .token.entity, .fmc code .token.url, .fmc code .token.punctuation { color: #f8f8f2; }
      .fmc code .token.comment, .fmc code .token.prolog, .fmc code .token.doctype, .fmc code .token.cdata { color: #75715e; font-style: italic; }
      .fmc code .token.parameter, .fmc code .token.variable, .fmc code .token.regex, .fmc code .token.important { color: #fd971f; }
    `}</style>
    </DemoBoundary>
  )
}
