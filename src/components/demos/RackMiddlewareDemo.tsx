import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Middleware {
  id: string
  name: string
  short: string
  desc: string
  code: string
  enabled: boolean
  color: string
  timing: number
}

const defaultMiddlewares: Middleware[] = [
  {
    id: 'runtime',
    name: 'Rack::Runtime',
    short: 'Runtime',
    desc: 'Adds an X-Runtime response header with the time taken to process the request (in seconds). Useful for performance monitoring.',
    code: `class Rack::Runtime
  def initialize(app)
    @app = app
  end

  def call(env)
    start = Process.clock_gettime(
      Process::CLOCK_MONOTONIC
    )
    status, headers, body =
      @app.call(env)
    stop = Process.clock_gettime(
      Process::CLOCK_MONOTONIC
    )
    headers['X-Runtime'] =
      "%.6f" % (stop - start)
    [status, headers, body]
  end
end`,
    enabled: true,
    color: s.green,
    timing: 0,
  },
  {
    id: 'host_auth',
    name: 'ActionDispatch::HostAuthorization',
    short: 'HostAuth',
    desc: 'Validates the Host header to prevent DNS rebinding and host header injection attacks. Only allows whitelisted hosts.',
    code: `module ActionDispatch
  class HostAuthorization
    def initialize(app, hosts: nil)
      @app = app
      @hosts = hosts
    end

    def call(env)
      host = env['HTTP_HOST']
      if authorized?(host)
        @app.call(env)
      else
        [403, {}, ['Forbidden']]
      end
    end
  end
end`,
    enabled: true,
    color: s.red,
    timing: 2,
  },
  {
    id: 'security',
    name: 'ActionDispatch::SecurityHeaders',
    short: 'SecHeaders',
    desc: 'Sets security-related HTTP headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Content-Security-Policy.',
    code: `module ActionDispatch
  class SecurityHeaders
    def call(env)
      status, headers, body =
        @app.call(env)
      headers['X-Frame-Options'] =
        'SAMEORIGIN'
      headers[
        'X-Content-Type-Options'
      ] = 'nosniff'
      headers['X-XSS-Protection'] =
        '1; mode=block'
      [status, headers, body]
    end
  end
end`,
    enabled: true,
    color: s.orange,
    timing: 5,
  },
  {
    id: 'logger',
    name: 'Rails::Rack::Logger',
    short: 'Logger',
    desc: 'Logs incoming request details (method, path, IP, parameters) and timing information to the Rails log.',
    code: `module Rails
  module Rack
    class Logger
      def call(env)
        path = env['PATH_INFO']
        method = env['REQUEST_METHOD']
        logger.info(
          "Started \#{method} " \\
          "\#{path}"
        )
        status, headers, body =
          @app.call(env)
        logger.info(
          "Completed \#{status}"
        )
        [status, headers, body]
      end
    end
  end
end`,
    enabled: true,
    color: s.accent,
    timing: 8,
  },
  {
    id: 'static',
    name: 'ActionDispatch::Static',
    short: 'Static',
    desc: 'Serves static files (CSS, JS, images) from the public/ directory. Returns 404 if file not found, passing to the next middleware.',
    code: `module ActionDispatch
  class Static
    def initialize(app, path)
      @app = app
      @file_server =
        Rack::File.new(path)
    end

    def call(env)
      path = env['PATH_INFO']
      if file?(path)
        @file_server.call(env)
      else
        @app.call(env)
      end
    end
  end
end`,
    enabled: true,
    color: s.purple,
    timing: 11,
  },
  {
    id: 'app',
    name: 'YourApp::Application',
    short: 'App',
    desc: 'The Rails application itself. Routes the request to the correct controller action, processes it, and returns the response.',
    code: `module YourApp
  class Application < Rails::Application
    config.routes.draw do
      resources :posts
      root "posts#index"
    end
  end
end

# Incoming request:
# GET /posts/42
#   -> PostsController#show
#   -> { id: 42 }
#   -> renders HTML/JSON
#   -> [200, headers, [body]]`,
    enabled: true,
    color: s.yellow,
    timing: 14,
  },
]

const rackProtocolCode = `# Every Rack app responds to #call
def call(env)
  # env: Hash of request details
  # Returns array of 3 elements:
  [
    200,                     # status
    {"Content-Type" => ...}, # headers
    ["Hello World"]          # body
  ]
end

# Middleware wraps the app:
class MyMiddleware
  def initialize(app)
    @app = app  # next in chain
  end

  def call(env)
    # pre-processing
    status, headers, body =
      @app.call(env)
    # post-processing
    [status, headers, body]
  end
end`

const rackProtocolHtml = Prism.highlight(rackProtocolCode, Prism.languages.ruby, 'ruby')

export default function RackMiddlewareDemo() {
  const [middlewares, setMiddlewares] = useState(defaultMiddlewares)
  const [selected, setSelected] = useState<string | null>(null)
  const [requestStep, setRequestStep] = useState(-1)
  const [animating, setAnimating] = useState(false)

  const selectedMw = middlewares.find((m) => m.id === selected)
  const enabledMw = middlewares.filter((m) => m.enabled)

  const mwCodeHtml = useMemo(() => {
    if (!selectedMw) return ''
    return Prism.highlight(selectedMw.code, Prism.languages.ruby, 'ruby')
  }, [selectedMw])

  const toggleMiddleware = (id: string) => {
    setMiddlewares((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    )
    setSelected(null)
    setRequestStep(-1)
  }

  const simulateRequest = () => {
    if (animating) return
    setAnimating(true)
    setRequestStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      setRequestStep(step)
      if (step >= enabledMw.length + 1) {
        clearInterval(interval)
        setTimeout(() => {
          setAnimating(false)
        }, 600)
      }
    }, 500)
  }

  return (
    <DemoBoundary name="Rack Middleware Demo">
      <div className="rmwc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
.rmwc code .token.keyword { color: #f92672; }
.rmwc code .token.string, .rmwc code .token.char, .rmwc code .token.builtin, .rmwc code .token.inserted { color: #e6db74; }
.rmwc code .token.number, .rmwc code .token.constant, .rmwc code .token.symbol, .rmwc code .token.property, .rmwc code .token.tag, .rmwc code .token.boolean, .rmwc code .token.deleted { color: #ae81ff; }
.rmwc code .token.selector, .rmwc code .token.attr-name { color: #f92672; }
.rmwc code .token.attr-value, .rmwc code .token.atrule { color: #e6db74; }
.rmwc code .token.function, .rmwc code .token.class-name { color: #a6e22e; }
.rmwc code .token.operator, .rmwc code .token.entity, .rmwc code .token.url, .rmwc code .token.punctuation { color: #f8f8f2; }
.rmwc code .token.comment, .rmwc code .token.prolog, .rmwc code .token.doctype, .rmwc code .token.cdata { color: #75715e; font-style: italic; }
.rmwc code .token.parameter, .rmwc code .token.variable, .rmwc code .token.regex, .rmwc code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={simulateRequest}
            disabled={animating}
            style={{
              background: animating ? s.bg3 : s.accent,
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              color: animating ? s.text3 : '#fff',
              fontFamily: s.mono,
              fontSize: 11,
              cursor: animating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {animating ? 'Processing...' : 'Simulate Request'}
          </button>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            GET /posts/42
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>
            {enabledMw.length} active middleware
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Middleware Stack
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                <span style={{ color: s.text2, fontSize: 10, fontFamily: s.mono }}>Rack Middleware Chain</span>
              </div>
              {middlewares.map((mw) => {
                const isActive = requestStep >= 0 && requestStep <= enabledMw.length && enabledMw[requestStep - 1]?.id === mw.id
                const isDone = requestStep >= 0 && enabledMw.indexOf(mw) < requestStep - 1
                return (
                  <div
                    key={mw.id}
                    onClick={() => setSelected(selected === mw.id ? null : mw.id)}
                    style={{
                      padding: '8px 12px',
                      borderBottom: `1px solid ${s.border}`,
                      background: selected === mw.id ? s.bg3 : isActive ? `${mw.color}15` : isDone ? `${s.green}08` : 'transparent',
                      borderLeft: isActive ? `3px solid ${mw.color}` : isDone ? `3px solid ${s.green}44` : '3px solid transparent',
                      cursor: mw.enabled ? 'pointer' : 'default',
                      opacity: mw.enabled ? 1 : 0.4,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isActive ? mw.color : isDone ? s.green : mw.enabled ? s.text3 : s.red,
                        boxShadow: isActive ? `0 0 8px ${mw.color}` : 'none',
                        transition: 'all 0.2s',
                      }} />
                      <div>
                        <div style={{ color: isActive ? mw.color : s.text, fontSize: 11, fontFamily: s.mono }}>{mw.short}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMiddleware(mw.id) }}
                      style={{
                        background: mw.enabled ? s.green : s.red,
                        border: 'none',
                        borderRadius: 3,
                        width: 32,
                        height: 16,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2,
                        left: mw.enabled ? 17 : 3,
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>
                )
              })}
              {requestStep === enabledMw.length + 1 && (
                <div style={{ padding: '10px 12px', background: `${s.green}11`, borderTop: `1px solid ${s.border}` }}>
                  <div style={{ color: s.green, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>
                    200 OK -- {enabledMw.length} middleware processed
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {selectedMw ? selectedMw.name : 'Select Middleware'}
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {selectedMw ? (
                <div>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedMw.color }} />
                    <span style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>{selectedMw.name}</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ color: s.text, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                      {selectedMw.desc}
                    </div>
                    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: 12 }}>
                      <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginBottom: 6 }}>SOURCE</div>
                      <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.6, whiteSpace: 'pre' }}>
                        <code dangerouslySetInnerHTML={{ __html: mwCodeHtml }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: s.text3, fontSize: 12, fontFamily: s.mono }}>
                  Click a middleware in the stack to see what it does and how it is implemented.
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Rack Protocol
              </div>
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: rackProtocolHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
